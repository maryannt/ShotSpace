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
import {Switch} from "SpectaclesUIKit.lspkg/Scripts/Components/Switch/Switch"
import {
  FlexAlign,
  FlexAlignSelf,
  FlexDirection,
  FlexJustify,
} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"

import {
  LensController,
  LensPreset,
  ShotFramingState,
} from "./LensController"
import {
  KeyLightState,
  LightColorName,
  LightIntensityName,
  LightingController,
} from "./LightingController"
import {
  ManipulationSelection,
  SpatialManipulationController,
} from "./SpatialManipulationController"

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

type FramingButtonEntry = {
  displayLabel: string
  button: Button
  label: Text
}

type LightButtonEntry = {
  value: string
  button: Button
  label: Text
}

const CONTENT_Z_LIFT_CM = 0.6
const BUTTON_LABEL_Z_LIFT_CM = 0.08
const DEFAULT_FOCAL_LENGTH_MM = 50
const DEFAULT_FRAMING_LABEL = "MEDIUM"

@component
export class ShotSpaceLensControlsUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShotSpace Lens Controls</span>')
  @ui.separator

  @ui.group_start("References")
  @input
  @hint("Authored LensController component that owns ShotCamera focal-length presets.")
  lensController!: LensController

  @input
  @hint("Authored LightingController that owns key-light intensity and color.")
  lightingController!: LightingController

  @input
  @hint("Authored SpatialManipulationController that owns grab selection and layout reset.")
  spatialManipulationController!: SpatialManipulationController
  @ui.group_end

  @ui.separator
  @ui.group_start("Panel Placement")
  @input
  @hint("Width shared by the status and control backplates, in centimeters.")
  @widget(new SliderWidget(26, 36, 0.2))
  panelWidthCm: number = 29

  @input
  @hint("Height of the status/header backplate above PreviewScreen, in centimeters.")
  @widget(new SliderWidget(10, 18, 0.2))
  statusPanelHeightCm: number = 16

  @input
  @hint("Height of the combined focal, framing, Match, and distortion control backplate, in centimeters.")
  @widget(new SliderWidget(10, 18, 0.2))
  controlPanelHeightCm: number = 16

  @input
  @hint("Local X center of the status group so it remains aligned above PreviewScreen.")
  @widget(new SliderWidget(-15, 15, 0.5))
  statusCenterXCm: number = 5

  @input
  @hint("Local Y center of the status/header group above the 16x9 PreviewScreen.")
  @widget(new SliderWidget(8, 16, 0.2))
  statusCenterYCm: number = 12

  @input
  @hint("Local X center of the compact button panel.")
  @widget(new SliderWidget(-15, 15, 0.5))
  controlsCenterXCm: number = 0

  @input
  @hint("Local Y center of the combined controls below PreviewPanel.")
  @widget(new SliderWidget(-24, -12, 0.2))
  controlsCenterYCm: number = -18
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
  @hint("Width of each framing button; sized so CLOSE-UP remains readable.")
  @widget(new SliderWidget(7, 9, 0.1))
  framingButtonWidthCm: number = 8.2

  @input
  @hint("Vertical gap between focal, framing, and Match rows.")
  @widget(new SliderWidget(0.2, 1, 0.1))
  controlRowGapCm: number = 0.5

  @input
  @hint("Width of the native UIKit Match Framing switch.")
  @widget(new SliderWidget(5, 9, 0.1))
  matchSwitchWidthCm: number = 7

  @input
  @hint("Width of the native UIKit Lens Distortion switch.")
  @widget(new SliderWidget(5, 9, 0.1))
  distortionSwitchWidthCm: number = 7

  @input
  @hint("Inset between panel edges and their content, in centimeters.")
  @widget(new SliderWidget(0.5, 2, 0.1))
  panelPaddingCm: number = 1

  @input
  @hint("Local X center of the compact lighting and reset panel.")
  @widget(new SliderWidget(8, 28, 0.5))
  lightingCenterXCm: number = 20

  @input
  @hint("Local Y center of the compact lighting and reset panel.")
  @widget(new SliderWidget(-8, 8, 0.2))
  lightingCenterYCm: number = -1

  @input
  @hint("Width of the lighting and reset backplate.")
  @widget(new SliderWidget(14, 22, 0.2))
  lightingPanelWidthCm: number = 18

  @input
  @hint("Height of the lighting and reset backplate.")
  @widget(new SliderWidget(14, 24, 0.2))
  lightingPanelHeightCm: number = 18.5

  @input
  @hint("Local X center of the instruction panel.")
  @widget(new SliderWidget(-8, 12, 0.5))
  instructionCenterXCm: number = 5

  @input
  @hint("Local Y center of the instruction panel above the status header.")
  @widget(new SliderWidget(18, 28, 0.2))
  instructionCenterYCm: number = 23.2

  @input
  @hint("Width of the instruction backplate.")
  @widget(new SliderWidget(22, 34, 0.2))
  instructionPanelWidthCm: number = 29

  @input
  @hint("Height of the instruction backplate.")
  @widget(new SliderWidget(6, 12, 0.2))
  instructionPanelHeightCm: number = 8.4
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
  private framingStatusText: Text | null = null
  private matchStatusText: Text | null = null
  private distortionStatusText: Text | null = null
  private informationReadoutText: Text | null = null
  private matchSwitch: Switch | null = null
  private distortionSwitch: Switch | null = null
  private lightReadoutText: Text | null = null
  private selectionReadoutText: Text | null = null
  private readonly lensButtons: LensButtonEntry[] = []
  private readonly framingButtons: FramingButtonEntry[] = []
  private readonly intensityButtons: LightButtonEntry[] = []
  private readonly colorButtons: LightButtonEntry[] = []
  private unsubscribeStateChanged: (() => void) | null = null
  private unsubscribeLightChanged: (() => void) | null = null
  private unsubscribeSelectionChanged: (() => void) | null = null

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")
    this.buildStatusPanel()
    this.buildControlPanel()
    this.buildInstructionPanel()
    this.buildLightingPanel()
    this.setSelectedFocalLength(DEFAULT_FOCAL_LENGTH_MM)
    this.setSelectedFramingLabel(DEFAULT_FRAMING_LABEL)
    this.setMatchFramingDisplay(true)
    this.setLensDistortionDisplay(true)
    this.setLightDisplay("MEDIUM", "NEUTRAL")
    this.setSelectionDisplay("NONE")

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

  public syncFromState(state: ShotFramingState): void {
    this.setSelectedFocalLength(state.currentLens.focalLengthMm)
    this.setSelectedFramingLabel(state.framingDisplayLabel)
    this.setMatchFramingDisplay(state.matchFramingEnabled)
    this.setLensDistortionDisplay(state.lensDistortionEnabled)

    if (this.informationReadoutText) {
      const opticalProfile = state.lensDistortionEnabled
        ? state.currentLens.distortionDescription
        : "OFF"
      this.informationReadoutText.text =
        `LENS: ${state.currentLens.focalLengthMm}mm\n` +
        `FRAMING: ${state.framingDisplayLabel}\n` +
        `MATCH: ${state.matchFramingEnabled ? "ON" : "OFF"}\n` +
        `OPTICAL PROFILE: ${opticalProfile}\n` +
        `DISTANCE: ${state.distanceCm.toFixed(1)} cm`
    }
  }

  public syncFromLightState(state: KeyLightState): void {
    this.setLightDisplay(state.intensityName, state.colorName)
  }

  public syncFromSelection(selection: ManipulationSelection): void {
    this.setSelectionDisplay(selection)
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

  public setSelectedFramingLabel(displayLabel: string): void {
    if (this.framingStatusText) {
      this.framingStatusText.text = `CURRENT FRAMING: ${displayLabel}`
    }

    for (let i = 0; i < this.framingButtons.length; i++) {
      const entry = this.framingButtons[i]
      const selected = entry.displayLabel === displayLabel
      entry.button.isOn = selected
      entry.label.textFill.color = selected ? this.accentColor : this.primaryTextColor
    }
  }

  private setMatchFramingDisplay(enabled: boolean): void {
    if (this.matchStatusText) {
      this.matchStatusText.text = `MATCH FRAMING: ${enabled ? "ON" : "OFF"}`
    }
    if (this.matchSwitch) {
      this.matchSwitch.isOn = enabled
    }
  }

  private setLensDistortionDisplay(enabled: boolean): void {
    if (this.distortionStatusText) {
      this.distortionStatusText.text = `DISTORTION: ${enabled ? "ON" : "OFF"}`
    }
    if (this.distortionSwitch) {
      this.distortionSwitch.isOn = enabled
    }
  }

  private setLightDisplay(intensityName: LightIntensityName, colorName: LightColorName): void {
    if (this.lightReadoutText) {
      this.lightReadoutText.text = `KEY LIGHT: ${intensityName} / ${colorName}`
    }
    this.setExclusiveLightButtons(this.intensityButtons, intensityName)
    this.setExclusiveLightButtons(this.colorButtons, colorName)
  }

  private setSelectionDisplay(selection: ManipulationSelection): void {
    if (this.selectionReadoutText) {
      this.selectionReadoutText.text = `SELECTED: ${selection}`
    }
  }

  private setExclusiveLightButtons(entries: LightButtonEntry[], selectedValue: string): void {
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]
      const selected = entry.value === selectedValue
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
      1.5
    )
    this.educationalText = education.text

    const framing = this.createStatusText(
      content,
      "CurrentFramingLabel",
      "CURRENT FRAMING: MEDIUM",
      "Callout",
      this.primaryTextColor,
      1.5
    )
    this.framingStatusText = framing.text

    const match = this.createStatusText(
      content,
      "MatchFramingStatusLabel",
      "MATCH FRAMING: ON",
      "Caption",
      this.secondaryTextColor,
      1.4
    )
    this.matchStatusText = match.text

    const distortion = this.createStatusText(
      content,
      "LensDistortionStatusLabel",
      "DISTORTION: ON",
      "Caption",
      this.secondaryTextColor,
      1.4
    )
    this.distortionStatusText = distortion.text

    const information = this.createStatusText(
      content,
      "LensInformationReadout",
      "LENS: 50mm\nFRAMING: MEDIUM\nMATCH: ON\nOPTICAL PROFILE: NEUTRAL\nDISTANCE: 0.0 cm",
      "Caption",
      this.primaryTextColor,
      6.2,
      HorizontalAlignment.Left
    )
    this.informationReadoutText = information.text

    layout.addItems([
      current.item,
      education.item,
      framing.item,
      match.item,
      distortion.item,
      information.item,
    ])
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
    layout.direction = FlexDirection.Column
    layout.justifyContent = FlexJustify.Center
    layout.alignItems = FlexAlign.Stretch
    layout.rowGap = this.controlRowGapCm
    layout.paddingTop = this.panelPaddingCm
    layout.paddingBottom = this.panelPaddingCm
    layout.paddingLeft = this.panelPaddingCm
    layout.paddingRight = this.panelPaddingCm

    const focalRow = this.createControlRow(content, "FocalControlsRow", this.buttonHeightCm)
    focalRow.layout.addItems([
      this.createLensButton(focalRow.object, 24, "LensButton_24mm"),
      this.createLensButton(focalRow.object, 35, "LensButton_35mm"),
      this.createLensButton(focalRow.object, 50, "LensButton_50mm"),
      this.createLensButton(focalRow.object, 85, "LensButton_85mm"),
    ])

    const framingRow = this.createControlRow(content, "FramingControlsRow", this.buttonHeightCm)
    framingRow.layout.addItems([
      this.createFramingButton(framingRow.object, "WIDE", "FramingButton_Wide"),
      this.createFramingButton(framingRow.object, "MEDIUM", "FramingButton_Medium"),
      this.createFramingButton(framingRow.object, "CLOSE-UP", "FramingButton_CloseUp"),
    ])

    const matchRow = this.createControlRow(content, "MatchControlsRow", this.buttonHeightCm)
    const matchLabel = this.createFlexText(
      matchRow.object,
      "MatchFramingRowLabel",
      "MATCH FRAMING",
      "Button",
      this.primaryTextColor,
      this.panelWidthCm - this.panelPaddingCm * 2 - this.matchSwitchWidthCm - this.buttonGapCm,
      this.buttonHeightCm,
      HorizontalAlignment.Right
    )
    const toggle = this.createMatchSwitch(matchRow.object)
    matchRow.layout.addItems([matchLabel.item, toggle])

    const distortionRow = this.createControlRow(
      content,
      "LensDistortionControlsRow",
      this.buttonHeightCm
    )
    const distortionLabel = this.createFlexText(
      distortionRow.object,
      "LensDistortionRowLabel",
      "LENS DISTORTION",
      "Button",
      this.primaryTextColor,
      this.panelWidthCm -
        this.panelPaddingCm * 2 -
        this.distortionSwitchWidthCm -
        this.buttonGapCm,
      this.buttonHeightCm,
      HorizontalAlignment.Left
    )
    const distortionToggle = this.createLensDistortionSwitch(distortionRow.object)
    // Alternate the switch side from Match Framing so the two large poke
    // targets do not overlap during a straight-ahead hand approach.
    distortionRow.layout.addItems([distortionToggle, distortionLabel.item])

    layout.addItems([
      focalRow.item,
      framingRow.item,
      matchRow.item,
      distortionRow.item,
    ])
  }

  private buildInstructionPanel(): void {
    const panel = this.createObject(
      this.sceneObject,
      "ShotInstructionPanel",
      new vec3(this.instructionCenterXCm, this.instructionCenterYCm, 0)
    )
    const backPlate = panel.createComponent(BackPlate.getTypeName()) as BackPlate
    backPlate.size = new vec2(this.instructionPanelWidthCm, this.instructionPanelHeightCm)

    const content = this.createObject(
      panel,
      "ShotInstructionContent",
      new vec3(0, 0, CONTENT_Z_LIFT_CM)
    )
    const layout = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.autoDiscoverItemsOnStart = false
    layout.width = this.instructionPanelWidthCm
    layout.height = this.instructionPanelHeightCm
    layout.direction = FlexDirection.Column
    layout.justifyContent = FlexJustify.Center
    layout.alignItems = FlexAlign.Stretch
    layout.rowGap = 0.2
    layout.paddingTop = this.panelPaddingCm
    layout.paddingBottom = this.panelPaddingCm
    layout.paddingLeft = this.panelPaddingCm
    layout.paddingRight = this.panelPaddingCm

    const line1 = this.createFlexText(
      content,
      "InstructionLine1",
      "GRAB ACTORS TO BLOCK THE SCENE",
      "Caption",
      this.primaryTextColor,
      this.instructionPanelWidthCm - this.panelPaddingCm * 2,
      1.4,
      HorizontalAlignment.Center
    )
    const line2 = this.createFlexText(
      content,
      "InstructionLine2",
      "GRAB CAMERA TO CREATE A CUSTOM SHOT",
      "Caption",
      this.primaryTextColor,
      this.instructionPanelWidthCm - this.panelPaddingCm * 2,
      1.4,
      HorizontalAlignment.Center
    )
    const line3 = this.createFlexText(
      content,
      "InstructionLine3",
      "GRAB LIGHT TO SHAPE THE IMAGE",
      "Caption",
      this.primaryTextColor,
      this.instructionPanelWidthCm - this.panelPaddingCm * 2,
      1.4,
      HorizontalAlignment.Center
    )
    const selected = this.createFlexText(
      content,
      "SelectionReadout",
      "SELECTED: NONE",
      "Callout",
      this.accentColor,
      this.instructionPanelWidthCm - this.panelPaddingCm * 2,
      1.6,
      HorizontalAlignment.Center
    )
    this.selectionReadoutText = selected.text
    layout.addItems([line1.item, line2.item, line3.item, selected.item])
  }

  private buildLightingPanel(): void {
    const panel = this.createObject(
      this.sceneObject,
      "ShotLightingPanel",
      new vec3(this.lightingCenterXCm, this.lightingCenterYCm, 0)
    )
    const backPlate = panel.createComponent(BackPlate.getTypeName()) as BackPlate
    backPlate.size = new vec2(this.lightingPanelWidthCm, this.lightingPanelHeightCm)

    const content = this.createObject(
      panel,
      "ShotLightingContent",
      new vec3(0, 0, CONTENT_Z_LIFT_CM)
    )
    const layout = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.autoDiscoverItemsOnStart = false
    layout.width = this.lightingPanelWidthCm
    layout.height = this.lightingPanelHeightCm
    layout.direction = FlexDirection.Column
    layout.justifyContent = FlexJustify.Center
    layout.alignItems = FlexAlign.Stretch
    layout.rowGap = this.controlRowGapCm
    layout.paddingTop = this.panelPaddingCm
    layout.paddingBottom = this.panelPaddingCm
    layout.paddingLeft = this.panelPaddingCm
    layout.paddingRight = this.panelPaddingCm

    const header = this.createFlexText(
      content,
      "LightSectionHeader",
      "LIGHT",
      "Callout",
      this.primaryTextColor,
      this.lightingPanelWidthCm - this.panelPaddingCm * 2,
      1.4,
      HorizontalAlignment.Center
    )
    const intensityRow = this.createNamedControlRow(
      content,
      "LightIntensityRow",
      this.lightingPanelWidthCm,
      this.buttonHeightCm
    )
    intensityRow.layout.addItems([
      this.createLightButton(intensityRow.object, "LOW", "LightButton_Low", "intensity"),
      this.createLightButton(intensityRow.object, "MEDIUM", "LightButton_Medium", "intensity"),
      this.createLightButton(intensityRow.object, "HIGH", "LightButton_High", "intensity"),
    ])
    const colorRow = this.createNamedControlRow(
      content,
      "LightColorRow",
      this.lightingPanelWidthCm,
      this.buttonHeightCm
    )
    colorRow.layout.addItems([
      this.createLightButton(colorRow.object, "WARM", "LightButton_Warm", "color"),
      this.createLightButton(colorRow.object, "NEUTRAL", "LightButton_Neutral", "color"),
      this.createLightButton(colorRow.object, "COOL", "LightButton_Cool", "color"),
    ])
    const readout = this.createFlexText(
      content,
      "KeyLightReadout",
      "KEY LIGHT: MEDIUM / NEUTRAL",
      "Caption",
      this.primaryTextColor,
      this.lightingPanelWidthCm - this.panelPaddingCm * 2,
      1.5,
      HorizontalAlignment.Center
    )
    this.lightReadoutText = readout.text

    const actionRow = this.createNamedControlRow(
      content,
      "LayoutActionRow",
      this.lightingPanelWidthCm,
      this.buttonHeightCm
    )
    actionRow.layout.addItems([
      this.createActionButton(
        actionRow.object,
        "Button_ReframeActorA",
        "REFRAME ACTOR A",
        () => this.requestReframeActorA()
      ),
    ])
    const resetRow = this.createNamedControlRow(
      content,
      "ResetActionRow",
      this.lightingPanelWidthCm,
      this.buttonHeightCm
    )
    resetRow.layout.addItems([
      this.createActionButton(
        resetRow.object,
        "Button_ResetLayout",
        "RESET LAYOUT",
        () => this.requestResetLayout()
      ),
    ])

    layout.addItems([
      header.item,
      intensityRow.item,
      colorRow.item,
      readout.item,
      actionRow.item,
      resetRow.item,
    ])
  }

  private createNamedControlRow(
    parent: SceneObject,
    objectName: string,
    panelWidthCm: number,
    heightCm: number
  ): {object: SceneObject; layout: FlexLayout; item: FlexItem} {
    const rowObject = this.createObject(parent, objectName)
    const rowLayout = rowObject.createComponent(FlexLayout.getTypeName()) as FlexLayout
    rowLayout.autoDiscoverItemsOnStart = false
    rowLayout.width = panelWidthCm - this.panelPaddingCm * 2
    rowLayout.height = heightCm
    rowLayout.direction = FlexDirection.Row
    rowLayout.justifyContent = FlexJustify.Center
    rowLayout.alignItems = FlexAlign.Center
    rowLayout.columnGap = this.buttonGapCm

    const rowItem = rowObject.createComponent(FlexItem.getTypeName()) as FlexItem
    rowItem.overrideWidth = panelWidthCm - this.panelPaddingCm * 2
    rowItem.overrideHeight = heightCm
    rowItem.flexGrow = 0
    rowItem.flexShrink = 0
    rowItem.alignSelf = FlexAlignSelf.Center
    return {object: rowObject, layout: rowLayout, item: rowItem}
  }

  private createLightButton(
    parent: SceneObject,
    value: string,
    objectName: string,
    group: "intensity" | "color"
  ): FlexItem {
    const widthCm = 4.8
    const buttonObject = this.createObject(parent, objectName)
    const button = buttonObject.createComponent(Button.getTypeName()) as Button
    button.size = new vec3(widthCm, this.buttonHeightCm, 1)
    button.setIsToggleable(true)
    const selected = value === "MEDIUM" || value === "NEUTRAL"
    button.isOn = selected

    const labelObject = this.createObject(
      buttonObject,
      `${objectName}_Label`,
      new vec3(0, 0, BUTTON_LABEL_Z_LIFT_CM)
    )
    const label = labelObject.createComponent("Component.Text") as Text
    label.text = value
    label.depthTest = true
    applyTextRole(label, "Button", this.fontSizeScale)
    label.horizontalAlignment = HorizontalAlignment.Center
    label.verticalAlignment = VerticalAlignment.Center
    label.horizontalOverflow = HorizontalOverflow.Overflow
    label.verticalOverflow = VerticalOverflow.Overflow
    label.layoutRect = Rect.create(
      -(widthCm - 0.4) / 2,
      (widthCm - 0.4) / 2,
      -this.buttonHeightCm / 2,
      this.buttonHeightCm / 2
    )
    label.textFill.color = selected ? this.accentColor : this.primaryTextColor

    const item = buttonObject.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = widthCm
    item.overrideHeight = this.buttonHeightCm
    item.flexGrow = 0
    item.flexShrink = 0
    item.alignSelf = FlexAlignSelf.Center

    const entry = {value, button, label}
    if (group === "intensity") {
      this.intensityButtons.push(entry)
      button.onTriggerUp.add(() => this.requestLightIntensity(value as LightIntensityName))
    } else {
      this.colorButtons.push(entry)
      button.onTriggerUp.add(() => this.requestLightColor(value as LightColorName))
    }
    return item
  }

  private createActionButton(
    parent: SceneObject,
    objectName: string,
    labelText: string,
    onPress: () => void
  ): FlexItem {
    const widthCm = this.lightingPanelWidthCm - this.panelPaddingCm * 2
    const buttonObject = this.createObject(parent, objectName)
    const button = buttonObject.createComponent(Button.getTypeName()) as Button
    button.size = new vec3(widthCm, this.buttonHeightCm, 1)

    const labelObject = this.createObject(
      buttonObject,
      `${objectName}_Label`,
      new vec3(0, 0, BUTTON_LABEL_Z_LIFT_CM)
    )
    const label = labelObject.createComponent("Component.Text") as Text
    label.text = labelText
    label.depthTest = true
    applyTextRole(label, "Button", this.fontSizeScale)
    label.horizontalAlignment = HorizontalAlignment.Center
    label.verticalAlignment = VerticalAlignment.Center
    label.horizontalOverflow = HorizontalOverflow.Overflow
    label.verticalOverflow = VerticalOverflow.Overflow
    label.layoutRect = Rect.create(
      -(widthCm - 0.5) / 2,
      (widthCm - 0.5) / 2,
      -this.buttonHeightCm / 2,
      this.buttonHeightCm / 2
    )
    label.textFill.color = this.primaryTextColor

    const item = buttonObject.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = widthCm
    item.overrideHeight = this.buttonHeightCm
    item.flexGrow = 0
    item.flexShrink = 0
    item.alignSelf = FlexAlignSelf.Center
    button.onTriggerUp.add(onPress)
    return item
  }

  private createControlRow(
    parent: SceneObject,
    objectName: string,
    heightCm: number
  ): {object: SceneObject; layout: FlexLayout; item: FlexItem} {
    const rowObject = this.createObject(parent, objectName)
    const rowLayout = rowObject.createComponent(FlexLayout.getTypeName()) as FlexLayout
    rowLayout.autoDiscoverItemsOnStart = false
    rowLayout.width = this.panelWidthCm - this.panelPaddingCm * 2
    rowLayout.height = heightCm
    rowLayout.direction = FlexDirection.Row
    rowLayout.justifyContent = FlexJustify.Center
    rowLayout.alignItems = FlexAlign.Center
    rowLayout.columnGap = this.buttonGapCm

    const rowItem = rowObject.createComponent(FlexItem.getTypeName()) as FlexItem
    rowItem.overrideWidth = this.panelWidthCm - this.panelPaddingCm * 2
    rowItem.overrideHeight = heightCm
    rowItem.flexGrow = 0
    rowItem.flexShrink = 0
    rowItem.alignSelf = FlexAlignSelf.Center
    return {object: rowObject, layout: rowLayout, item: rowItem}
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

  private createFramingButton(
    parent: SceneObject,
    displayLabel: string,
    objectName: string
  ): FlexItem {
    const buttonObject = this.createObject(parent, objectName)
    const button = buttonObject.createComponent(Button.getTypeName()) as Button
    button.size = new vec3(this.framingButtonWidthCm, this.buttonHeightCm, 1)
    button.setIsToggleable(true)
    button.isOn = displayLabel === DEFAULT_FRAMING_LABEL

    const labelObject = this.createObject(
      buttonObject,
      `${objectName}_Label`,
      new vec3(0, 0, BUTTON_LABEL_Z_LIFT_CM)
    )
    const label = labelObject.createComponent("Component.Text") as Text
    label.text = displayLabel
    label.depthTest = true
    applyTextRole(label, "Button", this.fontSizeScale)
    label.horizontalAlignment = HorizontalAlignment.Center
    label.verticalAlignment = VerticalAlignment.Center
    label.horizontalOverflow = HorizontalOverflow.Overflow
    label.verticalOverflow = VerticalOverflow.Overflow
    label.layoutRect = Rect.create(
      -(this.framingButtonWidthCm - 0.5) / 2,
      (this.framingButtonWidthCm - 0.5) / 2,
      -this.buttonHeightCm / 2,
      this.buttonHeightCm / 2
    )
    label.textFill.color =
      displayLabel === DEFAULT_FRAMING_LABEL ? this.accentColor : this.primaryTextColor

    const item = buttonObject.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = this.framingButtonWidthCm
    item.overrideHeight = this.buttonHeightCm
    item.flexGrow = 0
    item.flexShrink = 0
    item.alignSelf = FlexAlignSelf.Center

    this.framingButtons.push({displayLabel, button, label})
    button.onTriggerUp.add(() => this.requestFramingPreset(displayLabel))
    return item
  }

  private createMatchSwitch(parent: SceneObject): FlexItem {
    const switchObject = this.createObject(parent, "Toggle_MatchFraming")
    const matchSwitch = switchObject.createComponent(Switch.getTypeName()) as Switch
    matchSwitch.size = new vec3(this.matchSwitchWidthCm, this.buttonHeightCm, 1)
    matchSwitch.initialize()
    matchSwitch.isOn = true
    matchSwitch.onFinished.add((explicit: boolean) => {
      if (explicit) {
        this.requestMatchFraming(matchSwitch.isOn)
      }
    })
    this.matchSwitch = matchSwitch

    const item = switchObject.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = this.matchSwitchWidthCm
    item.overrideHeight = this.buttonHeightCm
    item.flexGrow = 0
    item.flexShrink = 0
    item.alignSelf = FlexAlignSelf.Center
    return item
  }

  private createLensDistortionSwitch(parent: SceneObject): FlexItem {
    const switchObject = this.createObject(parent, "Toggle_LensDistortion")
    const distortionSwitch = switchObject.createComponent(
      Switch.getTypeName()
    ) as Switch
    distortionSwitch.size = new vec3(
      this.distortionSwitchWidthCm,
      this.buttonHeightCm,
      1
    )
    distortionSwitch.initialize()
    distortionSwitch.isOn = true
    distortionSwitch.onFinished.add((explicit: boolean) => {
      if (explicit) {
        this.requestLensDistortion(distortionSwitch.isOn)
      }
    })
    this.distortionSwitch = distortionSwitch

    const item = switchObject.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = this.distortionSwitchWidthCm
    item.overrideHeight = this.buttonHeightCm
    item.flexGrow = 0
    item.flexShrink = 0
    item.alignSelf = FlexAlignSelf.Center
    return item
  }

  private createStatusText(
    parent: SceneObject,
    objectName: string,
    value: string,
    role: TextRole,
    color: vec4,
    heightCm: number,
    alignment: HorizontalAlignment = HorizontalAlignment.Center
  ): {text: Text; item: FlexItem} {
    return this.createFlexText(
      parent,
      objectName,
      value,
      role,
      color,
      this.panelWidthCm - this.panelPaddingCm * 2,
      heightCm,
      alignment
    )
  }

  private createFlexText(
    parent: SceneObject,
    objectName: string,
    value: string,
    role: TextRole,
    color: vec4,
    widthCm: number,
    heightCm: number,
    alignment: HorizontalAlignment
  ): {text: Text; item: FlexItem} {
    const textObject = this.createObject(parent, objectName)
    const text = textObject.createComponent("Component.Text") as Text
    text.text = value
    text.depthTest = true
    applyTextRole(text, role, this.fontSizeScale)
    text.horizontalAlignment = alignment
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.verticalOverflow = VerticalOverflow.Overflow
    text.layoutRect = Rect.create(
      -widthCm / 2,
      widthCm / 2,
      -heightCm / 2,
      heightCm / 2
    )
    text.textFill.color = color

    const item = textObject.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = widthCm
    item.overrideHeight = heightCm
    item.alignSelf = FlexAlignSelf.Center
    item.flexGrow = 0
    item.flexShrink = 0
    return {text, item}
  }

  private requestPreset(focalLengthMm: number): void {
    if (!this.lensController || isNull(this.lensController)) {
      console.error("[ShotSpaceLensControlsUI] Cannot change lens: lensController is unavailable.")
      return
    }
    this.lensController.applyPresetByFocalLength(focalLengthMm)
  }

  private requestFramingPreset(displayLabel: string): void {
    if (!this.lensController || isNull(this.lensController)) {
      console.error("[ShotSpaceLensControlsUI] Cannot change framing: lensController is unavailable.")
      return
    }
    this.lensController.applyFramingByLabel(displayLabel)
  }

  private requestMatchFraming(enabled: boolean): void {
    if (!this.lensController || isNull(this.lensController)) {
      console.error("[ShotSpaceLensControlsUI] Cannot change Match Framing: lensController is unavailable.")
      return
    }
    this.lensController.setMatchFramingEnabled(enabled)
  }

  private requestLensDistortion(enabled: boolean): void {
    if (!this.lensController || isNull(this.lensController)) {
      console.error(
        "[ShotSpaceLensControlsUI] Cannot change lens distortion: lensController is unavailable."
      )
      return
    }
    this.lensController.setLensDistortionEnabled(enabled)
  }

  private requestLightIntensity(name: LightIntensityName): void {
    if (!this.lightingController || isNull(this.lightingController)) {
      console.error("[ShotSpaceLensControlsUI] Cannot change intensity: lightingController is unavailable.")
      return
    }
    this.lightingController.setIntensity(name)
  }

  private requestLightColor(name: LightColorName): void {
    if (!this.lightingController || isNull(this.lightingController)) {
      console.error("[ShotSpaceLensControlsUI] Cannot change color: lightingController is unavailable.")
      return
    }
    this.lightingController.setColor(name)
  }

  private requestReframeActorA(): void {
    if (!this.spatialManipulationController || isNull(this.spatialManipulationController)) {
      console.error("[ShotSpaceLensControlsUI] Cannot reframe: spatialManipulationController is unavailable.")
      return
    }
    this.spatialManipulationController.reframeActorA()
  }

  private requestResetLayout(): void {
    if (!this.spatialManipulationController || isNull(this.spatialManipulationController)) {
      console.error("[ShotSpaceLensControlsUI] Cannot reset layout: spatialManipulationController is unavailable.")
      return
    }
    this.spatialManipulationController.resetLayout()
  }

  private connectLensController(): void {
    if (!this.lensController || isNull(this.lensController)) {
      console.error(
        "[ShotSpaceLensControlsUI] lensController input is not wired; controls will remain in the default 50mm state."
      )
      return
    }

    this.unsubscribeStateChanged = this.lensController.addStateChangedListener(
      (state: ShotFramingState) => this.syncFromState(state)
    )

    const currentState = this.lensController.getCurrentState()
    if (currentState && !isNull(currentState)) {
      this.syncFromState(currentState)
    }

    if (this.lightingController && !isNull(this.lightingController)) {
      this.unsubscribeLightChanged = this.lightingController.addStateChangedListener(
        (state: KeyLightState) => this.syncFromLightState(state)
      )
      const lightState = this.lightingController.getCurrentState()
      if (lightState && !isNull(lightState)) {
        this.syncFromLightState(lightState)
      }
    } else {
      console.error(
        "[ShotSpaceLensControlsUI] lightingController input is not wired; LIGHT controls will stay at MEDIUM / NEUTRAL."
      )
    }

    if (this.spatialManipulationController && !isNull(this.spatialManipulationController)) {
      this.unsubscribeSelectionChanged = this.spatialManipulationController.addSelectionChangedListener(
        (selection: ManipulationSelection) => this.syncFromSelection(selection)
      )
      this.syncFromSelection(this.spatialManipulationController.getCurrentSelection())
    } else {
      console.error(
        "[ShotSpaceLensControlsUI] spatialManipulationController input is not wired; grab selection and reset will be unavailable."
      )
    }
  }

  private disconnectLensController(): void {
    if (this.unsubscribeStateChanged) {
      this.unsubscribeStateChanged()
      this.unsubscribeStateChanged = null
    }
    if (this.unsubscribeLightChanged) {
      this.unsubscribeLightChanged()
      this.unsubscribeLightChanged = null
    }
    if (this.unsubscribeSelectionChanged) {
      this.unsubscribeSelectionChanged()
      this.unsubscribeSelectionChanged = null
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
