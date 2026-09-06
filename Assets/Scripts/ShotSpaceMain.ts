/**
 * ShotSpaceMain — validates and coordinates the authored previs foundation.
 *
 * Inputs:
 * - DioramaRoot, ShotCamera, PreviewScreen, and ShotSpacePreviewLabelUI.
 *
 * Must not create scene layout or author visible UI.
 */
import {ShotSpacePreviewLabelUI} from "./ShotSpacePreviewLabelUI"

@component
export class ShotSpaceMain extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">ShotSpace Foundation</span>')
  @ui.separator
  @ui.group_start("References")
  @input
  @hint("Authored root containing the tabletop set, actors, and prop.")
  dioramaRoot!: SceneObject

  @input
  @hint("Authored virtual camera that renders the PrevisSet layer.")
  shotCamera!: SceneObject

  @input
  @hint("Authored monitor surface displaying ShotPreviewRT.")
  previewScreen!: SceneObject

  @input
  @hint("Typed UI module that owns the temporary preview label.")
  previewLabel!: ShotSpacePreviewLabelUI
  @ui.group_end

  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.onStart())
  }

  private onStart(): void {
    if (
      isNull(this.dioramaRoot) ||
      isNull(this.shotCamera) ||
      isNull(this.previewScreen) ||
      isNull(this.previewLabel)
    ) {
      console.error("[ShotSpaceMain] Required authored references are not wired.")
      return
    }

    this.previewLabel.setLabel("SHOT PREVIEW")
    console.info("[ShotSpaceMain] Foundation ready: diorama, shot camera, and director preview linked.")
  }
}
