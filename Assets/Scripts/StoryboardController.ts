/**
 * StoryboardController — session-only three-slot shot memory for ShotSpace.
 * Captures and restores complete shot setups without adding cameras, render
 * targets, or persistence.
 */
import {LensController} from "./LensController"
import {LightingController} from "./LightingController"
import {SpatialManipulationController} from "./SpatialManipulationController"
import {ShotSpaceStoryboardUI} from "./ShotSpaceStoryboardUI"
import {ShotState} from "./ShotState"

export type {ShotState}

const SLOT_COUNT = 3
const ACTOR_HEIGHT_CM = 6
const MIN_RELIABLE_PROJECTED_SCALE = 0.02
const MAX_RELIABLE_PROJECTED_SCALE = 1.6
const CLEAR_STATUS_HOLD_SEC = 1.2

function copyVec3(value: vec3): vec3 {
  return new vec3(value.x, value.y, value.z)
}

function copyVec2(value: vec2): vec2 {
  return new vec2(value.x, value.y)
}

function copyQuat(value: quat): quat {
  return new quat(value.w, value.x, value.y, value.z)
}

function copyColor(value: vec3): vec3 {
  return new vec3(value.x, value.y, value.z)
}

function identityQuat(): quat {
  return quat.quatIdentity()
}

function fallbackThumbnailScale(framingLabel: string): number {
  const label = framingLabel.trim().toUpperCase()
  if (label === "WIDE") {
    return 0.16
  }
  if (label === "CLOSE-UP") {
    return 0.4
  }
  return 0.26
}

function isScreenPointVisible(point: vec2): boolean {
  return (
    isFinite(point.x) &&
    isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 1 &&
    point.y >= 0 &&
    point.y <= 1
  )
}

