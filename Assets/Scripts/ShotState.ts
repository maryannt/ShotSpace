/**
 * Session-only saved shot snapshot. All vectors, rotations, and colors are
 * value copies — never live scene references.
 */
export type ShotState = {
  shotNumber: number
  occupied: boolean
  lensLabel: string
  focalLengthMm: number
  cameraFovRadians: number
  framingLabel: string
  lastNonCustomFramingLabel: string
  matchFramingEnabled: boolean
  lensDistortionEnabled: boolean
  distortionK1: number
  distortionK2: number
  distortionDescription: string
  actorAPosition: vec3
  actorARotation: quat
  actorBPosition: vec3
  actorBRotation: quat
  shotCameraRigPosition: vec3
  shotCameraRigRotation: quat
  keyLightRigPosition: vec3
  keyLightRigRotation: quat
  keyLightIntensityPreset: "LOW" | "MEDIUM" | "HIGH"
  keyLightIntensityValue: number
  keyLightColorPreset: "WARM" | "NEUTRAL" | "COOL"
  keyLightColorValue: vec3
  actorAThumbnailPosition: vec2
  actorBThumbnailPosition: vec2
  actorAThumbnailVisible: boolean
  actorBThumbnailVisible: boolean
  actorAThumbnailScale: number
  actorBThumbnailScale: number
  lightDirectionAngle: number
}
