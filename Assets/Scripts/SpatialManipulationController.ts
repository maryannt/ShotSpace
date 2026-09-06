/**
 * SpatialManipulationController — coordinates SIK grabbing for actors, the
 * shot-camera rig, and the key light. Lens, framing, Match Framing, and
 * distortion remain owned by LensController.
 */
import {
  Interactable,
  TargetingPriority,
} from "SpectaclesInteractionKit.lspkg/Components/Interaction/Interactable/Interactable"
import {
  InteractableManipulation,
  RotationAxis,
} from "SpectaclesInteractionKit.lspkg/Components/Interaction/InteractableManipulation/InteractableManipulation"
import {TargetingMode} from "SpectaclesInteractionKit.lspkg/Core/Interactor/Interactor"

import {LensController} from "./LensController"
import {LightingController} from "./LightingController"

export type ManipulationSelection = "NONE" | "ACTOR A" | "ACTOR B" | "CAMERA" | "KEY LIGHT"
export type SelectionChangedListener = (selection: ManipulationSelection) => void

type StoredTransform = {
  position: vec3
  rotation: quat
  scale: vec3
}

type ManipulableKind = "actorA" | "actorB" | "camera" | "light"

type ManipulableHandle = {
  kind: ManipulableKind
  selection: ManipulationSelection
  interactableObject: SceneObject
  manipulateRoot: SceneObject
  visualObject: SceneObject
  indicator: SceneObject | null
  interactable: Interactable
  manipulation: InteractableManipulation
  defaultLocal: StoredTransform
  restScale: vec3
  lockToFloor: boolean
  allowPitch: boolean
  floorLocalY: number
  minLocalX: number
  maxLocalX: number
  minLocalZ: number
  maxLocalZ: number
  runtimeMaterial: Material | null
  restColor: vec4 | null
}

const ACTOR_FLOOR_LOCAL_Y = 3
const ACTOR_MIN_LOCAL_X = -10.5
const ACTOR_MAX_LOCAL_X = 10.5
const ACTOR_MIN_LOCAL_Z = -7.2
const ACTOR_MAX_LOCAL_Z = 7.8
const CAMERA_MIN_WORLD_X = -28
const CAMERA_MAX_WORLD_X = 8
const CAMERA_MIN_WORLD_Y = -8.5
const CAMERA_MAX_WORLD_Y = 10
const CAMERA_MIN_WORLD_Z = -100
const CAMERA_MAX_WORLD_Z = -62
const CAMERA_MIN_ACTOR_DISTANCE_CM = 8
const LIGHT_MIN_WORLD_X = -32
const LIGHT_MAX_WORLD_X = 10
const LIGHT_MIN_WORLD_Y = -8.5
const LIGHT_MAX_WORLD_Y = 18
const LIGHT_MIN_WORLD_Z = -112
const LIGHT_MAX_WORLD_Z = -62
const HOVER_COLOR_BOOST = 1.18
const GRAB_COLOR_BOOST = 1.38

@component
export class SpatialManipulationController extends BaseScriptComponent {
  @ui.label('<span style="color: #60A5FA;">Spatial Manipulation Controller</span>')
  @ui.separator

  @ui.group_start("References")
  @input
  @hint("Existing LensController that remains the source of truth for lens and framing.")
  lensController!: LensController

  @input
  @hint("Existing LightingController that remains the source of truth for key-light look.")
  lightingController!: LightingController

  @input
  @hint("Existing ActorA placeholder. ActorA_FramingTarget must remain its child.")
  actorA!: SceneObject

  @input
  @hint("Existing ActorB placeholder.")
  actorB!: SceneObject

  @input
  @hint("Existing ShotCameraRig moved by CameraProxyMesh grabs.")
  shotCameraRig!: SceneObject

  @input
  @hint("Visible MainExperience proxy used to grab ShotCameraRig.")
  cameraProxyMesh!: SceneObject

  @input
  @hint("Existing KeyLightRig moved and aimed by KeyLightProxy.")
  keyLightRig!: SceneObject

  @input
  @hint("MainExperience proxy used to grab KeyLightRig.")
  keyLightProxy!: SceneObject

  @input
  @hint("Diorama root used as the actor floor and playable-set space.")
  dioramaRoot!: SceneObject
  @ui.group_end

  @ui.separator
  @ui.group_start("Feedback")
  @input("vec4", "{0.35,0.75,1,0.35}")
  @hint("Subtle hover color for MainExperience selection indicators.")
  @widget(new ColorWidget())
  hoverIndicatorColor: vec4