@component
export class StoryboardController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">Storyboard Controller</span>')
  @ui.separator

  @ui.group_start("References")
  @input
  @hint("Existing LensController that remains the source of truth for lens and framing.")
  lensController!: LensController

  @input
  @hint("Existing LightingController that remains the source of truth for key-light look.")
  lightingController!: LightingController

  @input
  @hint("Existing SpatialManipulationController that applies actor and rig poses.")
  spatialManipulationController!: SpatialManipulationController

  @input
  @hint("World-space storyboard rail UI created by ShotSpaceStoryboardUI.")
  storyboardUI!: ShotSpaceStoryboardUI

  @input
  @hint("Existing ActorA placeholder. ActorA_FramingTarget remains its child.")
  actorA!: SceneObject

  @input
  @hint("Existing ActorB placeholder.")
  actorB!: SceneObject

  @input
  @hint("Existing ShotCamera used only to project schematic thumbnail positions.")
  shotCamera!: SceneObject

  @input
  @hint("Existing ShotCameraRig whose world pose is stored and restored.")
  shotCameraRig!: SceneObject

  @input
  @hint("Existing KeyLightRig whose world pose is stored and restored.")
  keyLightRig!: SceneObject

  @input
  @hint("Existing ActorA_FramingTarget, kept as ActorA's child during restore.")
  framingTarget!: SceneObject
  @ui.group_end

  private readonly slots: ShotState[] = []
  private selectedSlotIndex: number | null = null
  private statusText: string = "READY TO SAVE"
  private saveButtonLabel: string = "SAVE SHOT"
  private isRestoringShot: boolean = false
  private readyStatusEvent: DelayedCallbackEvent | null = null

  onAwake(): void {
    this.slots.push(this.createEmptyShot(1))
    this.slots.push(this.createEmptyShot(2))
    this.slots.push(this.createEmptyShot(3))
    this.createEvent("OnStartEvent").bind(() => this.onStart())
  }

  private onStart(): void {
    if (!this.ensureControllersAvailable("start storyboard")) {
      return
    }

    this.storyboardUI.onSaveRequested.add(() => this.onSaveButtonPressed())
    this.storyboardUI.onClearRequested.add(() => this.clearStoryboard())
    this.storyboardUI.onCardSelected.add((slotIndex: number) => {
      this.selectAndRecallShot(slotIndex)
    })

    this.statusText = "READY TO SAVE"
    this.refreshSaveButtonLabel()
    this.updateStoryboardUI()
  }

  public onSaveButtonPressed(): void {
    if (this.allSlotsOccupied()) {
      if (this.selectedSlotIndex === null) {
        this.setStatus("SELECT A SHOT TO REPLACE")
        this.updateStoryboardUI()
        return
      }
      this.replaceSelectedShot()
      return
    }

    this.saveShot()
  }

  public saveShot(): void {
    const slotIndex = this.findFirstEmptySlot()
    if (slotIndex < 0) {
      if (this.selectedSlotIndex === null) {
        this.setStatus("SELECT A SHOT TO REPLACE")
        this.updateStoryboardUI()
      }
      return
    }

    const captured = this.captureCurrentShotState()
    if (isNull(captured)) {
      return
    }

    captured.shotNumber = slotIndex + 1
    captured.occupied = true
    this.slots[slotIndex] = captured
    this.selectedSlotIndex = slotIndex
    this.setStatus(`SHOT ${captured.shotNumber} SAVED`)
    this.refreshSaveButtonLabel()
    this.updateStoryboardUI()
    this.storyboardUI.flashCard(slotIndex)
    console.info(`[StoryboardController] Saved shot ${captured.shotNumber} into card ${slotIndex + 1}.`)
  }

  public selectAndRecallShot(slotIndex: number): void {
    if (!this.isValidSlot(slotIndex)) {
      return
    }

    const shot = this.slots[slotIndex]
    this.selectedSlotIndex = slotIndex
    this.refreshSaveButtonLabel()

    if (!shot.occupied) {
      this.updateStoryboardUI()
      return
    }

    this.restoreShotState(shot)
    this.setStatus(`SHOT ${shot.shotNumber} RECALLED`)
    this.updateStoryboardUI()
    console.info(`[StoryboardController] Recalled shot ${shot.shotNumber}.`)
  }

  public replaceSelectedShot(): void {
    if (this.selectedSlotIndex === null) {
      this.setStatus("SELECT A SHOT TO REPLACE")
      this.updateStoryboardUI()
      return
    }

    const slotIndex = this.selectedSlotIndex
    const existing = this.slots[slotIndex]
    const captured = this.captureCurrentShotState()
    if (isNull(captured)) {
      return
    }

    captured.shotNumber = existing.shotNumber
    captured.occupied = true
    this.slots[slotIndex] = captured
    this.setStatus(`SHOT ${captured.shotNumber} UPDATED`)
    this.refreshSaveButtonLabel()
    this.updateStoryboardUI()
    this.storyboardUI.flashCard(slotIndex)
    console.info(`[StoryboardController] Updated shot ${captured.shotNumber}.`)
  }

  public clearStoryboard(): void {
    this.slots[0] = this.createEmptyShot(1)
    this.slots[1] = this.createEmptyShot(2)
    this.slots[2] = this.createEmptyShot(3)
    this.selectedSlotIndex = null
    this.saveButtonLabel = "SAVE SHOT"
    this.setStatus("STORYBOARD CLEARED")
    this.updateStoryboardUI()
    this.scheduleReadyStatus()
    console.info("[StoryboardController] Cleared storyboard without changing the live scene.")
  }

  public updateStoryboardUI(): void {
    if (!this.storyboardUI || isNull(this.storyboardUI)) {
      return
    }

    this.storyboardUI.applyStoryboardView({
      slots: this.slots.map((slot) => this.cloneShotState(slot)),
      selectedSlotIndex: this.selectedSlotIndex,
      saveButtonLabel: this.saveButtonLabel,
      statusText: this.statusText,
    })
  }

  public captureCurrentShotState(): ShotState | null {
    if (!this.ensureControllersAvailable("capture shot")) {
      return null
    }
    if (!this.ensureSceneObjectsAvailable("capture shot")) {
      return null
    }

    const lensState = this.lensController.getCurrentState()
    const lightState = this.lightingController.getCurrentState()
    if (isNull(lensState) || isNull(lightState)) {
      console.error("[StoryboardController] Cannot capture shot: lens or lighting state is unavailable.")
      return null
    }

    const actorATransform = this.actorA.getTransform()
    const actorBTransform = this.actorB.getTransform()
    const cameraRigTransform = this.shotCameraRig.getTransform()
    const lightRigTransform = this.keyLightRig.getTransform()
    const projection = this.projectActorsForThumbnail(lensState.framingDisplayLabel)

    return {
      shotNumber: 0,
      occupied: true,
      lensLabel: lensState.currentLens.displayLabel,
      focalLengthMm: lensState.currentLens.focalLengthMm,
      cameraFovRadians: this.readLiveCameraFov(lensState.currentLens.fovRadians),
      framingLabel: lensState.framingDisplayLabel,
      lastNonCustomFramingLabel: this.lensController.getLastAutomaticFramingPreset().displayLabel,
      matchFramingEnabled: lensState.matchFramingEnabled,
      lensDistortionEnabled: lensState.lensDistortionEnabled,
      distortionK1: lensState.currentLens.distortionK1,
      distortionK2: lensState.currentLens.distortionK2,
      distortionDescription: lensState.currentLens.distortionDescription,
      actorAPosition: copyVec3(actorATransform.getLocalPosition()),
      actorARotation: copyQuat(actorATransform.getLocalRotation()),
      actorBPosition: copyVec3(actorBTransform.getLocalPosition()),
      actorBRotation: copyQuat(actorBTransform.getLocalRotation()),
      shotCameraRigPosition: copyVec3(cameraRigTransform.getWorldPosition()),
      shotCameraRigRotation: copyQuat(cameraRigTransform.getWorldRotation()),
      keyLightRigPosition: copyVec3(lightRigTransform.getWorldPosition()),
      keyLightRigRotation: copyQuat(lightRigTransform.getWorldRotation()),
      keyLightIntensityPreset: lightState.intensityName,
      keyLightIntensityValue: lightState.intensity,
      keyLightColorPreset: lightState.colorName,
      keyLightColorValue: copyColor(lightState.color),
      actorAThumbnailPosition: copyVec2(projection.actorAPosition),
      actorBThumbnailPosition: copyVec2(projection.actorBPosition),
      actorAThumbnailVisible: projection.actorAVisible,
      actorBThumbnailVisible: projection.actorBVisible,
      actorAThumbnailScale: projection.actorAScale,
      actorBThumbnailScale: projection.actorBScale,
      lightDirectionAngle: projection.lightDirectionAngle,
    }
  }

  public restoreShotState(shotState: ShotState): void {
    if (!shotState.occupied) {
      return
    }
    if (!this.ensureControllersAvailable("restore shot")) {
      return
    }
    if (!this.ensureSceneObjectsAvailable("restore shot")) {
      return
    }

    this.isRestoringShot = true
    this.lensController.beginShotRestore()
    this.spatialManipulationController.beginShotRestore()

    this.spatialManipulationController.restoreSavedTransforms(
      copyVec3(shotState.actorAPosition),
      copyQuat(shotState.actorARotation),
      copyVec3(shotState.actorBPosition),
      copyQuat(shotState.actorBRotation),
      copyVec3(shotState.shotCameraRigPosition),
      copyQuat(shotState.shotCameraRigRotation),
      copyVec3(shotState.keyLightRigPosition),
      copyQuat(shotState.keyLightRigRotation)
    )
    this.preserveFramingTargetRelationship()

    this.lightingController.restoreSavedLook(
      shotState.keyLightIntensityPreset,
      shotState.keyLightColorPreset,
      shotState.keyLightIntensityValue,
      copyColor(shotState.keyLightColorValue)
    )

    this.lensController.restoreSavedOpticalState({
      focalLengthMm: shotState.focalLengthMm,
      cameraFovRadians: shotState.cameraFovRadians,
      framingLabel: shotState.framingLabel,
      lastNonCustomFramingLabel: shotState.lastNonCustomFramingLabel,
      matchFramingEnabled: shotState.matchFramingEnabled,
      lensDistortionEnabled: shotState.lensDistortionEnabled,
      distortionK1: shotState.distortionK1,
      distortionK2: shotState.distortionK2,
    })

    this.spatialManipulationController.endShotRestore()
    this.lensController.endShotRestore()
    this.isRestoringShot = false
  }

  public getSelectedSlotIndex(): number | null {
    return this.selectedSlotIndex
  }

  public getStatusText(): string {
    return this.statusText
  }

  public getSaveButtonLabel(): string {
    return this.saveButtonLabel
  }

  public getSlotSnapshot(slotIndex: number): ShotState | null {
    if (!this.isValidSlot(slotIndex)) {
      return null
    }
    return this.cloneShotState(this.slots[slotIndex])
  }

  public isRestoreInProgress(): boolean {
    return this.isRestoringShot
  }

  private projectActorsForThumbnail(framingLabel: string): {
    actorAPosition: vec2
    actorBPosition: vec2
    actorAVisible: boolean
    actorBVisible: boolean
    actorAScale: number
    actorBScale: number
    lightDirectionAngle: number
  } {
    const actorACenter = this.actorA.getTransform().getWorldPosition()
    const actorBCenter = this.actorB.getTransform().getWorldPosition()
    const actorAProjected = this.projectPoint(actorACenter)
    const actorBProjected = this.projectPoint(actorBCenter)
    const fallbackScale = fallbackThumbnailScale(framingLabel)

    return {
      actorAPosition: actorAProjected,
      actorBPosition: actorBProjected,
      actorAVisible: isScreenPointVisible(actorAProjected),
      actorBVisible: isScreenPointVisible(actorBProjected),
      actorAScale: this.estimateActorScale(actorACenter, fallbackScale),
      actorBScale: this.estimateActorScale(actorBCenter, fallbackScale),
      lightDirectionAngle: this.computeLightDirectionAngle(),
    }
  }

  private projectPoint(worldPosition: vec3): vec2 {
    const projected = this.lensController.projectWorldPointToScreen(worldPosition)
    if (isNull(projected)) {
      return new vec2(-1, -1)
    }
    return copyVec2(projected)
  }

  private estimateActorScale(center: vec3, fallbackScale: number): number {
    const halfHeight = ACTOR_HEIGHT_CM / 2
    const top = this.projectPoint(center.add(new vec3(0, halfHeight, 0)))
    const bottom = this.projectPoint(center.add(new vec3(0, -halfHeight, 0)))
    const projectedScale = Math.abs(top.y - bottom.y)
    if (
      !isFinite(projectedScale) ||
      projectedScale < MIN_RELIABLE_PROJECTED_SCALE ||
      projectedScale > MAX_RELIABLE_PROJECTED_SCALE
    ) {
      return fallbackScale
    }
    return projectedScale
  }

  private computeLightDirectionAngle(): number {
    const lightPosition = this.keyLightRig.getTransform().getWorldPosition()
    const projectedLight = this.projectPoint(lightPosition)
    if (isScreenPointVisible(projectedLight) || (isFinite(projectedLight.x) && isFinite(projectedLight.y))) {
      return Math.atan2(projectedLight.y - 0.5, projectedLight.x - 0.5)
    }

    const cameraTransform = this.shotCamera.getTransform()
    const toLight = lightPosition.sub(cameraTransform.getWorldPosition())
    if (toLight.lengthSquared <= 0.000001) {
      return 0
    }
    const direction = toLight.normalize()
    return Math.atan2(direction.dot(cameraTransform.up), direction.dot(cameraTransform.right))
  }

  private readLiveCameraFov(fallbackFov: number): number {
    const camera = this.shotCamera.getComponent("Component.Camera") as Camera | null
    if (isNull(camera) || !isFinite(camera.fov) || camera.fov <= 0) {
      return fallbackFov
    }
    return camera.fov
  }

  private preserveFramingTargetRelationship(): void {
    if (!this.framingTarget || isNull(this.framingTarget) || !this.actorA || isNull(this.actorA)) {
      return
    }

    const parent = this.framingTarget.getParent()
    if (isNull(parent) || parent !== this.actorA) {
      this.framingTarget.setParent(this.actorA)
      this.framingTarget.getTransform().setLocalPosition(new vec3(0, 0.25, 0))
      this.framingTarget.getTransform().setLocalRotation(quat.quatIdentity())
    }
  }

  private findFirstEmptySlot(): number {
    for (let i = 0; i < SLOT_COUNT; i++) {
      if (!this.slots[i].occupied) {
        return i
      }
    }
    return -1
  }

  private allSlotsOccupied(): boolean {
    return this.slots.every((slot) => slot.occupied)
  }

  private refreshSaveButtonLabel(): void {
    this.saveButtonLabel =
      this.allSlotsOccupied() && this.selectedSlotIndex !== null ? "UPDATE SELECTED" : "SAVE SHOT"
  }

  private setStatus(text: string): void {
    this.statusText = text
    if (this.readyStatusEvent) {
      this.readyStatusEvent.enabled = false
    }
  }

  private scheduleReadyStatus(): void {
    if (!this.readyStatusEvent) {
      this.readyStatusEvent = this.createEvent("DelayedCallbackEvent") as DelayedCallbackEvent
      this.readyStatusEvent.bind(() => {
        this.statusText = "READY TO SAVE"
        this.updateStoryboardUI()
      })
    }
    this.readyStatusEvent.enabled = true
    this.readyStatusEvent.reset(CLEAR_STATUS_HOLD_SEC)
  }

  private isValidSlot(slotIndex: number): boolean {
    return slotIndex >= 0 && slotIndex < SLOT_COUNT
  }

  private cloneShotState(shot: ShotState): ShotState {
    return {
      shotNumber: shot.shotNumber,
      occupied: shot.occupied,
      lensLabel: shot.lensLabel,
      focalLengthMm: shot.focalLengthMm,
      cameraFovRadians: shot.cameraFovRadians,
      framingLabel: shot.framingLabel,
      lastNonCustomFramingLabel: shot.lastNonCustomFramingLabel,
      matchFramingEnabled: shot.matchFramingEnabled,
      lensDistortionEnabled: shot.lensDistortionEnabled,
      distortionK1: shot.distortionK1,
      distortionK2: shot.distortionK2,
      distortionDescription: shot.distortionDescription,
      actorAPosition: copyVec3(shot.actorAPosition),
      actorARotation: copyQuat(shot.actorARotation),
      actorBPosition: copyVec3(shot.actorBPosition),
      actorBRotation: copyQuat(shot.actorBRotation),
      shotCameraRigPosition: copyVec3(shot.shotCameraRigPosition),
      shotCameraRigRotation: copyQuat(shot.shotCameraRigRotation),
      keyLightRigPosition: copyVec3(shot.keyLightRigPosition),
      keyLightRigRotation: copyQuat(shot.keyLightRigRotation),
      keyLightIntensityPreset: shot.keyLightIntensityPreset,
      keyLightIntensityValue: shot.keyLightIntensityValue,
      keyLightColorPreset: shot.keyLightColorPreset,
      keyLightColorValue: copyColor(shot.keyLightColorValue),
      actorAThumbnailPosition: copyVec2(shot.actorAThumbnailPosition),
      actorBThumbnailPosition: copyVec2(shot.actorBThumbnailPosition),
      actorAThumbnailVisible: shot.actorAThumbnailVisible,
      actorBThumbnailVisible: shot.actorBThumbnailVisible,
      actorAThumbnailScale: shot.actorAThumbnailScale,
      actorBThumbnailScale: shot.actorBThumbnailScale,
      lightDirectionAngle: shot.lightDirectionAngle,
    }
  }

  private createEmptyShot(shotNumber: number): ShotState {
    return {
      shotNumber,
      occupied: false,
      lensLabel: "",
      focalLengthMm: 0,
      cameraFovRadians: 0,
      framingLabel: "",
      lastNonCustomFramingLabel: "MEDIUM",
      matchFramingEnabled: false,
      lensDistortionEnabled: false,
      distortionK1: 0,
      distortionK2: 0,
      distortionDescription: "",
      actorAPosition: new vec3(0, 0, 0),
      actorARotation: identityQuat(),
      actorBPosition: new vec3(0, 0, 0),
      actorBRotation: identityQuat(),
      shotCameraRigPosition: new vec3(0, 0, 0),
      shotCameraRigRotation: identityQuat(),
      keyLightRigPosition: new vec3(0, 0, 0),
      keyLightRigRotation: identityQuat(),
      keyLightIntensityPreset: "MEDIUM",
      keyLightIntensityValue: 0,
      keyLightColorPreset: "NEUTRAL",
      keyLightColorValue: new vec3(1, 1, 1),
      actorAThumbnailPosition: new vec2(-1, -1),
      actorBThumbnailPosition: new vec2(-1, -1),
      actorAThumbnailVisible: false,
      actorBThumbnailVisible: false,
      actorAThumbnailScale: 0.26,
      actorBThumbnailScale: 0.26,
      lightDirectionAngle: 0,
    }
  }

  private ensureControllersAvailable(action: string): boolean {
    if (!this.lensController || isNull(this.lensController)) {
      console.error(`[StoryboardController] Cannot ${action}: lensController is unavailable.`)
      return false
    }
    if (!this.lightingController || isNull(this.lightingController)) {
      console.error(`[StoryboardController] Cannot ${action}: lightingController is unavailable.`)
      return false
    }
    if (!this.spatialManipulationController || isNull(this.spatialManipulationController)) {
      console.error(
        `[StoryboardController] Cannot ${action}: spatialManipulationController is unavailable.`
      )
      return false
    }
    if (!this.storyboardUI || isNull(this.storyboardUI)) {
      console.error(`[StoryboardController] Cannot ${action}: storyboardUI is unavailable.`)
      return false
    }
    return true
  }

  private ensureSceneObjectsAvailable(action: string): boolean {
    if (!this.actorA || isNull(this.actorA) || !this.actorB || isNull(this.actorB)) {
      console.error(`[StoryboardController] Cannot ${action}: ActorA or ActorB is unavailable.`)
      return false
    }
    if (!this.shotCamera || isNull(this.shotCamera) || !this.shotCameraRig || isNull(this.shotCameraRig)) {
      console.error(`[StoryboardController] Cannot ${action}: ShotCamera or ShotCameraRig is unavailable.`)
      return false
    }
    if (!this.keyLightRig || isNull(this.keyLightRig)) {
      console.error(`[StoryboardController] Cannot ${action}: KeyLightRig is unavailable.`)
      return false
    }
    return true
  }
}
