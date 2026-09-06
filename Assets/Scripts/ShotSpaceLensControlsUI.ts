/**
 * ShotSpaceLensControlsUI — world-space focal-length controls for ShotSpace.
 *
 * The authored host is expected at PreviewPanel local origin on its Interface
 * layer. This component creates only its own UIKit hierarchy and never moves
 * or rebuilds PreviewPanel.
 */
import {BackPlate} from "SpectaclesUIKit.lspkg/Scripts/BackPlate"
import {Button} from "SpectaclesUIKit.lspkg/Scripts/Components/Button/Button"
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {
  FlexAlign,
  FlexAlignSelf,
  FlexDirection,
  FlexJustify,
} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"

import {LensController, LensPreset} from "./LensController"

type TextRole =
  | "Title1"
  | "Title2"
  | "HeadlineXL"
  | "Headline1"
  | "Headline2"
  | "Subheadline"
  | "Button"
  | "Callout"
  | "Body"
  | "Caption"

const TYPE_SCALE: Record<TextRole, {size: number; weight: number}> = {
  Title1: {size: 105, weight: 700},
  Title2: {size: 93, weight: 700},
  HeadlineXL: {size: 62, weight: 700},
  Headline1: {size: 54, weight: 700},
  Headline2: {size: 48, weight: 700},
  Subheadline: {size: 41, weight: 700},
  Button: {size: 39, weight: 500},
  Callout: {size: 39, weight: 700},
  Body: {size: 39, weight: 500},
  Caption: {size: 38, weight: 500},
}

function applyTextRole(
  text: Text,
  role: TextRole,
  fontSizeScale: number = 1,
  distanceCm: number = 110
): void {
  const settings = TYPE_SCALE[role]
  text.size = settings.size * fontSizeScale * (distanceCm / 110)
  ;(text as Text & {weight?: number}).weight = settings.weight
}

type LensButtonEntry = {
  focalLengthMm: number
  button: Button
  label: Text
}

const CONTENT_Z_LIFT_CM = 0.6
const BUTTON_LABEL_Z_LIFT_CM = 0.08
const DEFAULT_FOCAL_LENGTH_MM = 50

