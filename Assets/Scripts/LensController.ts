/**
 * LensController — the single source of truth for ShotSpace focal length and
 * subject framing. Only the authored ShotCamera and ShotCameraRig are changed.
 */

export type LensPreset = Readonly<{
  displayLabel: string
  focalLengthMm: number
  fovRadians: number
  distortionK1: number
  distortionK2: number
  distortionDescription: string
}>

export const LENS_PRESET_24MM: LensPreset = Object.freeze({
  displayLabel: "24mm",
  focalLengthMm: 24,
  fovRadians: 0.798,
  distortionK1: -0.080,
  distortionK2: 0.015,
  distortionDescription: "BARREL",
})

export const LENS_PRESET_35MM: LensPreset = Object.freeze({
  displayLabel: "35mm",
  focalLengthMm: 35,
  fovRadians: 0.563,
  distortionK1: -0.035,
  distortionK2: 0.005,
  distortionDescription: "MILD BARREL",
})

export const LENS_PRESET_50MM: LensPreset = Object.freeze({
  displayLabel: "50mm",
  focalLengthMm: 50,
  fovRadians: 0.400,
  distortionK1: 0.000,
  distortionK2: 0.000,
  distortionDescription: "NEUTRAL",
})

export const LENS_PRESET_85MM: LensPreset = Object.freeze({
  displayLabel: "85mm",
  focalLengthMm: 85,
  fovRadians: 0.237,
  distortionK1: 0.012,
  distortionK2: 0.000,
  distortionDescription: "SUBTLE PINCUSHION",
})

export type FramingPreset = Readonly<{
  displayLabel: string
  frameFill: number
}>

export const FRAMING_PRESET_WIDE: FramingPreset = Object.freeze({
  displayLabel: "WIDE",
  frameFill: 0.35,
})

export const FRAMING_PRESET_MEDIUM: FramingPreset = Object.freeze({
  displayLabel: "MEDIUM",
  frameFill: 0.60,
})

export const FRAMING_PRESET_CLOSE_UP: FramingPreset = Object.freeze({
  displayLabel: "CLOSE-UP",
  frameFill: 0.85,
})

export type ShotFramingState = Readonly<{
  currentLens: LensPreset
  currentFraming: FramingPreset
  framingDisplayLabel: string
  matchFramingEnabled: boolean
  lensDistortionEnabled: boolean
  isCustomFraming: boolean
  distanceCm: number
}>

export type PresetChangedListener = (preset: LensPreset) => void
export type ShotFramingStateChangedListener = (state: ShotFramingState) => void

const DIRECTION_EPSILON_SQUARED = 0.000001
const PARALLEL_UP_DOT_THRESHOLD = 0.999

@component
export class LensController extends BaseScriptComponent {
  @input
  @hint("Authored ShotCamera SceneObject whose Camera field of view is controlled.")
  shotCamera!: SceneObject

  @input
  @hint("Existing authored ShotCameraRig moved to match the selected subject framing.")
  shotCameraRig!: SceneObject

  @input
  @hint("Authored subject target that the ShotCameraRig aims toward.")
  framingTarget!: SceneObject

  @input
  @hint("Existing PreviewScreen whose assigned distortion material is cloned once for unique runtime control.")
  previewScreen!: SceneObject

  @input
  @hint("Existing ShotPreviewRT sampled by the unique PreviewScreen distortion material instance.")
  shotPreviewRenderTarget!: Texture

  @input
  @hint("Estimated subject height in centimeters, used by the exact framing-distance calculation.")
  @widget(new SliderWidget(1, 30, 0.1))
  subjectHeightCm: number = 6.0

  @input
  @hint("When enabled, focal changes preserve the selected framing by repositioning the ShotCameraRig.")
  matchFramingEnabled: boolean = true

  @input
  @hint("When enabled, the active lens profile is blended into PreviewScreen UVs.")
  lensDistortionEnabled: boolean = true