  @input("vec4", "{0.55,0.95,1,0.7}")
  @hint("Brighter grab color for MainExperience selection indicators.")
  @widget(new ColorWidget())
  grabIndicatorColor: vec4

  @input("vec4", "{0.2,0.35,0.45,0.18}")
  @hint("Idle color for MainExperience selection indicators.")
  @widget(new ColorWidget())
  idleIndicatorColor: vec4
  @ui.group_end

  private readonly handles: ManipulableHandle[] = []
  private readonly selectionListeners: SelectionChangedListener[] = []
  private currentSelection: ManipulationSelection = "NONE"
  private grabbedKind: ManipulableKind | null = null
  private defaultActorA: StoredTransform | null = null
  private defaultActorB: StoredTransform | null = null
  private defaultCameraRig: StoredTransform | null = null
  private defaultKeyLightRig: StoredTransform | null = null
  onAwake(): void {
    this.createEvent("OnStartEvent").bind(() => this.onStart())
    this.createEvent("UpdateEvent").bind(() => this.onUpdate())
  }

  private onStart(): void {
    this.captureDefaultTransforms()
    this.setupActorHandle(
      "actorA",
      "ACTOR A",
      this.actorA,
      "ActorA_Interactable",
      "ActorA_SelectionIndicator",
      new vec3(1.3, 1.15, 1.3)
    )
    this.setupActorHandle(
      "actorB",
      "ACTOR B",
      this.actorB,
      "ActorB_Interactable",
      "ActorB_SelectionIndicator",
      new vec3(1.3, 1.15, 1.3)
    )
    this.setupCameraHandle()
    this.setupLightHandle()
    this.setSelection("NONE")
  }

  public getCurrentSelection(): ManipulationSelection {
    return this.currentSelection
  }

  public addSelectionChangedListener(listener: SelectionChangedListener): () => void {
    if (this.selectionListeners.indexOf(listener) < 0) {
      this.selectionListeners.push(listener)
    }
    return () => this.removeSelectionChangedListener(listener)
  }

  public removeSelectionChangedListener(listener: SelectionChangedListener): void {
    const index = this.selectionListeners.indexOf(listener)
    if (index >= 0) {
      this.selectionListeners.splice(index, 1)
    }
  }

  public reframeActorA(): void {
    if (!this.lensController || isNull(this.lensController)) {
      console.error("[SpatialManipulationController] Cannot reframe: lensController is unavailable.")
      return
    }
    this.lensController.reframeActorA()
  }

  public resetLayout(): void {
    this.releaseCurrentGrabVisuals()
    this.grabbedKind = null
    this.setSelection("NONE")

    if (this.defaultActorA) {
      this.applyStoredLocal(this.actorA, this.defaultActorA)
    }
    if (this.defaultActorB) {
      this.applyStoredLocal(this.actorB, this.defaultActorB)
    }
    if (this.defaultCameraRig) {
      this.applyStoredWorld(this.shotCameraRig, this.defaultCameraRig)
    }
    if (this.defaultKeyLightRig) {
      this.applyStoredWorld(this.keyLightRig, this.defaultKeyLightRig)
    }

    if (this.lightingController && !isNull(this.lightingController)) {
      this.lightingController.resetLighting()
    }

    if (this.lensController && !isNull(this.lensController)) {
      this.lensController.restoreDefaultShotState()
    }
  }

  private onUpdate(): void {
    if (this.grabbedKind === null) {
      return
    }

    const handle = this.findHandle(this.grabbedKind)
    if (!handle) {
      return
    }

    this.applyLiveConstraints(handle)
  }

  private setupActorHandle(
    kind: ManipulableKind,
    selection: ManipulationSelection,
    actor: SceneObject,
    interactableName: string,
    indicatorName: string,
    colliderSize: vec3
  ): void {
    if (!actor || isNull(actor)) {
      console.error(`[SpatialManipulationController] ${interactableName} parent is not wired.`)
      return
    }

    const interactableObject = this.findOrCreateChild(actor, interactableName)
    this.prepareInteractableObject(interactableObject, colliderSize)
    const indicator = this.findChildByName(actor, indicatorName)
    this.configureIndicator(indicator)

    const handle = this.createHandle({
      kind,
      selection,
      interactableObject,
      manipulateRoot: actor,
      visualObject: actor,
      indicator,
      colliderSize: this.worldColliderSize(actor, colliderSize),
      lockToFloor: true,
      allowPitch: false,
      enableYTranslation: false,
      rotationAxis: RotationAxis.Y,
    })

    handle.floorLocalY = ACTOR_FLOOR_LOCAL_Y
    handle.minLocalX = ACTOR_MIN_LOCAL_X
    handle.maxLocalX = ACTOR_MAX_LOCAL_X
    handle.minLocalZ = ACTOR_MIN_LOCAL_Z
    handle.maxLocalZ = ACTOR_MAX_LOCAL_Z
    this.handles.push(handle)
  }

