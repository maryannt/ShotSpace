/**
 * ShotSpaceStoryboardUI — world-space three-card storyboard rail.
 *
 * Builds only its own UIKit hierarchy on StoryboardRail. It never samples
 * ShotPreviewRT or creates cameras / render targets.
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
import Event, {PublicApi} from "SpectaclesInteractionKit.lspkg/Utils/Event"

import {ShotState} from "./ShotState"

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

function applyTextRole(text: Text, role: TextRole, fontSizeScale: number = 1, distanceCm: number = 110): void {
  const settings = TYPE_SCALE[role]
  text.size = settings.size * fontSizeScale * (distanceCm / 110)
  ;(text as Text & {weight?: number}).weight = settings.weight
}

export type StoryboardView = {
  slots: ShotState[]
  selectedSlotIndex: number | null
  saveButtonLabel: string
  statusText: string
}

type CardView = {
  root: SceneObject
  button: Button
  borderPlate: BackPlate
  shotLabel: Text
  lensLabel: Text
  matchLabel: Text
  distortionLabel: Text
  lightLabel: Text
  emptyLabel: Text
  actorA: Text
  actorB: Text
  lightMark: Text
  thumbWidth: number
  thumbHeight: number
}

const CONTENT_Z_LIFT_CM = 0.6
const BUTTON_LABEL_Z_LIFT_CM = 0.08
const OVERLAY_Z_CM = 0.12
const FLASH_SECONDS = 0.35
const THUMB_ASPECT = 16 / 9

@component
export class ShotSpaceStoryboardUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShotSpace Storyboard Rail</span>')
  @ui.separator

  @ui.group_start("Settings")
  @input
  @hint("Width of the storyboard rail backplate, in centimeters.")
  @widget(new SliderWidget(28, 42, 0.2))
  railWidthCm: number = 36

  @input
  @hint("Height of the storyboard rail backplate, in centimeters.")
  @widget(new SliderWidget(16, 26, 0.2))
  railHeightCm: number = 21.5

  @input
  @hint("Width of each storyboard card, in centimeters.")
  @widget(new SliderWidget(8, 13, 0.1))
  cardWidthCm: number = 10.6

  @input
  @hint("Height of each storyboard card, in centimeters.")
  @widget(new SliderWidget(11, 16, 0.1))
  cardHeightCm: number = 14.2

  @input
  @hint("Gap between storyboard cards, in centimeters.")
  @widget(new SliderWidget(0.3, 1.2, 0.05))
  cardGapCm: number = 0.7

  @input
  @hint("Width of SAVE SHOT / UPDATE SELECTED, sized for the longer label.")
  @widget(new SliderWidget(12, 18, 0.1))
  saveButtonWidthCm: number = 15.5

  @input
  @hint("Width of CLEAR BOARD.")
  @widget(new SliderWidget(10, 16, 0.1))
  clearButtonWidthCm: number = 12.5

  @input
  @hint("Height of the save and clear buttons.")
  @widget(new SliderWidget(2.4, 3.6, 0.1))
  actionButtonHeightCm: number = 3

  @input
  @hint("Inset between the rail edge and its content.")
  @widget(new SliderWidget(0.4, 1.6, 0.1))
  panelPaddingCm: number = 0.8

  @input
  @hint("Global multiplier for the Specs type-scale roles used by this rail.")
  @widget(new SliderWidget(0.8, 1.2, 0.01))
  fontSizeScale: number = 1

  @input("vec4", "{1,1,1,1}")
  @hint("Primary text color for occupied card metadata and button labels.")
  @widget(new ColorWidget())
  primaryTextColor: vec4

  @input("vec4", "{1,1,1,0.55}")
  @hint("Secondary text color for empty cards and status.")
  @widget(new ColorWidget())
  secondaryTextColor: vec4

  @input("vec4", "{0.95,0.62,0.28,1}")
  @hint("Actor A schematic icon color.")
  @widget(new ColorWidget())
  actorAColor: vec4

  @input("vec4", "{0.35,0.78,0.95,1}")
  @hint("Actor B schematic icon color.")
  @widget(new ColorWidget())
  actorBColor: vec4

  @input("vec4", "{0.45,0.85,1,1}")
  @hint("Selected-card border color.")
  @widget(new ColorWidget())
  selectedBorderColor: vec4

  @input("vec4", "{0.95,0.85,0.35,1}")
  @hint("Brief save/update flash border color.")
  @widget(new ColorWidget())
  flashBorderColor: vec4

  @input("vec4", "{0.22,0.24,0.28,1}")
  @hint("Idle card border color.")
  @widget(new ColorWidget())
  idleBorderColor: vec4

  @input("vec4", "{1,0.72,0.42,1}")
  @hint("Warm key-light indicator color.")
  @widget(new ColorWidget())
  warmLightColor: vec4

  @input("vec4", "{1,0.87,0.7,1}")
  @hint("Neutral key-light indicator color.")
  @widget(new ColorWidget())
  neutralLightColor: vec4

  @input("vec4", "{0.92,0.95,1,1}")
  @hint("Cool key-light indicator color.")
  @widget(new ColorWidget())
  coolLightColor: vec4
  @ui.group_end

  private readonly cards: CardView[] = []
  private saveButton: Button | null = null
  private saveButtonLabel: Text | null = null
  private statusLabel: Text | null = null
  private readonly flashEvents: Array<DelayedCallbackEvent | null> = [null, null, null]
  private readonly _onSaveRequested = new Event<void>()
  private readonly _onClearRequested = new Event<void>()
  private readonly _onCardSelected = new Event<number>()

  get onSaveRequested(): PublicApi<void> {
    return this._onSaveRequested.publicApi()
  }

  get onClearRequested(): PublicApi<void> {
    return this._onClearRequested.publicApi()
  }

  get onCardSelected(): PublicApi<number> {
    return this._onCardSelected.publicApi()
  }

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")
    this.buildRail()
  }

  public applyStoryboardView(view: StoryboardView): void {
    if (this.statusLabel) {
      this.statusLabel.text = view.statusText
    }
    if (this.saveButtonLabel) {
      this.saveButtonLabel.text = view.saveButtonLabel
    }

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i]
      const shot = view.slots[i]
      const selected = view.selectedSlotIndex === i
      card.button.isOn = selected
      this.applyCardAppearance(card, shot, selected)
    }
  }

  public flashCard(slotIndex: number): void {
    if (slotIndex < 0 || slotIndex >= this.cards.length) {
      return
    }

    const card = this.cards[slotIndex]
    this.setBorderColor(card, this.flashBorderColor)
    let event = this.flashEvents[slotIndex]
    if (!event) {
      event = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
      this.flashEvents[slotIndex] = event
      event.bind(() => {
        const current = this.cards[slotIndex]
        const selected = current.button.isOn
        this.setBorderColor(current, selected ? this.selectedBorderColor : this.idleBorderColor)
      })
    }
    event.enabled = true
    event.reset(FLASH_SECONDS)
  }

  private buildRail(): void {
    const backPlate = this.sceneObject.createComponent(BackPlate.getTypeName()) as BackPlate
    backPlate.size = new vec2(this.railWidthCm, this.railHeightCm)

    const content = this.createObject(this.sceneObject, "StoryboardContent", new vec3(0, 0, CONTENT_Z_LIFT_CM))
    const layout = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.autoDiscoverItemsOnStart = false
    layout.width = this.railWidthCm
    layout.height = this.railHeightCm
    layout.direction = FlexDirection.Column
    layout.justifyContent = FlexJustify.SpaceBetween
    layout.alignItems = FlexAlign.Center
    layout.rowGap = 0.45
    layout.paddingTop = this.panelPaddingCm
    layout.paddingBottom = this.panelPaddingCm
    layout.paddingLeft = this.panelPaddingCm
    layout.paddingRight = this.panelPaddingCm

    const header = this.createHeaderRow(content)
    const cards = this.createCardsRow(content)
    const actions = this.createActionsRow(content)
    layout.addItems([header, cards, actions])
  }

  private createHeaderRow(parent: SceneObject): FlexItem {
    const width = this.railWidthCm - this.panelPaddingCm * 2
    const row = this.createObject(parent, "StoryboardHeaderRow")
    const layout = row.createComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.autoDiscoverItemsOnStart = false
    layout.width = width
    layout.height = 2.2
    layout.direction = FlexDirection.Row
    layout.justifyContent = FlexJustify.SpaceBetween
    layout.alignItems = FlexAlign.Center

    const item = row.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = width
    item.overrideHeight = 2.2
    item.flexGrow = 0
    item.flexShrink = 0
    item.alignSelf = FlexAlignSelf.Center

    const title = this.createText(row, "StoryboardTitle", "STORYBOARD", "Headline2", this.primaryTextColor, 12, 2)
    const status = this.createText(
      row,
      "StoryboardStatusLabel",
      "READY TO SAVE",
      "Caption",
      this.secondaryTextColor,
      width - 13,
      2
    )
    this.statusLabel = status.text
    layout.addItems([title.item, status.item])
    return item
  }

  private createCardsRow(parent: SceneObject): FlexItem {
    const width = this.railWidthCm - this.panelPaddingCm * 2
    const row = this.createObject(parent, "StoryboardCardsRow")
    const layout = row.createComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.autoDiscoverItemsOnStart = false
    layout.width = width
    layout.height = this.cardHeightCm
    layout.direction = FlexDirection.Row
    layout.justifyContent = FlexJustify.Center
    layout.alignItems = FlexAlign.Center
    layout.columnGap = this.cardGapCm

    const item = row.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = width
    item.overrideHeight = this.cardHeightCm
    item.flexGrow = 0
    item.flexShrink = 0
    item.alignSelf = FlexAlignSelf.Center

    const cardItems: FlexItem[] = []
    for (let i = 0; i < 3; i++) {
      cardItems.push(this.createCard(row, i))
    }
    layout.addItems(cardItems)
    return item
  }

  private createCard(parent: SceneObject, slotIndex: number): FlexItem {
    const shotNumber = slotIndex + 1
    const root = this.createObject(parent, `StoryboardCard_${shotNumber}`)
    const borderObject = this.createObject(root, `StoryboardCard_${shotNumber}_SelectedBorder`)
    const borderPlate = borderObject.createComponent(BackPlate.getTypeName()) as BackPlate
    borderPlate.size = new vec2(this.cardWidthCm + 0.3, this.cardHeightCm + 0.3)
    borderPlate.style = "default"
    this.makePlateDecorative(borderPlate)

    const button = root.createComponent(Button.getTypeName()) as Button
    button.size = new vec3(this.cardWidthCm, this.cardHeightCm, 1)
    button.setIsToggleable(true)
    button.isOn = false

    const thumbWidth = this.cardWidthCm - 0.7
    const thumbHeight = thumbWidth / THUMB_ASPECT
    const content = this.createObject(root, `StoryboardCard_${shotNumber}_Content`, new vec3(0, 0, CONTENT_Z_LIFT_CM))
    const layout = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.autoDiscoverItemsOnStart = false
    layout.width = this.cardWidthCm
    layout.height = this.cardHeightCm
    layout.direction = FlexDirection.Column
    layout.justifyContent = FlexJustify.Start
    layout.alignItems = FlexAlign.Center
    layout.rowGap = 0.12
    layout.paddingTop = 0.35
    layout.paddingBottom = 0.25
    layout.paddingLeft = 0.25
    layout.paddingRight = 0.25

    const thumb = this.createThumbnail(content, shotNumber, thumbWidth, thumbHeight)
    const shotLabel = this.createText(
      content,
      `StoryboardCard_${shotNumber}_ShotLabel`,
      `SHOT ${shotNumber}`,
      "Callout",
      this.primaryTextColor,
      thumbWidth,
      1.15
    )
    const emptyLabel = this.createText(
      content,
      `StoryboardCard_${shotNumber}_EmptyLabel`,
      "EMPTY",
      "Caption",
      this.secondaryTextColor,
      thumbWidth,
      1.05
    )
    const lensLabel = this.createText(
      content,
      `StoryboardCard_${shotNumber}_LensLabel`,
      "",
      "Caption",
      this.primaryTextColor,
      thumbWidth,
      1.05
    )
    const matchLabel = this.createText(
      content,
      `StoryboardCard_${shotNumber}_MatchLabel`,
      "",
      "Caption",
      this.secondaryTextColor,
      thumbWidth,
      1.0
    )
    const distortionLabel = this.createText(
      content,
      `StoryboardCard_${shotNumber}_DistortionLabel`,
      "",
      "Caption",
      this.secondaryTextColor,
      thumbWidth,
      1.0
    )
    const lightLabel = this.createText(
      content,
      `StoryboardCard_${shotNumber}_LightLabel`,
      "",
      "Caption",
      this.secondaryTextColor,
      thumbWidth,
      1.0
    )

    layout.addItems([
      thumb.item,
      shotLabel.item,
      emptyLabel.item,
      lensLabel.item,
      matchLabel.item,
      distortionLabel.item,
      lightLabel.item,
    ])

    const card: CardView = {
      root,
      button,
      borderPlate,
      shotLabel: shotLabel.text,
      lensLabel: lensLabel.text,
      matchLabel: matchLabel.text,
      distortionLabel: distortionLabel.text,
      lightLabel: lightLabel.text,
      emptyLabel: emptyLabel.text,
      actorA: thumb.actorA,
      actorB: thumb.actorB,
      lightMark: thumb.lightMark,
      thumbWidth,
      thumbHeight,
    }
    this.cards.push(card)
    this.setBorderColor(card, this.idleBorderColor)

    const item = root.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = this.cardWidthCm
    item.overrideHeight = this.cardHeightCm
    item.flexGrow = 0
    item.flexShrink = 0
    item.alignSelf = FlexAlignSelf.Center

    button.onTriggerUp.add(() => this._onCardSelected.invoke(slotIndex))
    return item
  }

  private createThumbnail(
    parent: SceneObject,
    shotNumber: number,
    width: number,
    height: number
  ): {item: FlexItem; actorA: Text; actorB: Text; lightMark: Text} {
    const host = this.createObject(parent, `StoryboardCard_${shotNumber}_Thumbnail`)
    const plate = host.createComponent(BackPlate.getTypeName()) as BackPlate
    plate.size = new vec2(width, height)
    plate.style = "dark"
    this.makePlateDecorative(plate)

    this.createOverlayText(
      host,
      `StoryboardCard_${shotNumber}_GridV1`,
      "|",
      new vec4(1, 1, 1, 0.22),
      0.4,
      height * 0.9,
      new vec3(-width / 6, 0, OVERLAY_Z_CM)
    )
    this.createOverlayText(
      host,
      `StoryboardCard_${shotNumber}_GridV2`,
      "|",
      new vec4(1, 1, 1, 0.22),
      0.4,
      height * 0.9,
      new vec3(width / 6, 0, OVERLAY_Z_CM)
    )
    this.createOverlayText(
      host,
      `StoryboardCard_${shotNumber}_GridH1`,
      "—",
      new vec4(1, 1, 1, 0.22),
      width * 0.9,
      0.35,
      new vec3(0, height / 6, OVERLAY_Z_CM)
    )
    this.createOverlayText(
      host,
      `StoryboardCard_${shotNumber}_GridH2`,
      "—",
      new vec4(1, 1, 1, 0.22),
      width * 0.9,
      0.35,
      new vec3(0, -height / 6, OVERLAY_Z_CM)
    )

    this.createOverlayText(host, `StoryboardCard_${shotNumber}_Center`, "+", new vec4(1, 1, 1, 0.35), 0.7, 0.7, new vec3(0, 0, OVERLAY_Z_CM))
    const actorA = this.createOverlayText(
      host,
      `StoryboardCard_${shotNumber}_ActorA`,
      "A",
      this.actorAColor,
      1.1,
      1.1,
      new vec3(0, 0, OVERLAY_Z_CM + 0.04)
    )
    const actorB = this.createOverlayText(
      host,
      `StoryboardCard_${shotNumber}_ActorB`,
      "B",
      this.actorBColor,
      1.1,
      1.1,
      new vec3(0, 0, OVERLAY_Z_CM + 0.04)
    )
    const lightMark = this.createOverlayText(
      host,
      `StoryboardCard_${shotNumber}_Light`,
      ">",
      this.neutralLightColor,
      0.9,
      0.9,
      new vec3(width * 0.38, height * 0.32, OVERLAY_Z_CM + 0.05)
    )
    actorA.getSceneObject().enabled = false
    actorB.getSceneObject().enabled = false
    lightMark.getSceneObject().enabled = false

    const item = host.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = width
    item.overrideHeight = height
    item.flexGrow = 0
    item.flexShrink = 0
    item.alignSelf = FlexAlignSelf.Center
    return {item, actorA, actorB, lightMark}
  }

  private createActionsRow(parent: SceneObject): FlexItem {
    const width = this.railWidthCm - this.panelPaddingCm * 2
    const row = this.createObject(parent, "StoryboardActionsRow")
    const layout = row.createComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.autoDiscoverItemsOnStart = false
    layout.width = width
    layout.height = this.actionButtonHeightCm
    layout.direction = FlexDirection.Row
    layout.justifyContent = FlexJustify.Center
    layout.alignItems = FlexAlign.Center
    layout.columnGap = 0.8

    const item = row.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = width
    item.overrideHeight = this.actionButtonHeightCm
    item.flexGrow = 0
    item.flexShrink = 0
    item.alignSelf = FlexAlignSelf.Center

    const save = this.createActionButton(row, "Button_SaveShot", "SAVE SHOT", this.saveButtonWidthCm, () => {
      this._onSaveRequested.invoke()
    })
    const clear = this.createActionButton(row, "Button_ClearStoryboard", "CLEAR BOARD", this.clearButtonWidthCm, () => {
      this._onClearRequested.invoke()
    })
    this.saveButton = save.button
    this.saveButtonLabel = save.label
    layout.addItems([save.item, clear.item])
    return item
  }

  private applyCardAppearance(card: CardView, shot: ShotState, selected: boolean): void {
    card.shotLabel.text = `SHOT ${shot.shotNumber}`
    this.setBorderColor(card, selected ? this.selectedBorderColor : this.idleBorderColor)

    if (!shot.occupied) {
      card.emptyLabel.text = "EMPTY"
      card.emptyLabel.getSceneObject().enabled = true
      card.lensLabel.text = ""
      card.matchLabel.text = ""
      card.distortionLabel.text = ""
      card.lightLabel.text = ""
      card.actorA.getSceneObject().enabled = false
      card.actorB.getSceneObject().enabled = false
      card.lightMark.getSceneObject().enabled = false
      return
    }

    card.emptyLabel.getSceneObject().enabled = false
    card.lensLabel.text = `${shot.lensLabel} / ${shot.framingLabel}`
    card.matchLabel.text = shot.matchFramingEnabled ? "MATCH ON" : "MATCH OFF"
    card.distortionLabel.text = this.compactDistortionLabel(shot)
    card.lightLabel.text = `${shot.keyLightColorPreset} / ${shot.keyLightIntensityPreset}`
    this.placeActorIcon(card, card.actorA, shot.actorAThumbnailPosition, shot.actorAThumbnailVisible, shot.actorAThumbnailScale)
    this.placeActorIcon(card, card.actorB, shot.actorBThumbnailPosition, shot.actorBThumbnailVisible, shot.actorBThumbnailScale)
    this.placeLightMark(card, shot)
  }

  private compactDistortionLabel(shot: ShotState): string {
    if (!shot.lensDistortionEnabled) {
      return "DIST OFF"
    }
    const description = shot.distortionDescription.trim().toUpperCase()
    if (description.indexOf("PINCUSHION") >= 0) {
      return "PINCUSHION"
    }
    if (description.indexOf("MILD") >= 0) {
      return "MILD BARREL"
    }
    if (description.indexOf("BARREL") >= 0) {
      return "BARREL"
    }
    return "NEUTRAL"
  }

  private placeActorIcon(
    card: CardView,
    icon: Text,
    screenPosition: vec2,
    visible: boolean,
    scale: number
  ): void {
    const host = icon.getSceneObject()
    if (!visible) {
      host.enabled = false
      return
    }

    const clampedX = Math.min(0.96, Math.max(0.04, screenPosition.x))
    const clampedY = Math.min(0.96, Math.max(0.04, screenPosition.y))
    const localX = (clampedX - 0.5) * card.thumbWidth
    const localY = (clampedY - 0.5) * card.thumbHeight
    host.enabled = true
    host.getTransform().setLocalPosition(new vec3(localX, localY, OVERLAY_Z_CM + 0.04))

    const size = Math.min(2.1, Math.max(0.75, scale * card.thumbHeight))
    icon.layoutRect = Rect.create(-size / 2, size / 2, -size / 2, size / 2)
  }

  private placeLightMark(card: CardView, shot: ShotState): void {
    const host = card.lightMark.getSceneObject()
    const radiusX = card.thumbWidth * 0.42
    const radiusY = card.thumbHeight * 0.38
    const localX = Math.cos(shot.lightDirectionAngle) * radiusX
    const localY = Math.sin(shot.lightDirectionAngle) * radiusY
    host.enabled = true
    host.getTransform().setLocalPosition(new vec3(localX, localY, OVERLAY_Z_CM + 0.05))
    host.getTransform().setLocalRotation(quat.fromEulerAngles(0, 0, shot.lightDirectionAngle))
    card.lightMark.textFill.color = this.lightColorForPreset(shot.keyLightColorPreset)
  }

  private lightColorForPreset(preset: string): vec4 {
    if (preset === "WARM") {
      return this.warmLightColor
    }
    if (preset === "COOL") {
      return this.coolLightColor
    }
    return this.neutralLightColor
  }

  private setBorderColor(card: CardView, color: vec4): void {
    const borderObject = card.borderPlate.sceneObject
    const isFlash = color === this.flashBorderColor
    const isSelected = color === this.selectedBorderColor || card.button.isOn
    borderObject.enabled = isSelected || isFlash
    card.borderPlate.style = isFlash ? "simple" : "default"
  }

  private makePlateDecorative(plate: BackPlate): void {
    plate.onInitialized.add(() => {
      if (plate.interactable) {
        plate.interactable.enabled = false
      }
      if (plate.interactionPlane) {
        plate.interactionPlane.enabled = false
      }
    })
  }

  private createActionButton(
    parent: SceneObject,
    objectName: string,
    labelText: string,
    widthCm: number,
    onPress: () => void
  ): {button: Button; label: Text; item: FlexItem} {
    const buttonObject = this.createObject(parent, objectName)
    const button = buttonObject.createComponent(Button.getTypeName()) as Button
    button.size = new vec3(widthCm, this.actionButtonHeightCm, 1)

    const labelObject = this.createObject(buttonObject, `${objectName}_Label`, new vec3(0, 0, BUTTON_LABEL_Z_LIFT_CM))
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
      -this.actionButtonHeightCm / 2,
      this.actionButtonHeightCm / 2
    )
    label.textFill.color = this.primaryTextColor

    const item = buttonObject.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = widthCm
    item.overrideHeight = this.actionButtonHeightCm
    item.flexGrow = 0
    item.flexShrink = 0
    item.alignSelf = FlexAlignSelf.Center
    button.onTriggerUp.add(onPress)
    return {button, label, item}
  }

  private createText(
    parent: SceneObject,
    objectName: string,
    value: string,
    role: TextRole,
    color: vec4,
    widthCm: number,
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
    text.layoutRect = Rect.create(-widthCm / 2, widthCm / 2, -heightCm / 2, heightCm / 2)
    text.textFill.color = color

    const item = textObject.createComponent(FlexItem.getTypeName()) as FlexItem
    item.overrideWidth = widthCm
    item.overrideHeight = heightCm
    item.alignSelf = FlexAlignSelf.Center
    item.flexGrow = 0
    item.flexShrink = 0
    return {text, item}
  }

  private createOverlayText(
    parent: SceneObject,
    objectName: string,
    value: string,
    color: vec4,
    widthCm: number,
    heightCm: number,
    position: vec3
  ): Text {
    const textObject = this.createObject(parent, objectName, position)
    const text = textObject.createComponent("Component.Text") as Text
    text.text = value
    text.depthTest = true
    applyTextRole(text, "Caption", this.fontSizeScale)
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.verticalOverflow = VerticalOverflow.Overflow
    text.layoutRect = Rect.create(-widthCm / 2, widthCm / 2, -heightCm / 2, heightCm / 2)
    text.textFill.color = color
    return text
  }

  private createObject(parent: SceneObject, name: string, position?: vec3): SceneObject {
    const sceneObject = global.scene.createSceneObject(name)
    sceneObject.setParent(parent)
    if (position) {
      sceneObject.getTransform().setLocalPosition(position)
    }
    return sceneObject
  }
}