@component
export class ShotSpaceLensControlsUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShotSpace Lens Controls</span>')
  @ui.separator

  @ui.group_start("References")
  @input
  @hint("Authored LensController component that owns ShotCamera focal-length presets.")
  lensController!: LensController
  @ui.group_end

  @ui.separator
  @ui.group_start("Panel Placement")
  @input
  @hint("Width shared by the status and control backplates, in centimeters.")
  @widget(new SliderWidget(26, 36, 0.2))
  panelWidthCm: number = 29

  @input
  @hint("Height of the status/header backplate above PreviewScreen, in centimeters.")
  @widget(new SliderWidget(4, 9, 0.2))
  statusPanelHeightCm: number = 6

  @input
  @hint("Height of the compact focal-length control backplate, in centimeters.")
  @widget(new SliderWidget(4, 8, 0.2))
  controlPanelHeightCm: number = 5.2

  @input
  @hint("Local X center of the status group so it remains aligned above PreviewScreen.")
  @widget(new SliderWidget(-15, 15, 0.5))
  statusCenterXCm: number = 5

  @input
  @hint("Local Y center of the status/header group above the 16x9 PreviewScreen.")
  @widget(new SliderWidget(4, 11, 0.2))
  statusCenterYCm: number = 7

  @input
  @hint("Local X center of the compact button panel.")
  @widget(new SliderWidget(-15, 15, 0.5))
  controlsCenterXCm: number = 0

  @input
  @hint("Local Y center of the button panel directly below PreviewPanel.")
  @widget(new SliderWidget(-20, -10, 0.2))
  controlsCenterYCm: number = -14
  @ui.group_end

  @ui.separator
  @ui.group_start("Control Spacing")
  @input
  @hint("Width of each native UIKit focal-length button, in centimeters.")
  @widget(new SliderWidget(5.5, 7, 0.1))
  buttonWidthCm: number = 6

  @input
  @hint("Height of each native UIKit focal-length button, in centimeters.")
  @widget(new SliderWidget(2.4, 4, 0.1))
  buttonHeightCm: number = 3

  @input
  @hint("Horizontal gap between neighboring focal-length buttons, in centimeters.")
  @widget(new SliderWidget(0.4, 1.5, 0.1))
  buttonGapCm: number = 0.8

  @input
  @hint("Inset between panel edges and their content, in centimeters.")
  @widget(new SliderWidget(0.5, 2, 0.1))
  panelPaddingCm: number = 1
  @ui.group_end

  @ui.separator
  @ui.group_start("Typography and Color")
  @input
  @hint("Global multiplier for the Specs type-scale roles used by this panel.")
  @widget(new SliderWidget(0.8, 1.2, 0.01))
  fontSizeScale: number = 1

  @input("vec4", "{1,1,1,1}")
  @hint("Primary color for current-lens text and unselected button labels.")
  @widget(new ColorWidget())
  primaryTextColor: vec4

  @input("vec4", "{1,1,1,0.7}")
  @hint("Secondary color for the educational focal-length description.")
  @widget(new ColorWidget())
  secondaryTextColor: vec4

  @input("vec4", "{0.35,0.8,1,1}")
  @hint("Accent color applied to the selected focal-length button label.")
  @widget(new ColorWidget())
  accentColor: vec4
  @ui.group_end

  private currentLensText: Text | null = null
  private educationalText: Text | null = null
  private readonly lensButtons: LensButtonEntry[] = []
  private unsubscribePresetChanged: (() => void) | null = null

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")
    this.buildStatusPanel()
    this.buildControlPanel()
    this.setSelectedFocalLength(DEFAULT_FOCAL_LENGTH_MM)

    const connectDelay = this.createEvent("DelayedCallbackEvent")
    connectDelay.bind(() => this.connectLensController())
    this.createEvent("OnStartEvent").bind(() => connectDelay.reset(0))
    this.createEvent("OnDestroyEvent").bind(() => this.disconnectLensController())
  }

  /**
   * Public controller-facing synchronization point for preset state.
   */
  public syncFromPreset(preset: LensPreset): void {
    this.setSelectedFocalLength(preset.focalLengthMm)
  }

  /**
   * Updates retained labels and exclusive native Button.isOn state.
   */
  public setSelectedFocalLength(focalLengthMm: number): void {
    if (this.currentLensText) {
      this.currentLensText.text = `CURRENT LENS: ${focalLengthMm}mm`
    }

    if (this.educationalText) {
      this.educationalText.text = this.educationalLabelFor(focalLengthMm)
    }

    for (let i = 0; i < this.lensButtons.length; i++) {
      const entry = this.lensButtons[i]
      const selected = entry.focalLengthMm === focalLengthMm
      entry.button.isOn = selected
      entry.label.textFill.color = selected ? this.accentColor : this.primaryTextColor
    }
  }

  private buildStatusPanel(): void {
    const panel = this.createObject(
      this.sceneObject,
      "LensStatusHeaderGroup",
      new vec3(this.statusCenterXCm, this.statusCenterYCm, 0)
    )

    // Backing is authored first so Canvas Hierarchy sorting paints it first.
    const backPlate = panel.createComponent(BackPlate.getTypeName()) as BackPlate
    backPlate.size = new vec2(this.panelWidthCm, this.statusPanelHeightCm)

    // Content is authored after the backing and lifted forward to avoid z-fighting.
    const content = this.createObject(
      panel,
      "LensStatusContent",
      new vec3(0, 0, CONTENT_Z_LIFT_CM)
    )
    const layout = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.autoDiscoverItemsOnStart = false
    layout.width = this.panelWidthCm
    layout.height = this.statusPanelHeightCm
    layout.direction = FlexDirection.Column
    layout.justifyContent = FlexJustify.Center
    layout.alignItems = FlexAlign.Stretch
    layout.rowGap = 0.2
    layout.paddingTop = this.panelPaddingCm
    layout.paddingBottom = this.panelPaddingCm
    layout.paddingLeft = this.panelPaddingCm
    layout.paddingRight = this.panelPaddingCm

    const current = this.createStatusText(
      content,
      "CurrentLensLabel",
      "CURRENT LENS: 50mm",
      "Subheadline",
      this.primaryTextColor,
      2
    )
    this.currentLensText = current.text

    const education = this.createStatusText(
      content,
      "LensEducationalLabel",
      "50mm: NORMAL",
      "Caption",
      this.secondaryTextColor,
      1.8
    )
    this.educationalText = education.text

    layout.addItems([current.item, education.item])
  }

  private buildControlPanel(): void {
    const panel = this.createObject(
      this.sceneObject,
      "LensControlPanel",
      new vec3(this.controlsCenterXCm, this.controlsCenterYCm, 0)
    )

    // Backing precedes content in the hierarchy; no renderOrder override is used.
    const backPlate = panel.createComponent(BackPlate.getTypeName()) as BackPlate
    backPlate.size = new vec2(this.panelWidthCm, this.controlPanelHeightCm)

    const content = this.createObject(
      panel,
      "LensControlContent",
      new vec3(0, 0, CONTENT_Z_LIFT_CM)
    )
    const layout = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.autoDiscoverItemsOnStart = false
    layout.width = this.panelWidthCm
    layout.height = this.controlPanelHeightCm
    layout.direction = FlexDirection.Row
    layout.justifyContent = FlexJustify.Center
    layout.alignItems = FlexAlign.Center
    layout.columnGap = this.buttonGapCm
    layout.paddingTop = this.panelPaddingCm
    layout.paddingBottom = this.panelPaddingCm
    layout.paddingLeft = this.panelPaddingCm
    layout.paddingRight = this.panelPaddingCm

    const items: FlexItem[] = []
    items.push(this.createLensButton(content, 24, "LensButton_24mm"))
    items.push(this.createLensButton(content, 35, "LensButton_35mm"))
    items.push(this.createLensButton(content, 50, "LensButton_50mm"))
    items.push(this.createLensButton(content, 85, "LensButton_85mm"))
    layout.addItems(items)
  }

  private createLensButton(
    parent: SceneObject,
    focalLengthMm: number,
    objectName: string
  ): FlexItem {
    const buttonObject = this.createObject(parent, objectName)
    const button = buttonObject.createComponent(Button.getTypeName()) as Button
    button.size = new vec3(this.buttonWidthCm, this.buttonHeightCm, 1)
    button.setIsToggleable(true)
    button.isOn = focalLengthMm === DEFAULT_FOCAL_LENGTH_MM

    const labelObject = this.createObject(
      buttonObject,
      `${objectName}_Label`,
      new vec3(0, 0, BUTTON_LABEL_Z_LIFT_CM)
    )
    const label = labelObject.createComponent("Component.Text") as Text
    label.text = `${focalLengthMm}mm`
    label.depthTest = true
    applyTextRole(label, "Button", this.fontSizeScale)
    label.horizontalAlignment = HorizontalAlignment.Center
    label.verticalAlignment = VerticalAlignment.Center
    label.horizontalOverflow = HorizontalOverflow.Overflow
    label.verticalOverflow = VerticalOverflow.Overflow
    label.layoutRect = Rect.create(
      -(this.buttonWidthCm - 0.5) / 2,
      (this.buttonWidthCm - 0.5) / 2,
      -this.buttonHeightCm / 2,
      this.buttonHeightCm / 2
    )
    label.textFill.color =
      focalLengthMm === DEFAULT_FOCAL_LENGTH_MM ? this.accentColor : this.primaryTextColor

    const item = buttonObject.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = this.buttonWidthCm
    item.overrideHeight = this.buttonHeightCm
    item.flexGrow = 0
    item.flexShrink = 0
    item.alignSelf = FlexAlignSelf.Center

    this.lensButtons.push({focalLengthMm, button, label})
    button.onTriggerUp.add(() => this.requestPreset(focalLengthMm))
    return item
  }

  private createStatusText(
    parent: SceneObject,
    objectName: string,
    value: string,
    role: TextRole,
    color: vec4,
    heightCm: number
  ): {text: Text; item: FlexItem} {
    const textObject = this.createObject(parent, objectName)
    const text = textObject.createComponent("Component.Text") as Text
    text.text = value
    text.depthTest = true
    applyTextRole(text, role, this.fontSizeScale)
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.verticalOverflow = VerticalOverflow.Overflow
    text.layoutRect = Rect.create(
      -(this.panelWidthCm - this.panelPaddingCm * 2) / 2,
      (this.panelWidthCm - this.panelPaddingCm * 2) / 2,
      -heightCm / 2,
      heightCm / 2
    )
    text.textFill.color = color

    const item = textObject.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideHeight = heightCm
    item.alignSelf = FlexAlignSelf.Stretch
    item.flexGrow = 0
    item.flexShrink = 0
    return {text, item}
  }

  private requestPreset(focalLengthMm: number): void {
    this.setSelectedFocalLength(focalLengthMm)
    if (!this.lensController || isNull(this.lensController)) {
      return
    }
    this.lensController.applyPresetByFocalLength(focalLengthMm)
  }

  private connectLensController(): void {
    if (!this.lensController || isNull(this.lensController)) {
      console.error(
        "[ShotSpaceLensControlsUI] lensController input is not wired; controls will remain in the default 50mm state."
      )
      return
    }

    this.unsubscribePresetChanged = this.lensController.addPresetChangedListener(
      (preset: LensPreset) => this.syncFromPreset(preset)
    )

    const currentPreset = this.lensController.getCurrentPreset()
    if (currentPreset && !isNull(currentPreset)) {
      this.syncFromPreset(currentPreset)
    }
  }

  private disconnectLensController(): void {
    if (this.unsubscribePresetChanged) {
      this.unsubscribePresetChanged()
      this.unsubscribePresetChanged = null
    }
  }

  private educationalLabelFor(focalLengthMm: number): string {
    switch (focalLengthMm) {
      case 24:
        return "24mm: WIDE — EXPANDED FIELD OF VIEW"
      case 35:
        return "35mm: MODERATE WIDE"
      case 50:
        return "50mm: NORMAL"
      case 85:
        return "85mm: TELEPHOTO — NARROW FIELD OF VIEW"
      default:
        return `${focalLengthMm}mm`
    }
  }

  private createObject(
    parent: SceneObject,
    name: string,
    localPosition?: vec3
  ): SceneObject {
    const sceneObject = global.scene.createSceneObject(name)
    sceneObject.setParent(parent)
    sceneObject.layer = this.sceneObject.layer
    if (localPosition) {
      sceneObject.getTransform().setLocalPosition(localPosition)
    }
    return sceneObject
  }
}