  private setupCameraHandle(): void {
    if (!this.cameraProxyMesh || isNull(this.cameraProxyMesh) || !this.shotCameraRig) {
      console.error("[SpatialManipulationController] Camera proxy or rig is not wired.")
      return
    }

    const interactableObject = this.findOrCreateChild(this.cameraProxyMesh, "CameraRig_Interactable")
    this.prepareInteractableObject(interactableObject, new vec3(1, 1, 1))
    const indicator = this.findChildByName(this.shotCameraRig, "CameraRig_SelectionIndicator")
    this.configureIndicator(indicator)

    const handle = this.createHandle({
      kind: "camera",
      selection: "CAMERA",
      interactableObject,
      manipulateRoot: this.shotCameraRig,
      visualObject: this.cameraProxyMesh,
      indicator,
      colliderSize: this.worldColliderSize(this.cameraProxyMesh, new vec3(1.15, 1.15, 1.15)),
      lockToFloor: false,
      allowPitch: true,
      enableYTranslation: true,
      rotationAxis: RotationAxis.All,
    })
    this.handles.push(handle)
  }

  private setupLightHandle(): void {
    if (!this.keyLightProxy || isNull(this.keyLightProxy) || !this.keyLightRig) {
      console.error("[SpatialManipulationController] Key light proxy or rig is not wired.")
      return
    }

    const interactableObject = this.findOrCreateChild(this.keyLightProxy, "KeyLightRig_Interactable")
    this.prepareInteractableObject(interactableObject, new vec3(1, 1, 1))
    const indicator = this.findChildByName(this.keyLightRig, "KeyLight_SelectionIndicator")
    this.configureIndicator(indicator)

    const handle = this.createHandle({
      kind: "light",
      selection: "KEY LIGHT",
      interactableObject,
      manipulateRoot: this.keyLightRig,
      visualObject: this.keyLightProxy,
      indicator,
      colliderSize: this.worldColliderSize(this.keyLightProxy, new vec3(1.15, 1.15, 1.15)),
      lockToFloor: false,
      allowPitch: true,
      enableYTranslation: true,
      rotationAxis: RotationAxis.All,
    })
    this.handles.push(handle)
  }

  private createHandle(config: {
    kind: ManipulableKind
    selection: ManipulationSelection
    interactableObject: SceneObject
    manipulateRoot: SceneObject
    visualObject: SceneObject
    indicator: SceneObject | null
    colliderSize: vec3
    lockToFloor: boolean
    allowPitch: boolean
    enableYTranslation: boolean
    rotationAxis: RotationAxis
  }): ManipulableHandle {
    this.ensureCollider(config.interactableObject, config.colliderSize)

    let interactable = config.interactableObject.getComponent(Interactable.getTypeName()) as Interactable
    if (!interactable) {
      interactable = config.interactableObject.createComponent(Interactable.getTypeName()) as Interactable
    }
    interactable.targetingMode = TargetingMode.Direct | TargetingMode.Indirect
    interactable.targetingPriority = TargetingPriority.High

    let manipulation = config.interactableObject.getComponent(
      InteractableManipulation.getTypeName()
    ) as InteractableManipulation
    if (!manipulation) {
      manipulation = config.interactableObject.createComponent(
        InteractableManipulation.getTypeName()
      ) as InteractableManipulation
    }
    manipulation.enabled = true
    manipulation.setManipulateRoot(config.manipulateRoot.getTransform())
    manipulation.setCanTranslate(true)
    manipulation.setCanRotate(true)
    manipulation.setCanScale(false)
    manipulation.enableXTranslation = true
    manipulation.enableYTranslation = config.enableYTranslation
    manipulation.enableZTranslation = true
    manipulation.rotationAxis = config.rotationAxis

    const restScale = config.manipulateRoot.getTransform().getLocalScale()
    const handle: ManipulableHandle = {
      kind: config.kind,
      selection: config.selection,
      interactableObject: config.interactableObject,
      manipulateRoot: config.manipulateRoot,
      visualObject: config.visualObject,
      indicator: config.indicator,
      interactable,
      manipulation,
      defaultLocal: this.readLocal(config.manipulateRoot),
      restScale,
      lockToFloor: config.lockToFloor,
      allowPitch: config.allowPitch,
      floorLocalY: ACTOR_FLOOR_LOCAL_Y,
      minLocalX: ACTOR_MIN_LOCAL_X,
      maxLocalX: ACTOR_MAX_LOCAL_X,
      minLocalZ: ACTOR_MIN_LOCAL_Z,
      maxLocalZ: ACTOR_MAX_LOCAL_Z,
      runtimeMaterial: this.cloneVisualMaterial(config.visualObject),
      restColor: null,
    }
    if (handle.runtimeMaterial) {
      handle.restColor = handle.runtimeMaterial.mainPass.baseColor
    }

    interactable.onHoverEnter.add(() => {
      if (this.grabbedKind === null) {
        this.applyFeedback(handle, "hover")
      }
    })
    interactable.onHoverExit.add(() => {
      if (this.grabbedKind !== handle.kind) {
        this.applyFeedback(handle, "idle")
      }
    })
    manipulation.onManipulationStart.add(() => this.onManipulationStart(handle))
    manipulation.onManipulationEnd.add(() => this.onManipulationEnd(handle))

    return handle
  }

