/**
 * ShotSpacePreviewLabelUI — owns the temporary world-space preview label.
 *
 * Inputs:
 * - labelText, panelWidthCm, textColor
 *
 * Must not own camera, render-target, or diorama state.
 */
import {FlexLayout} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout"
import {FlexItem} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem"
import {
  FlexAlign,
  FlexAlignSelf,
  FlexDirection,
  FlexJustify,
} from "SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes"

type TextWithWeight = Text & {weight?: number}

@component
export class ShotSpacePreviewLabelUI extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShotSpace Preview Label</span>')
  @ui.separator
  @ui.group_start("Settings")
  @input
  @hint("Temporary label shown beneath the director preview monitor.")
  labelText: string = "SHOT PREVIEW"

  @input
  @hint("Width of the world-space label layout in centimeters.")
  @widget(new SliderWidget(10, 30, 0.5))
  panelWidthCm: number = 18

  @input("vec4", "{0.75,0.9,1,1}")
  @hint("Color of the preview label on the additive Specs display.")
  @widget(new ColorWidget())
  textColor: vec4
  @ui.group_end

  private label: Text | null = null

  onAwake(): void {
    this.sceneObject.createComponent("Component.Canvas")

    const content = global.scene.createSceneObject("LabelContent")
    content.setParent(this.sceneObject)
    content.layer = this.sceneObject.layer
    content.getTransform().setLocalPosition(new vec3(0, 0, 0.1))

    const layout = content.createComponent(FlexLayout.getTypeName()) as FlexLayout
    layout.width = this.panelWidthCm
    layout.height = 2.6
    layout.direction = FlexDirection.Column
    layout.justifyContent = FlexJustify.Center
    layout.alignItems = FlexAlign.Stretch

    const labelObject = global.scene.createSceneObject("ShotPreviewLabel")
    labelObject.setParent(content)
    labelObject.layer = this.sceneObject.layer

    const text = labelObject.createComponent("Component.Text") as Text
    text.text = this.labelText
    text.depthTest = true
    text.horizontalAlignment = HorizontalAlignment.Center
    text.verticalAlignment = VerticalAlignment.Center
    text.horizontalOverflow = HorizontalOverflow.Overflow
    text.verticalOverflow = VerticalOverflow.Overflow
    text.layoutRect = Rect.create(-0.5, 0.5, -0.5, 0.5)
    text.textFill.color = this.textColor
    text.size = 41
    ;(text as TextWithWeight).weight = 700

    const item = labelObject.createComponent(FlexItem.getTypeName()) as FlexItem
    item.alignSelf = FlexAlignSelf.Stretch
    this.label = text
  }

  setLabel(value: string): void {
    this.labelText = value
    if (this.label) {
      this.label.text = value
    }
  }
}
