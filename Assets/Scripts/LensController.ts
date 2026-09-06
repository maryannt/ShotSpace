/**
 * LensController — simulates familiar focal-length choices by changing only
 * the authored ShotCamera's field of view.
 */

export type LensPreset = Readonly<{
  displayLabel: string
  focalLengthMm: number
  fovRadians: number
}>

export const LENS_PRESET_24MM: LensPreset = Object.freeze({
  displayLabel: "24mm",
  focalLengthMm: 24,
  fovRadians: 0.798,
})

export const LENS_PRESET_35MM: LensPreset = Object.freeze({
  displayLabel: "35mm",
  focalLengthMm: 35,
  fovRadians: 0.563,
})

export const LENS_PRESET_50MM: LensPreset = Object.freeze({
  displayLabel: "50mm",
  focalLengthMm: 50,
  fovRadians: 0.400,
})

export const LENS_PRESET_85MM: LensPreset = Object.freeze({
  displayLabel: "85mm",
  focalLengthMm: 85,
  fovRadians: 0.237,
})

export type PresetChangedListener = (preset: LensPreset) => void

@component
export class LensController extends BaseScriptComponent {
  @input
  @hint("Authored ShotCamera SceneObject whose Camera field of view is controlled.")
  shotCamera!: SceneObject

  private shotCameraComponent: Camera | null = null
  private selectedPreset: LensPreset | null = null
  private readonly presetChangedListeners: PresetChangedListener[] = []

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.onStart())
  }

  private onStart(): void {
    if (isNull(this.shotCamera)) {
      console.error("[LensController] ShotCamera input is not wired.")
      return
    }

    const camera = this.shotCamera.getComponent("Component.Camera") as Camera | null
    if (isNull(camera)) {
      console.error("[LensController] ShotCamera has no Camera component.")
      return
    }

    this.shotCameraComponent = camera
    this.applyPreset(LENS_PRESET_50MM)
  }

  /**
   * The preset values are simulated focal lengths. Camera.fov expects radians,
   * so each canonical value is assigned directly without degree conversion.
   */
  public applyPreset(preset: LensPreset): void {
    if (isNull(this.shotCameraComponent)) {
      console.error("[LensController] Cannot apply preset: ShotCamera Camera is unavailable.")
      return
    }

    this.shotCameraComponent.fov = preset.fovRadians
    this.selectedPreset = preset
    this.emitPresetChanged(preset)
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

  public getCurrentPreset(): LensPreset | null {
    return this.selectedPreset
  }

  /**
   * Typed UI-facing preset event. Returns an unsubscribe function.
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

  private emitPresetChanged(preset: LensPreset): void {
    const listeners = this.presetChangedListeners.slice()
    listeners.forEach((listener) => listener(preset))
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
}