  private onManipulationStart(handle: ManipulableHandle): void {
    this.grabbedKind = handle.kind
    this.setSelection(handle.selection)
    this.applyFeedback(handle, "grab")

    if (handle.kind === "camera" && this.lensController && !isNull(this.lensController)) {
      this.lensController.beginManualCameraManipulation()
    }
  }

  private onManipulationEnd(handle: ManipulableHandle): void {
    this.applyReleaseConstraints(handle)
    this.applyFeedback(handle, "idle")
    if (this.grabbedKind === handle.kind) {
      this.grabbedKind = null
    }
    this.setSelection("NONE")

    if (handle.kind === "camera" && this.lensController && !isNull(this.lensController)) {
      this.lensController.endManualCameraManipulation()
    }
  }

  private applyLiveConstraints(handle: ManipulableHandle): void {
    if (handle.lockToFloor) {
      this.constrainActor(handle, false)
      return
    }
    if (handle.kind === "camera") {
      this.constrainCamera(false)
      return
    }
    if (handle.kind === "light") {
      this.constrainLight(false)
    }
  }

  private applyReleaseConstraints(handle: ManipulableHandle): void {
    if (handle.lockToFloor) {
      this.constrainActor(handle, true)
      return
    }
    if (handle.kind === "camera") {
      this.constrainCamera(true)
      return
    }
    if (handle.kind === "light") {
      this.constrainLight(true)
    }
  }

  private constrainActor(handle: ManipulableHandle, zeroPitchAndRoll: boolean): void {
    const transform = handle.manipulateRoot.getTransform()
    const localPosition = transform.getLocalPosition()
    localPosition.x = this.clamp(localPosition.x, handle.minLocalX, handle.maxLocalX)
    localPosition.y = handle.floorLocalY
    localPosition.z = this.clamp(localPosition.z, handle.minLocalZ, handle.maxLocalZ)
    transform.setLocalPosition(localPosition)
    transform.setLocalScale(handle.restScale)

    const euler = transform.getLocalRotation().toEulerAngles()
    const pitch = zeroPitchAndRoll ? 0 : 0
    const roll = 0
    transform.setLocalRotation(quat.fromEulerAngles(pitch, euler.y, roll))
  }

  private constrainCamera(zeroRoll: boolean): void {
    const transform = this.shotCameraRig.getTransform()
    const worldPosition = transform.getWorldPosition()
    worldPosition.x = this.clamp(worldPosition.x, CAMERA_MIN_WORLD_X, CAMERA_MAX_WORLD_X)
    worldPosition.y = this.clamp(worldPosition.y, CAMERA_MIN_WORLD_Y, CAMERA_MAX_WORLD_Y)
    worldPosition.z = this.clamp(worldPosition.z, CAMERA_MIN_WORLD_Z, CAMERA_MAX_WORLD_Z)

    const pushed = this.pushAwayFromActors(worldPosition)
    transform.setWorldPosition(pushed)
    transform.setLocalScale(vec3.one())

    if (zeroRoll) {
      const euler = transform.getWorldRotation().toEulerAngles()
      transform.setWorldRotation(quat.fromEulerAngles(euler.x, euler.y, 0))
    }
  }

