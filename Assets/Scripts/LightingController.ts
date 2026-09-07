/**
 * LightingController — the single source of truth for the ShotSpace key light.
 * Intensity and color presets write only to the existing KeyLight LightSource.
 */

export type LightIntensityName = "LOW" | "MEDIUM" | "HIGH"
export type LightColorName = "WARM" | "NEUTRAL" | "COOL"

export type KeyLightState = Readonly<{
  intensityName: LightIntensityName
  colorName: LightColorName
  intensity: number
  color: vec3
}>

export type KeyLightStateChangedListener = (state: KeyLightState) => void

const INTENSITY_LOW = 1.4
const INTENSITY_MEDIUM = 3.2
const INTENSITY_HIGH = 6.4

// Approximate RGB for 3200K / 4300K / 5600K. These are creative looks, not
// a physical black-body conversion.
const COLOR_WARM = new vec3(1.0, 0.72, 0.42)
const COLOR_NEUTRAL = new vec3(1.0, 0.87, 0.7)
const COLOR_COOL = new vec3(0.92, 0.95, 1.0)

@component
export class LightingController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">Lighting Controller</span>')
  @ui.separator

  @ui.group_start("References")
  @input
  @hint("Existing KeyLight SceneObject that owns the authored LightSource.")
  keyLight!: SceneObject
  @ui.group_end

  @ui.separator
  @ui.group_start("Defaults")
  @input
  @hint("Default key-light intensity preset.")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("LOW", "LOW"),
      new ComboBoxItem("MEDIUM", "MEDIUM"),
      new ComboBoxItem("HIGH", "HIGH"),
    ])
  )
  defaultIntensityName: string = "MEDIUM"

  @input
  @hint("Default key-light color preset.")
  @widget(
    new ComboBoxWidget([
      new ComboBoxItem("WARM", "WARM"),
      new ComboBoxItem("NEUTRAL", "NEUTRAL"),
      new ComboBoxItem("COOL", "COOL"),
    ])
  )
  defaultColorName: string = "NEUTRAL"

  @input
  @hint("LOW intensity on the Lens Studio light scale.")
  @widget(new SliderWidget(0.2, 8, 0.1))
  lowIntensity: number = INTENSITY_LOW

  @input
  @hint("MEDIUM intensity on the Lens Studio light scale.")
  @widget(new SliderWidget(0.2, 10, 0.1))
  mediumIntensity: number = INTENSITY_MEDIUM

  @input
  @hint("HIGH intensity on the Lens Studio light scale.")
  @widget(new SliderWidget(0.2, 16, 0.1))
  highIntensity: number = INTENSITY_HIGH

  @input("vec3", "{1,0.72,0.42}")
  @hint("Approximate 3200K warm key color.")
  @widget(new ColorWidget())
  warmColor: vec3

  @input("vec3", "{1,0.87,0.7}")
  @hint("Approximate 4300K neutral key color.")
  @widget(new ColorWidget())
  neutralColor: vec3

  @input("vec3", "{0.92,0.95,1}")
  @hint("Approximate 5600K cool key color.")
  @widget(new ColorWidget())
  coolColor: vec3
  @ui.group_end

  private lightSource: LightSource | null = null
  private intensityName: LightIntensityName = "MEDIUM"
  private colorName: LightColorName = "NEUTRAL"
  private readonly stateChangedListeners: KeyLightStateChangedListener[] = []

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.onStart())
  }

  private onStart(): void {
    if (!this.resolveLightSource()) {
      return
    }

    this.applyIntensity(this.normalizeIntensityName(this.defaultIntensityName))
    this.applyColor(this.normalizeColorName(this.defaultColorName))
    this.emitStateChanged()
  }

  public setIntensity(name: LightIntensityName): void {
    if (!this.ensureLightAvailable("set intensity")) {
      return
    }

    this.applyIntensity(name)
    this.emitStateChanged()
  }

  public setColor(name: LightColorName): void {
    if (!this.ensureLightAvailable("set color")) {
      return
    }

    this.applyColor(name)
    this.emitStateChanged()
  }

  public resetLighting(): void {
    if (!this.ensureLightAvailable("reset lighting")) {
      return
    }

    this.applyIntensity("MEDIUM")
    this.applyColor("NEUTRAL")
    this.emitStateChanged()
  }

  /**
   * Restore a saved key-light look. Preset names update controller state; the
   * copied intensity and color values are applied so the light matches the
   * saved shot exactly.
   */
  public restoreSavedLook(
    intensityName: LightIntensityName,
    colorName: LightColorName,
    intensityValue: number,
    colorValue: vec3
  ): void {
    if (!this.ensureLightAvailable("restore saved look")) {
      return
    }

    this.applyIntensity(this.normalizeIntensityName(intensityName))
    this.applyColor(this.normalizeColorName(colorName))
    this.lightSource!.intensity = intensityValue
    this.lightSource!.color = new vec3(colorValue.x, colorValue.y, colorValue.z)
    this.emitStateChanged()
  }

  public getCurrentState(): KeyLightState | null {
    if (isNull(this.lightSource)) {
      return null
    }

    return this.createStateSnapshot()
  }

  public addStateChangedListener(listener: KeyLightStateChangedListener): () => void {
    if (this.stateChangedListeners.indexOf(listener) < 0) {
      this.stateChangedListeners.push(listener)
    }

    return () => this.removeStateChangedListener(listener)
  }

  public removeStateChangedListener(listener: KeyLightStateChangedListener): void {
    const index = this.stateChangedListeners.indexOf(listener)
    if (index >= 0) {
      this.stateChangedListeners.splice(index, 1)
    }
  }

  private applyIntensity(name: LightIntensityName): void {
    this.intensityName = name
    this.lightSource!.intensity = this.intensityValueFor(name)
  }

  private applyColor(name: LightColorName): void {
    this.colorName = name
    this.lightSource!.color = this.colorValueFor(name)
  }

  private intensityValueFor(name: LightIntensityName): number {
    switch (name) {
      case "LOW":
        return this.lowIntensity
      case "HIGH":
        return this.highIntensity
      default:
        return this.mediumIntensity
    }
  }

  private colorValueFor(name: LightColorName): vec3 {
    switch (name) {
      case "WARM":
        return this.warmColor || COLOR_WARM
      case "COOL":
        return this.coolColor || COLOR_COOL
      default:
        return this.neutralColor || COLOR_NEUTRAL
    }
  }

  private resolveLightSource(): boolean {
    if (!this.keyLight || isNull(this.keyLight)) {
      console.error("[LightingController] keyLight input is not wired.")
      return false
    }

    const light = this.keyLight.getComponent("Component.LightSource") as LightSource | null
    if (isNull(light)) {
      console.error("[LightingController] KeyLight has no LightSource component.")
      return false
    }

    this.lightSource = light
    return true
  }

  private ensureLightAvailable(action: string): boolean {
    if (!isNull(this.lightSource)) {
      return true
    }
    if (this.resolveLightSource()) {
      return true
    }

    console.error(`[LightingController] Cannot ${action}: KeyLight LightSource is unavailable.`)
    return false
  }

  private createStateSnapshot(): KeyLightState {
    return Object.freeze({
      intensityName: this.intensityName,
      colorName: this.colorName,
      intensity: this.intensityValueFor(this.intensityName),
      color: this.colorValueFor(this.colorName),
    })
  }

  private emitStateChanged(): void {
    if (isNull(this.lightSource)) {
      return
    }

    const state = this.createStateSnapshot()
    const listeners = this.stateChangedListeners.slice()
    listeners.forEach((listener) => listener(state))
  }

  private normalizeIntensityName(value: string): LightIntensityName {
    const normalized = value.trim().toUpperCase()
    if (normalized === "LOW" || normalized === "HIGH") {
      return normalized
    }
    return "MEDIUM"
  }

  private normalizeColorName(value: string): LightColorName {
    const normalized = value.trim().toUpperCase()
    if (normalized === "WARM" || normalized === "COOL") {
      return normalized
    }
    return "NEUTRAL"
  }
}