  private shotCameraComponent: Camera | null = null
  private previewDistortionMaterial: Material | null = null
  private selectedPreset: LensPreset | null = null
  private selectedFramingPreset: FramingPreset = FRAMING_PRESET_MEDIUM
  private lastAutomaticFramingPreset: FramingPreset = FRAMING_PRESET_MEDIUM
  private currentCameraDistanceCm: number = 0
  private isCustomFraming: boolean = false
  private automaticFramingSuspended: boolean = false
  private readonly presetChangedListeners: PresetChangedListener[] = []
  private readonly stateChangedListeners: ShotFramingStateChangedListener[] = []

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.onStart())
  }

  private onStart(): void {
    if (!this.resolveShotCamera()) {
      return
    }

    this.validateFramingReferences()
    this.resolvePreviewDistortionMaterial()

    // Establish the complete default atomically so startup emits one compatible
    // preset event and one combined-state event with no intermediate state.
    this.shotCameraComponent!.fov = LENS_PRESET_50MM.fovRadians
    this.selectedPreset = LENS_PRESET_50MM
    this.selectedFramingPreset = FRAMING_PRESET_MEDIUM
    this.lastAutomaticFramingPreset = FRAMING_PRESET_MEDIUM
    this.isCustomFraming = false
    this.automaticFramingSuspended = false
    this.matchFramingEnabled = true
    this.lensDistortionEnabled = true
    this.applyDistortionProfile(LENS_PRESET_50MM)
    this.applyDistortionBlend()
    this.applyCurrentFramingTransform()
    this.refreshActualDistance()
    this.emitPresetChanged(LENS_PRESET_50MM)
    this.emitStateChanged()
  }

  /**
   * Camera.fov expects radians, so each canonical value is assigned directly
   * without degree conversion. FOV is always changed before optional matching.
   */
  public applyPreset(preset: LensPreset): void {
    if (!this.ensureShotCameraAvailable("apply lens preset")) {
      return
    }

    this.shotCameraComponent!.fov = preset.fovRadians
    this.selectedPreset = preset
    this.applyDistortionProfile(preset)

    if (this.matchFramingEnabled && !this.automaticFramingSuspended && !this.isCustomFraming) {
      this.applyCurrentFramingTransform()
    }
    this.refreshActualDistance()

    this.emitPresetChanged(preset)
    this.emitStateChanged()
    console.info(
      `[LensController] Applied ${preset.displayLabel} preset (fov ${preset.fovRadians} rad).`
    )
  }

  public applyPresetByFocalLength(focalLengthMm: number): void {
    const preset = this.getCanonicalPreset(focalLengthMm)
    if (isNull(preset)) {
      console.error(
        `[LensController] Unsupported focal length: ${focalLengthMm}mm. Use 24, 35, 50, or 85.`
      )
      return
    }

    this.applyPreset(preset)
  }

  /**
   * Explicit framing selections always reposition and aim the existing rig,
   * independent of whether automatic focal-length matching is enabled.
   */
  public applyFramingPreset(preset: FramingPreset): void {
    this.selectedFramingPreset = preset
    this.lastAutomaticFramingPreset = preset
    this.isCustomFraming = false
    this.automaticFramingSuspended = false
    this.applyCurrentFramingTransform()
    this.refreshActualDistance()
    this.emitStateChanged()
  }

  public applyFramingByLabel(label: string): void {
    const preset = this.getCanonicalFramingPreset(label)
    if (isNull(preset)) {
      console.error(
        `[LensController] Unsupported framing label: ${label}. Use WIDE, MEDIUM, or CLOSE-UP.`
      )
      return
    }

    this.applyFramingPreset(preset)
  }

  public setMatchFramingEnabled(enabled: boolean): void {
    if (this.matchFramingEnabled === enabled) {
      if (enabled) {
        this.isCustomFraming = false
        this.automaticFramingSuspended = false
        this.applyCurrentFramingTransform()
        this.refreshActualDistance()
        this.emitStateChanged()
      }
      return
    }

    this.matchFramingEnabled = enabled
    if (enabled) {
      this.isCustomFraming = false
      this.automaticFramingSuspended = false
      this.applyCurrentFramingTransform()
    }
    this.refreshActualDistance()
    this.emitStateChanged()
  }

  /**
   * Manual camera grabs must not fight automatic Match Framing. Call this when
   * CameraProxyMesh manipulation starts so the rig is not snapped mid-grab.
   */
  public beginManualCameraManipulation(): void {
    this.automaticFramingSuspended = true
  }

  /**
   * Completing a manual camera move records a CUSTOM framing, turns Match
   * Framing off, and preserves the current lens and distortion profile.
   */
  public endManualCameraManipulation(): void {
    this.automaticFramingSuspended = false
    this.isCustomFraming = true
    this.matchFramingEnabled = false
    this.refreshActualDistance()
    this.emitStateChanged()
  }

  /**
   * Re-applies the last non-custom framing preset to ActorA without changing
   * the current lens or distortion state.
   */
  public reframeActorA(): void {
    const framing = this.lastAutomaticFramingPreset || FRAMING_PRESET_MEDIUM
    this.applyFramingPreset(framing)
  }

  /**
   * Restores the coordinated default shot state. Caller restores transforms.
   */
  public restoreDefaultShotState(): void {
    if (!this.ensureShotCameraAvailable("restore default shot state")) {
      return
    }

    this.automaticFramingSuspended = false
    this.isCustomFraming = false
    this.selectedPreset = LENS_PRESET_50MM
    this.selectedFramingPreset = FRAMING_PRESET_MEDIUM
    this.lastAutomaticFramingPreset = FRAMING_PRESET_MEDIUM
    this.matchFramingEnabled = true
    this.lensDistortionEnabled = true
    this.shotCameraComponent!.fov = LENS_PRESET_50MM.fovRadians
    this.applyDistortionProfile(LENS_PRESET_50MM)
    this.applyDistortionBlend()
    this.applyCurrentFramingTransform()
    this.refreshActualDistance()
    this.emitPresetChanged(LENS_PRESET_50MM)
    this.emitStateChanged()
  }

  /**
   * Distortion is an isolated PreviewScreen material state. It never changes
   * focal length, framing, Match Framing, or any authored camera transform.
   */
  public setLensDistortionEnabled(enabled: boolean): void {
    if (this.lensDistortionEnabled === enabled) {
      this.applyDistortionBlend()
      this.emitStateChanged()
      return
    }

    this.lensDistortionEnabled = enabled
    this.applyDistortionBlend()
    this.emitStateChanged()
  }

  public getCurrentPreset(): LensPreset | null {
    return this.selectedPreset
  }

  public getCurrentFramingPreset(): FramingPreset {
    return this.selectedFramingPreset
  }

  public getLastAutomaticFramingPreset(): FramingPreset {
    return this.lastAutomaticFramingPreset
  }

  public getIsCustomFraming(): boolean {
    return this.isCustomFraming
  }

  public getMatchFramingEnabled(): boolean {
    return this.matchFramingEnabled
  }

  public getLensDistortionEnabled(): boolean {
    return this.lensDistortionEnabled
  }

  public getCurrentCameraDistanceCm(): number {
    this.refreshActualDistance()
    return this.currentCameraDistanceCm
  }

  public getCurrentState(): ShotFramingState | null {
    if (isNull(this.selectedPreset)) {
      return null
    }

    this.refreshActualDistance()
    return this.createStateSnapshot()
  }

  /**
   * On-demand diagnostic only. Returns normalized subject screen-height fill,
   * measured from target +/- subjectHeight/2 along world Y.
   */
  public verifyCurrentFramingFill(): number | null {
    if (!this.ensureShotCameraAvailable("verify framing fill")) {
      return null
    }
    if (!this.framingTarget || isNull(this.framingTarget)) {
      console.error("[LensController] Cannot verify framing: framingTarget input is not wired.")
      return null
    }
    if (!this.isValidPositiveNumber(this.subjectHeightCm)) {
      console.error("[LensController] Cannot verify framing: subjectHeightCm must be greater than zero.")
      return null
    }

    const targetPosition = this.framingTarget.getTransform().getWorldPosition()
    const halfHeight = this.subjectHeightCm / 2
    const top = targetPosition.add(new vec3(0, halfHeight, 0))
    const bottom = targetPosition.add(new vec3(0, -halfHeight, 0))
    const topScreen = this.shotCameraComponent!.worldSpaceToScreenSpace(top)
    const bottomScreen = this.shotCameraComponent!.worldSpaceToScreenSpace(bottom)
    const fill = Math.abs(bottomScreen.y - topScreen.y)
    console.info(`[LensController] Estimated subject screen-height fill: ${fill}.`)
    return fill
  }

  /**
   * Typed focal-preset event retained for compatibility.
   */
  public addPresetChangedListener(listener: PresetChangedListener): () => void {
    if (this.presetChangedListeners.indexOf(listener) < 0) {
      this.presetChangedListeners.push(listener)
    }

    return () => this.removePresetChangedListener(listener)
  }

  public removePresetChangedListener(listener: PresetChangedListener): void {
    const index = this.presetChangedListeners.indexOf(listener)
    if (index >= 0) {
      this.presetChangedListeners.splice(index, 1)
    }
  }

  public addStateChangedListener(listener: ShotFramingStateChangedListener): () => void {
    if (this.stateChangedListeners.indexOf(listener) < 0) {
      this.stateChangedListeners.push(listener)
    }

    return () => this.removeStateChangedListener(listener)
  }

  public removeStateChangedListener(listener: ShotFramingStateChangedListener): void {
    const index = this.stateChangedListeners.indexOf(listener)
    if (index >= 0) {
      this.stateChangedListeners.splice(index, 1)
    }
  }

  private applyCurrentFramingTransform(): boolean {
    if (!this.ensureShotCameraAvailable("apply framing")) {
      return false
    }
    if (!this.shotCameraRig || isNull(this.shotCameraRig)) {
      console.error("[LensController] Cannot apply framing: shotCameraRig input is not wired.")
      return false
    }
    if (!this.framingTarget || isNull(this.framingTarget)) {
      console.error("[LensController] Cannot apply framing: framingTarget input is not wired.")
      return false
    }
    if (!this.isValidPositiveNumber(this.subjectHeightCm)) {
      console.error("[LensController] Cannot apply framing: subjectHeightCm must be greater than zero.")
      return false
    }

    const activeVerticalFov = this.shotCameraComponent!.fov
    const frameFill = this.selectedFramingPreset.frameFill
    const tangent = Math.tan(activeVerticalFov / 2)
    if (
      !this.isValidPositiveNumber(activeVerticalFov) ||
      !this.isValidPositiveNumber(frameFill) ||
      !this.isValidPositiveNumber(tangent)
    ) {
      console.error("[LensController] Cannot apply framing: FOV or frame fill is invalid.")
      return false
    }

    const distance =
      this.subjectHeightCm / (2 * frameFill * Math.tan(activeVerticalFov / 2))
    const rigTransform = this.shotCameraRig.getTransform()
    const targetPosition = this.framingTarget.getTransform().getWorldPosition()
    const currentRigPosition = rigTransform.getWorldPosition()
    const targetToCamera = currentRigPosition.sub(targetPosition)
    if (targetToCamera.lengthSquared <= DIRECTION_EPSILON_SQUARED) {
      console.error(
        "[LensController] Cannot apply framing: ShotCameraRig and framingTarget occupy the same position."
      )
      return false
    }

    const cameraBackward = targetToCamera.normalize()
    const desiredPosition = targetPosition.add(cameraBackward.uniformScale(distance))
    rigTransform.setWorldPosition(desiredPosition)

    // quat.lookAt aligns local +Z. A Lens camera looks along local -Z, so the
    // target-to-camera axis is the correct +Z vector for the rig.
    const worldUp = vec3.up()
    const safeUp =
      Math.abs(cameraBackward.dot(worldUp)) >= PARALLEL_UP_DOT_THRESHOLD
        ? vec3.right()
        : worldUp
    rigTransform.setWorldRotation(quat.lookAt(cameraBackward, safeUp))
    this.currentCameraDistanceCm = distance
    return true
  }

  private resolveShotCamera(): boolean {
    if (!this.shotCamera || isNull(this.shotCamera)) {
      console.error("[LensController] ShotCamera input is not wired.")
      return false
    }

    const camera = this.shotCamera.getComponent("Component.Camera") as Camera | null
    if (isNull(camera)) {
      console.error("[LensController] ShotCamera has no Camera component.")
      return false
    }

    this.shotCameraComponent = camera
    return true
  }

  private resolvePreviewDistortionMaterial(): boolean {
    if (!this.previewScreen || isNull(this.previewScreen)) {
      console.error("[LensController] previewScreen input is not wired; lens distortion is unavailable.")
      return false
    }

    const visual = this.previewScreen.getComponent(
      "Component.RenderMeshVisual"
    ) as RenderMeshVisual | null
    if (isNull(visual)) {
      console.error("[LensController] PreviewScreen has no RenderMeshVisual.")
      return false
    }

    const sourceMaterial = visual.mainMaterial
    if (!sourceMaterial || isNull(sourceMaterial)) {
      console.error("[LensController] PreviewScreen has no material to clone.")
      return false
    }

    const runtimeMaterial = sourceMaterial.clone()
    visual.clearMaterials()
    visual.addMaterial(runtimeMaterial)
    this.previewDistortionMaterial = runtimeMaterial

    if (this.shotPreviewRenderTarget && !isNull(this.shotPreviewRenderTarget)) {
      runtimeMaterial.mainPass.baseTex = this.shotPreviewRenderTarget
    } else {
      console.error(
        "[LensController] shotPreviewRenderTarget input is not wired; the distortion material will retain its authored texture."
      )
    }

    return true
  }

  private applyDistortionProfile(preset: LensPreset): void {
    if (isNull(this.previewDistortionMaterial)) {
      return
    }

    this.previewDistortionMaterial.mainPass.k1 = preset.distortionK1
    this.previewDistortionMaterial.mainPass.k2 = preset.distortionK2
  }

  private applyDistortionBlend(): void {
    if (isNull(this.previewDistortionMaterial)) {
      return
    }

    this.previewDistortionMaterial.mainPass.distortionBlend =
      this.lensDistortionEnabled ? 1.0 : 0.0
  }

  private ensureShotCameraAvailable(action: string): boolean {
    if (!isNull(this.shotCameraComponent)) {
      return true
    }
    if (this.resolveShotCamera()) {
      return true
    }

    console.error(`[LensController] Cannot ${action}: ShotCamera Camera is unavailable.`)
    return false
  }

  private validateFramingReferences(): void {
    if (!this.shotCameraRig || isNull(this.shotCameraRig)) {
      console.error("[LensController] shotCameraRig input is not wired; framing movement is unavailable.")
    }
    if (!this.framingTarget || isNull(this.framingTarget)) {
      console.error("[LensController] framingTarget input is not wired; framing movement is unavailable.")
    }
  }

  private refreshActualDistance(): void {
    if (
      !this.shotCameraRig ||
      isNull(this.shotCameraRig) ||
      !this.framingTarget ||
      isNull(this.framingTarget)
    ) {
      return
    }

    const rigPosition = this.shotCameraRig.getTransform().getWorldPosition()
    const targetPosition = this.framingTarget.getTransform().getWorldPosition()
    this.currentCameraDistanceCm = rigPosition.distance(targetPosition)
  }

  private createStateSnapshot(): ShotFramingState {
    return Object.freeze({
      currentLens: this.selectedPreset!,
      currentFraming: this.selectedFramingPreset,
      framingDisplayLabel: this.isCustomFraming
        ? "CUSTOM"
        : this.selectedFramingPreset.displayLabel,
      matchFramingEnabled: this.matchFramingEnabled,
      lensDistortionEnabled: this.lensDistortionEnabled,
      isCustomFraming: this.isCustomFraming,
      distanceCm: this.currentCameraDistanceCm,
    })
  }

  private emitPresetChanged(preset: LensPreset): void {
    const listeners = this.presetChangedListeners.slice()
    listeners.forEach((listener) => listener(preset))
  }

  private emitStateChanged(): void {
    if (isNull(this.selectedPreset)) {
      return
    }

    const state = this.createStateSnapshot()
    const listeners = this.stateChangedListeners.slice()
    listeners.forEach((listener) => listener(state))
  }

  private isValidPositiveNumber(value: number): boolean {
    return isFinite(value) && value > 0
  }

  private getCanonicalPreset(focalLengthMm: number): LensPreset | null {
    switch (focalLengthMm) {
      case 24:
        return LENS_PRESET_24MM
      case 35:
        return LENS_PRESET_35MM
      case 50:
        return LENS_PRESET_50MM
      case 85:
        return LENS_PRESET_85MM
      default:
        return null
    }
  }

  private getCanonicalFramingPreset(label: string): FramingPreset | null {
    switch (label.trim().toUpperCase()) {
      case "WIDE":
        return FRAMING_PRESET_WIDE
      case "MEDIUM":
        return FRAMING_PRESET_MEDIUM
      case "CLOSE-UP":
      case "CLOSE UP":
      case "CLOSEUP":
        return FRAMING_PRESET_CLOSE_UP
      default:
        return null
    }
  }
}