  private constrainLight(zeroRoll: boolean): void {
    const transform = this.keyLightRig.getTransform()
    const worldPosition = transform.getWorldPosition()
    worldPosition.x = this.clamp(worldPosition.x, LIGHT_MIN_WORLD_X, LIGHT_MAX_WORLD_X)
    worldPosition.y = this.clamp(worldPosition.y, LIGHT_MIN_WORLD_Y, LIGHT_MAX_WORLD_Y)
    worldPosition.z = this.clamp(worldPosition.z, LIGHT_MIN_WORLD_Z, LIGHT_MAX_WORLD_Z)
    transform.setWorldPosition(worldPosition)
    transform.setLocalScale(vec3.one())

    if (zeroRoll) {
      const euler = transform.getWorldRotation().toEulerAngles()
      transform.setWorldRotation(quat.fromEulerAngles(euler.x, euler.y, 0))
    }
  }

  private pushAwayFromActors(cameraPosition: vec3): vec3 {
    let result = cameraPosition
    result = this.pushAwayFrom(result, this.actorA, CAMERA_MIN_ACTOR_DISTANCE_CM)
    result = this.pushAwayFrom(result, this.actorB, 6)
    return result
  }

  private pushAwayFrom(position: vec3, target: SceneObject, minDistance: number): vec3 {
    if (!target || isNull(target)) {
      return position
    }

    const targetPosition = target.getTransform().getWorldPosition()
    const offset = position.sub(targetPosition)
    const distance = offset.length
    if (distance >= minDistance || distance <= 0.0001) {
      return position
    }

    return targetPosition.add(offset.normalize().uniformScale(minDistance))
  }

  private applyFeedback(handle: ManipulableHandle, mode: "idle" | "hover" | "grab"): void {
    if (handle.runtimeMaterial && handle.restColor) {
      const boost = mode === "grab" ? GRAB_COLOR_BOOST : mode === "hover" ? HOVER_COLOR_BOOST : 1
      handle.runtimeMaterial.mainPass.baseColor = new vec4(
        Math.min(handle.restColor.x * boost, 1.5),
        Math.min(handle.restColor.y * boost, 1.5),
        Math.min(handle.restColor.z * boost, 1.5),
        handle.restColor.w
      )
    }

    this.tintIndicator(handle.indicator, mode)
  }

  private tintIndicator(indicator: SceneObject | null, mode: "idle" | "hover" | "grab"): void {
    if (!indicator || isNull(indicator)) {
      return
    }

    const visual = indicator.getComponent("Component.RenderMeshVisual") as RenderMeshVisual | null
    if (isNull(visual) || !visual.mainMaterial) {
      return
    }

    const color =
      mode === "grab"
        ? this.grabIndicatorColor
        : mode === "hover"
          ? this.hoverIndicatorColor
          : this.idleIndicatorColor
    visual.mainMaterial.mainPass.baseColor = color
  }

  private configureIndicator(indicator: SceneObject | null): void {
    if (!indicator || isNull(indicator)) {
      return
    }
    indicator.layer = this.mainExperienceLayer()
    const visual = indicator.getComponent("Component.RenderMeshVisual") as RenderMeshVisual | null
    if (!isNull(visual) && visual.mainMaterial) {
      const cloned = visual.mainMaterial.clone()
      visual.clearMaterials()
      visual.addMaterial(cloned)
    }
    this.tintIndicator(indicator, "idle")
  }

  private cloneVisualMaterial(visualObject: SceneObject): Material | null {
    const visual = visualObject.getComponent("Component.RenderMeshVisual") as RenderMeshVisual | null
    if (isNull(visual) || !visual.mainMaterial) {
      return null
    }

    const cloned = visual.mainMaterial.clone()
    visual.clearMaterials()
    visual.addMaterial(cloned)
    return cloned
  }

  private ensureCollider(object: SceneObject, size: vec3): void {
    let collider = object.getComponent("ColliderComponent") as ColliderComponent
    if (!collider) {
      collider = object.getComponent("Physics.ColliderComponent") as ColliderComponent
    }
    if (!collider) {
      collider = object.createComponent("ColliderComponent") as ColliderComponent
    }
    if (!collider) {
      collider = object.createComponent("Physics.ColliderComponent") as ColliderComponent
    }
    if (!collider) {
      console.error(`[SpatialManipulationController] Could not create a collider on ${object.name}.`)
      return
    }
    const shape = Shape.createBoxShape()
    shape.size = size
    collider.shape = shape
    collider.debugDrawEnabled = false
  }

  private captureDefaultTransforms(): void {
    if (this.actorA && !isNull(this.actorA)) {
      this.defaultActorA = this.readLocal(this.actorA)
    }
    if (this.actorB && !isNull(this.actorB)) {
      this.defaultActorB = this.readLocal(this.actorB)
    }
    if (this.shotCameraRig && !isNull(this.shotCameraRig)) {
      this.defaultCameraRig = this.readWorld(this.shotCameraRig)
    }
    if (this.keyLightRig && !isNull(this.keyLightRig)) {
      this.defaultKeyLightRig = this.readWorld(this.keyLightRig)
    }
  }

  private readLocal(object: SceneObject): StoredTransform {
    const transform = object.getTransform()
    return {
      position: transform.getLocalPosition(),
      rotation: transform.getLocalRotation(),
      scale: transform.getLocalScale(),
    }
  }

  private readWorld(object: SceneObject): StoredTransform {
    const transform = object.getTransform()
    return {
      position: transform.getWorldPosition(),
      rotation: transform.getWorldRotation(),
      scale: transform.getLocalScale(),
    }
  }

  private applyStoredLocal(object: SceneObject, stored: StoredTransform): void {
    const transform = object.getTransform()
    transform.setLocalPosition(stored.position)
    transform.setLocalRotation(stored.rotation)
    transform.setLocalScale(stored.scale)
  }

  private applyStoredWorld(object: SceneObject, stored: StoredTransform): void {
    const transform = object.getTransform()
    transform.setWorldPosition(stored.position)
    transform.setWorldRotation(stored.rotation)
    transform.setLocalScale(stored.scale)
  }

  private prepareInteractableObject(object: SceneObject, _localHint: vec3): void {
    object.layer = this.defaultInteractionLayer()
    const parent = object.getParent()
    if (parent && !isNull(parent)) {
      const parentScale = parent.getTransform().getWorldScale()
      const safeX = Math.max(Math.abs(parentScale.x), 0.0001)
      const safeY = Math.max(Math.abs(parentScale.y), 0.0001)
      const safeZ = Math.max(Math.abs(parentScale.z), 0.0001)
      object.getTransform().setLocalScale(new vec3(1 / safeX, 1 / safeY, 1 / safeZ))
    }
  }

  private worldColliderSize(visualObject: SceneObject, localSize: vec3): vec3 {
    const worldScale = visualObject.getTransform().getWorldScale()
    return new vec3(
      Math.abs(worldScale.x) * localSize.x,
      Math.abs(worldScale.y) * localSize.y,
      Math.abs(worldScale.z) * localSize.z
    )
  }

  private defaultInteractionLayer(): LayerSet {
    return LayerSet.fromNumber(1)
  }

  private findOrCreateChild(parent: SceneObject, name: string): SceneObject {
    const existing = this.findChildByName(parent, name)
    if (existing) {
      return existing
    }

    const created = global.scene.createSceneObject(name)
    created.setParent(parent)
    created.layer = this.mainExperienceLayer()
    return created
  }

  private findChildByName(root: SceneObject, name: string): SceneObject | null {
    const count = root.getChildrenCount()
    for (let i = 0; i < count; i++) {
      const child = root.getChild(i)
      if (child.name === name) {
        return child
      }
      const nested = this.findChildByName(child, name)
      if (nested) {
        return nested
      }
    }
    return null
  }

  private findHandle(kind: ManipulableKind): ManipulableHandle | null {
    for (let i = 0; i < this.handles.length; i++) {
      if (this.handles[i].kind === kind) {
        return this.handles[i]
      }
    }
    return null
  }

  private setSelection(selection: ManipulationSelection): void {
    this.currentSelection = selection
    const listeners = this.selectionListeners.slice()
    listeners.forEach((listener) => listener(selection))
  }

  private releaseCurrentGrabVisuals(): void {
    for (let i = 0; i < this.handles.length; i++) {
      this.applyFeedback(this.handles[i], "idle")
    }
  }

  private mainExperienceLayer(): LayerSet {
    if (this.cameraProxyMesh && !isNull(this.cameraProxyMesh)) {
      return this.cameraProxyMesh.layer
    }
    if (this.shotCameraRig && !isNull(this.shotCameraRig)) {
      return this.shotCameraRig.layer
    }
    return this.sceneObject.layer
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }
}
