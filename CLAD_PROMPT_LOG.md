# ShotSpace CLAD Prompt Log

## Project Goal

ShotSpace is a spatial previsualization tool for blocking actors,
testing focal lengths and framing, previewing lens distortion,
and planning shots.

## Prompt 0 — Project Preflight

Date: 2026-09-06

Prompt:

> Using the Lens Studio router and /specs-project-init, inspect the
> currently open ShotSpace Lens Studio project and validate that it is
> ready for a SPECS 27 CLAD build.
>
> Confirm:
>
> 1. The Lens Studio MCP connection is active.
> 2. The project targets SPECS.
> 3. The Preview panel targets SPECS 27.
> 4. The main camera has Device Tracking set to World.
> 5. SPECS UI Kit is installed.
> 6. Spectacles Interaction Kit is installed.
> 7. The SpectaclesInteractionKit prefab is present exactly once.
> 8. The project compiles without red Logger errors.
>
> Make only the minimum changes required to initialize the project.
> Do not replace the base scene, create the ShotSpace experience, generate
> 3D assets, or add lens controls yet.
>
> After checking the project, run /verify-preview and report:
>
> - What was already configured correctly
> - What you changed
> - Any remaining warnings or errors
> - Whether the project is ready for scene construction

Result: Found `ShotSpace.esproj` and the existing base scene assets. No Lens project or scene changes were made because live Lens Studio access could not be established.

Problems: The Lens Studio MCP namespace and required tools were not registered in the current Cursor session. Project target, Preview configuration, camera tracking, installed packages, prefab count, compilation, and Logger output could not be validated. `/verify-preview` could not run.

Changes requested: Open `ShotSpace.esproj` in Lens Studio 5.22 or newer, ensure the Lens Studio MCP integration is enabled, then fully restart the Cursor session from this project and repeat this preflight prompt.

Correction prompt:

> Open ShotSpace.esproj in Lens Studio 5.22+, enable MCP integration, then fully restart Cursor from this project and repeat the prompt.

Correction result: `ShotSpace.esproj` was launched successfully using its Windows file association. Enabling MCP and restarting Cursor remain manual UI actions; the preflight must be repeated in the restarted session.

Retry result: After Cursor restarted, the Lens Studio MCP connection was active and authorized. Lens Studio 5.23.2 had the correct `ShotSpace.esproj` open. The project already targeted SPECS; Preview was set to SPECS 27 with the Sunlit Room interactive source; the main Perspective camera had Device Tracking set to World; SPECS UI Kit and Spectacles Interaction Kit were installed; and exactly one `SpectaclesInteractionKit` prefab was present at the scene root. TypeScript compilation succeeded, runtime Logger collection returned no warnings or errors, and `/verify-preview` captured a valid SPECS 27 stereo preview.

Retry problems: None.

Retry changes: No Lens scene, package, camera, preview, or project-setting changes were required. Only this prompt log was updated.

Ready for scene construction: Yes.

## Prompt 1 — Scene Foundation

Date: 2026-09-06

Prompt:

> Using SPECS experience builder, create the first foundation of a
> SPECS spatial filmmaking previsualization experience called ShotSpace.
>
> The goal of this phase is only to establish:
>
> 1. A small tabletop filmmaking diorama
> 2. A separate virtual shot camera
> 3. A 16:9 render target
> 4. A world-space director's preview monitor displaying the shot camera
> 5. Correct render-layer separation
>
> Use simple, lightweight primitives for this first version. Do not use
> text-to-3D or generate detailed assets.
>
> Create this organization:
>
> ShotSpaceRoot
> - DioramaRoot
>   - Floor with a visible grid
>   - BackWall
>   - SideWall
>   - ActorA placeholder
>   - ActorB placeholder
>   - One foreground set object
> - ShotCameraRig
>   - ShotCamera
>   - CameraProxyMesh
> - KeyLightRig
>   - KeyLight
>   - LightConeVisualizer
> - PreviewPanel
>   - PreviewScreen
>   - PreviewFrame
>   - Temporary label reading "SHOT PREVIEW"
> - Systems
>
> Create or configure these render layers:
>
> - PrevisSet
> - MainExperience
> - Interface
>
> Layer behavior:
>
> - The set, actors, and props belong to PrevisSet.
> - ShotCamera renders only PrevisSet.
> - CameraProxyMesh and LightConeVisualizer belong to MainExperience.
> - PreviewPanel belongs to Interface.
> - The main SPECS camera can see the entire experience.
> - ShotCamera must not see PreviewPanel, CameraProxyMesh, UI, or its own
>   output.
>
> Create one Texture2D render target named ShotPreviewRT at 512 × 288.
> Use a 16:9 aspect ratio.
>
> Configure ShotCamera as a perspective camera that renders PrevisSet
> into ShotPreviewRT. Disable physical camera-property overrides so its
> field of view can later be controlled through script.
>
> Create an unlit preview material that samples ShotPreviewRT and place it
> on the world-space PreviewScreen.
>
> Position the diorama and preview monitor so they are both comfortably
> visible in the SPECS Preview.
>
> Do not add lens buttons, framing presets, radial distortion, saved
> shots, actor grabbing, camera grabbing, or final UI during this phase.
>
> Build the scene, save the project, and run /verify-preview.
>
> Verify that:
>
> 1. ShotCamera produces a visible image on PreviewScreen.
> 2. Repositioning ShotCamera changes the preview image.
> 3. The PreviewScreen does not appear inside its own camera feed.
> 4. The grid, both actor placeholders, and set walls appear in the feed.
> 5. The project compiles without persistent red errors.
>
> Report all objects, assets, layers, and materials created, along with
> any warnings or incomplete items.

Result: Created and saved the requested ShotSpace hierarchy using lightweight procedural box, cylinder, and cone meshes. Added the tabletop set, visible grid, two actor placeholders, foreground prop, shot-camera rig and proxy, key-light rig and cone visualizer, world-space preview monitor, temporary UIKit label, and Systems root. Created `ShotPreviewRT` at 512 × 288 and an unlit `ShotPreviewMaterial` that samples it. Configured the ShotCamera as Perspective with a 16:9 aspect, no device-property override, the PrevisSet-only mask, and `ShotPreviewRT` output. The main camera sees all experience masks. `/verify-preview` confirmed a visible isolated feed, changed framing after temporarily moving the shot camera, no recursive monitor image, expected set contents, successful TypeScript compilation, and no runtime Logger errors. The camera was restored to its authored position and the project was saved again.

Problems: Lens Studio 5.23.2 preserved the three custom layer masks and their behavior but reverted their display names to `Layer 2`, `Layer 3`, and `Layer 4` after save instead of `PrevisSet`, `MainExperience`, and `Interface`.

Changes requested:

> Can you manually rename Layer 2-4?

Correction result: The version-pinned Editor API was used to target the exact layers assigned to masks 2, 4, and 8 and rename them to `PrevisSet`, `MainExperience`, and `Interface`. Lens Studio 5.23.2 reverted all three names during project save. A before/after assignment fingerprint confirmed that all 153 scene-object and render-mask assignments were preserved. Persistent naming remains a manual Lens Studio UI step.

## Prompt 2 — Focal-Length Selection

Date: 2026-09-06

Prompt:

> Using the existing ShotSpace SPECS project, extend the working
> ShotCamera-to-PreviewScreen foundation with focal-length selection.
>
> Preserve the existing:
>
> - ShotSpaceRoot hierarchy
> - DioramaRoot
> - ShotCameraRig
> - ShotCamera
> - ShotPreviewRT
> - PreviewPanel and PreviewScreen
> - Existing render layers and materials
>
> Do not rebuild, reset, rename, or duplicate the working foundation.
>
> PHASE GOAL
>
> Create four world-space focal-length buttons that modify only
> ShotCamera's field of view and immediately display the result inside
> the existing spatial PreviewScreen.
>
> The four lens presets are:
>
> - 24mm
> - 35mm
> - 50mm
> - 85mm
>
> CAMERA CONFIGURATION
>
> Use /lens-api and the script-author agent to create a TypeScript
> component named LensController.ts inside an appropriate Scripts folder.
>
> Confirm that ShotCamera:
>
> - Uses perspective projection
> - Uses a 16:9 aspect ratio
> - Renders into ShotPreviewRT
> - Renders only the PrevisSet layer
> - Does not use physical device camera properties
> - Allows its FOV to be controlled at runtime
>
> Lens Studio's Camera.fov value must be assigned in radians.
>
> Use a simulated 36mm-wide full-frame sensor cropped to 16:9 and these
> vertical FOV values:
>
> 24mm:
> - Vertical FOV: approximately 45.7 degrees
> - FOV radians: 0.798
>
> 35mm:
> - Vertical FOV: approximately 32.3 degrees
> - FOV radians: 0.563
>
> 50mm:
> - Vertical FOV: approximately 22.9 degrees
> - FOV radians: 0.400
>
> 85mm:
> - Vertical FOV: approximately 13.6 degrees
> - FOV radians: 0.237
>
> Create a typed LensPreset data structure containing:
>
> - Display label
> - Focal length in millimeters
> - FOV in radians
>
> Create a public method that applies a selected preset to ShotCamera.
>
> When applying a lens preset:
>
> 1. Change only ShotCamera.fov.
> 2. Do not move or rotate ShotCameraRig.
> 3. Do not move either actor.
> 4. Do not change the main SPECS camera.
> 5. Update the selected-lens label.
> 6. Update the active state of the four lens buttons.
>
> WORLD-SPACE UI
>
> Using /specs-build-ui, create a compact world-space control panel
> positioned beside or directly underneath PreviewPanel.
>
> Create native SPECS UI Kit buttons named exactly:
>
> - LensButton_24mm
> - LensButton_35mm
> - LensButton_50mm
> - LensButton_85mm
>
> Do not create hand-written collider buttons if native SPECS UI Kit
> buttons are available.
>
> Each button must call LensController and apply the corresponding lens
> preset.
>
> Add a label above the preview image that displays:
>
> CURRENT LENS: 50mm
>
> Use 50mm as the default lens.
>
> Add a smaller educational label beneath it that updates with the lens:
>
> 24mm: WIDE — EXPANDED FIELD OF VIEW
> 35mm: MODERATE WIDE
> 50mm: NORMAL
> 85mm: TELEPHOTO — NARROW FIELD OF VIEW
>
> Clearly highlight the selected button using a different fill color,
> border color, brightness, or emissive state. Only one lens button
> should appear selected at a time.
>
> VISUAL TEST ENVIRONMENT
>
> Preserve the existing set, but make sure it includes enough visual
> information to demonstrate changing field of view:
>
> - Visible floor grid
> - Vertical wall edges
> - ActorA closer to the camera
> - ActorB farther from the camera
> - At least one foreground object near a frame edge
>
> Use lightweight primitives only. Do not generate new detailed 3D
> assets.
>
> INTERACTION BEHAVIOR
>
> When the user selects:
>
> 24mm:
> - PreviewScreen should display substantially more of the set.
>
> 35mm:
> - PreviewScreen should display moderately more of the set than 50mm.
>
> 50mm:
> - PreviewScreen should display the default composition.
>
> 85mm:
> - PreviewScreen should display a much tighter crop of the composition.
>
> The transitions may be immediate. Do not add animated interpolation
> unless it can be implemented without compromising stability.
>
> IMPORTANT EXCLUSIONS
>
> During this phase, do not add:
>
> - Radial lens distortion
> - Barrel or pincushion distortion
> - Match Framing
> - Automatic camera dolly movement
> - Wide, Medium, or Close-Up framing presets
> - Depth of field
> - Exposure controls
> - Saved storyboard shots
> - Actor grabbing
> - Camera grabbing
> - Additional render targets
> - Generated 3D assets
>
> VERIFICATION
>
> After implementation:
>
> 1. Save the project.
> 2. Run /verify-preview.
> 3. Trigger all four buttons in the SPECS Preview.
> 4. Confirm each button updates the label.
> 5. Confirm ShotCamera.fov receives the expected radian value.
> 6. Confirm the spatial PreviewScreen visibly changes for every lens.
> 7. Confirm ShotCameraRig's transform remains unchanged.
> 8. Confirm the main SPECS camera remains unchanged.
> 9. Confirm the preview monitor does not appear inside its own feed.
> 10. Confirm there are no persistent red Logger errors.
>
> If a button or FOV change fails, debug and repair it before adding
> anything else.
>
> At completion, report:
>
> - Scripts created or modified
> - Scene objects created
> - UI objects created
> - Inspector references assigned
> - Final FOV values
> - Verification results for each button
> - Any remaining warnings

Result: Created `Assets/Scripts/LensController.ts` through the script-author workflow with a typed immutable `LensPreset`, four exact radian presets, a public `applyPreset` method, focal-length selection helpers, and change listeners. Created `Assets/Scripts/ShotSpaceLensControlsUI.ts` using native SPECS UIKit `Button`, `BackPlate`, and `FlexLayout` components. Added one authored `LensControlsUI` object beneath the existing `PreviewPanel`, added `LensController` to the existing `Systems` object, and assigned the `ShotCamera` and typed `LensController` Inspector references. Runtime-created UI includes four exactly named buttons, current-lens and educational labels, exclusive selected states, and backing/layout objects. The existing foundation, actors, shot-camera rig, render target, render masks, and main camera were preserved. The new controls host was positioned locally at `(-12, 0, 0.5)` on the Interface mask so all four buttons remain visible without moving `PreviewPanel`.

Verification: The project compiled and passed lint checks. Runtime inspection confirmed ShotCamera remains Perspective, 16:9, `ShotPreviewRT`, PrevisSet-only, and without device-property overrides. Button tests produced 24mm = 0.798 radians, 35mm = 0.563 radians, 50mm = 0.400 radians, and 85mm = 0.237 radians. Every button updated both labels, changed the monitor composition in the expected wide-to-telephoto progression, and exclusively highlighted the selected button. ShotCameraRig remained at `(-8, -5, -68)` with its original rotation, the main SPECS camera remained unchanged, the monitor did not recurse into its own feed, and the final refreshed Logger contained no errors. The project was saved with 50mm restored as the default.

Problems: The initial UIKit version attempted to call `FlexLayout.addItems` before initialization while automatic discovery was enabled, and the UI attempted to access `LensController` before the lower-hierarchy Systems component had awakened. Both produced transient Logger errors during iteration. The UI was repaired by disabling automatic item discovery before explicit registration and deferring controller connection until the next frame. The 35mm unique-ID interaction test timed out once without applying a change; a coordinate-targeted retry at the measured button position succeeded and verified the correct state.

Changes requested: No correction prompt yet.

## Prompt 3 — Shot-Framing Presets and Match Framing

Date: 2026-09-06

Prompt:

> Using the existing working ShotSpace SPECS project, add shot-framing
> presets and a Match Framing mode.
>
> Preserve all existing working systems, including:
>
> - DioramaRoot
> - ShotCameraRig
> - ShotCamera
> - ShotPreviewRT
> - PreviewPanel and PreviewScreen
> - LensController
> - The 24mm, 35mm, 50mm, and 85mm buttons
> - Existing render layers and UI
>
> Do not rebuild, rename, reset, or duplicate the working foundation.
>
> PHASE GOAL
>
> Add Wide, Medium, and Close-Up framing presets for ActorA.
>
> Also add a Match Framing toggle that determines whether changing lenses
> moves the shot camera to preserve the selected framing.
>
> FRAMING TARGET
>
> Create a child object or reference point on ActorA named exactly:
>
> ActorA_FramingTarget
>
> Position it around ActorA's upper chest or face so ShotCamera can
> consistently aim at it.
>
> Use ActorA as the subject for this prototype.
>
> FRAMING PRESETS
>
> Add these framing presets:
>
> Wide:
> - Button name: FramingButton_Wide
> - Subject occupies approximately 35% of frame height
> - Label: WIDE
>
> Medium:
> - Button name: FramingButton_Medium
> - Subject occupies approximately 60% of frame height
> - Label: MEDIUM
>
> Close-Up:
> - Button name: FramingButton_CloseUp
> - Subject occupies approximately 85% of frame height
> - Label: CLOSE-UP
>
> Use 50mm and Medium as the default state.
>
> FRAMING CALCULATION
>
> Use /lens-api and the script-author agent to extend LensController or
> create a separate FramingController if that results in cleaner code.
>
> Store each framing preset as typed data containing:
>
> - Display label
> - Desired frame-fill percentage
>
> Calculate camera distance using the active vertical FOV:
>
> distance =
> subjectHeight /
> (2 * frameFill * tan(verticalFOV / 2))
>
> Use a configurable subjectHeight value that matches the ActorA
> placeholder. Do not rely on an unstable runtime bounding-box method if
> an explicit configurable height is more reliable.
>
> When a framing button is selected:
>
> 1. Read the active ShotCamera FOV.
> 2. Calculate the required distance.
> 3. Preserve the camera's current side and general viewing direction.
> 4. Move ShotCameraRig along the camera-to-target axis.
> 5. Aim ShotCamera toward ActorA_FramingTarget.
> 6. Update the selected framing label.
> 7. Update the active visual state of the framing buttons.
>
> Apply movement to ShotCameraRig rather than creating another camera.
>
> MATCH FRAMING TOGGLE
>
> Create a native SPECS UI Kit toggle named exactly:
>
> Toggle_MatchFraming
>
> Add a status label that displays either:
>
> MATCH FRAMING: ON
>
> or:
>
> MATCH FRAMING: OFF
>
> Behavior when Match Framing is OFF:
>
> - Changing lenses modifies only ShotCamera.fov.
> - ShotCameraRig must remain stationary.
> - The composition becomes wider or tighter as the focal length changes.
>
> Behavior when Match Framing is ON:
>
> - Changing lenses modifies ShotCamera.fov.
> - Recalculate the distance required for the currently selected framing.
> - Move ShotCameraRig forward or backward so ActorA remains approximately
>   the same size in the PreviewScreen.
> - Continue aiming at ActorA_FramingTarget.
>
> Expected behavior with Medium framing:
>
> - At 24mm, ShotCameraRig should be closer to ActorA.
> - At 35mm, it should be slightly farther away.
> - At 50mm, it should be farther away again.
> - At 85mm, it should be substantially farther away.
> - ActorA should remain approximately the same size in the spatial
>   preview while the background perspective changes.
>
> Do not fake this behavior by scaling ActorA or the environment.
> The camera must physically move.
>
> STATE MANAGEMENT
>
> Track:
>
> - Current focal-length preset
> - Current framing preset
> - Match Framing enabled/disabled
> - Current calculated camera distance
>
> LensController and FramingController must share one source of truth.
> Do not create competing values or independent copies of the current
> lens selection.
>
> Add a small information readout to PreviewPanel displaying:
>
> LENS: 50mm
> FRAMING: MEDIUM
> MATCH: ON or OFF
> DISTANCE: calculated value
>
> Format the distance to one decimal place.
>
> WORLD-SPACE UI
>
> Using /specs-build-ui, extend the existing control panel with:
>
> - Wide button
> - Medium button
> - Close-Up button
> - Match Framing toggle
>
> Use native SPECS UI Kit components. Do not create custom collider-based
> buttons.
>
> Clearly indicate the selected framing preset. Only one framing button
> should appear selected at a time.
>
> FRAMING GUIDES
>
> Add a subtle rule-of-thirds overlay over PreviewScreen.
>
> Requirements:
>
> - Two vertical guide lines
> - Two horizontal guide lines
> - Low opacity
> - Interface layer only
> - Visible to the main SPECS camera
> - Not rendered by ShotCamera
> - Must not become part of ShotPreviewRT
>
> If the guide overlay introduces render-layer or visibility problems,
> remove it rather than compromising the working preview.
>
> IMPORTANT EXCLUSIONS
>
> During this phase, do not add:
>
> - Barrel distortion
> - Pincushion distortion
> - Radial distortion shaders
> - Depth of field
> - Exposure controls
> - Over-the-shoulder framing
> - Saved storyboard cards
> - Actor grabbing
> - Camera grabbing
> - Light controls
> - Additional render targets
> - Generated 3D assets
>
> VERIFICATION
>
> After implementation:
>
> 1. Save the project.
> 2. Run /verify-preview.
> 3. Test Wide, Medium, and Close-Up at 50mm.
> 4. Confirm each button changes the camera distance and composition.
> 5. Confirm the camera continues to aim at ActorA_FramingTarget.
> 6. Confirm ActorA is not being scaled.
> 7. Turn Match Framing OFF.
> 8. Change from 24mm to 85mm.
> 9. Confirm ShotCameraRig does not move and the framing becomes tighter.
> 10. Turn Match Framing ON.
> 11. Select Medium framing.
> 12. Change sequentially between 24mm, 35mm, 50mm, and 85mm.
> 13. Confirm ShotCameraRig moves farther away as focal length increases.
> 14. Confirm ActorA remains approximately the same size in PreviewScreen.
> 15. Confirm the background relationship visibly changes.
> 16. Confirm all labels and selected states update correctly.
> 17. Confirm the rule-of-thirds guides do not appear inside ShotPreviewRT.
> 18. Confirm there are no persistent red Logger errors.
>
> If available, use ShotCamera.worldSpaceToScreenSpace on points
> representing ActorA's top and bottom to estimate the percentage of
> screen height occupied by ActorA. Use this only for verification; do
> not create an expensive per-frame correction loop.
>
> If any framing mode fails, debug and repair it before adding another
> feature.
>
> At completion, report:
>
> - Scripts created or modified
> - UI objects created
> - Framing values used
> - Calculated camera distances for each lens at Medium framing
> - Verification results
> - Any remaining warnings

Result: Extended the existing `Assets/Scripts/LensController.ts` as the single source of truth for lens, framing, Match Framing, and distance state. Added typed immutable Wide (0.35), Medium (0.60), and Close-Up (0.85) presets; the exact requested distance formula; configurable 6.0 cm subject height; guarded target-axis rig motion; camera aiming using the Lens camera's local -Z convention; combined typed state listeners; framing and Match public APIs; and an on-demand `worldSpaceToScreenSpace` verification helper. Extended `Assets/Scripts/ShotSpaceLensControlsUI.ts` with native UIKit framing buttons, a native UIKit switch, selected-state synchronization, framing and Match labels, and a four-line information readout. Added `ActorA_FramingTarget` under ActorA, four low-opacity rule-of-thirds guide objects under `PreviewPanel`, and `FramingGuideMaterial`. Assigned `ShotCameraRig` and `ActorA_FramingTarget` to the existing LensController. The authored control panel was raised to local Y -16 cm so all controls, especially the Match switch, are reachable in SPECS Preview.

Verification: TypeScript compilation and IDE lint checks pass. At 50mm, Wide, Medium, and Close-Up produced 42.3 cm, 24.7 cm, and 17.4 cm respectively, with a consistent aim rotation and exclusive selected states. Medium Match Framing produced 11.9 cm at 24mm, 17.3 cm at 35mm, 24.7 cm at 50mm, and 42.0 cm at 85mm. With Match OFF, the exact 24mm-to-85mm sequence changed FOV from 0.798 to 0.237 radians while ShotCameraRig position `(-9.585625, -5.176181, -77.337570)` and rotation remained exactly unchanged. Turning Match ON immediately reapplied the current framing. The Match-ON 85mm Medium test moved the rig farther away while preserving Medium framing. ActorA and the environment were not scaled. The main SPECS camera was not modified. Runtime visual capture confirmed the preview composition, information panel, controls, selected states, background relationship changes, and the rule-of-thirds overlay. The guide objects use Interface mask 8 while ShotCamera renders only mask 2, so they remain outside `ShotPreviewRT`. The project was saved and restored to 50mm, Medium, Match ON. Final Logger inspection contained no errors.

Problems: The script-author run was interrupted, so work resumed by validating the on-disk scripts and compiling them. During verification, the UIKit `Switch.onFinished` boolean was briefly interpreted as the switch value; package source inspection confirmed it is an `explicit` event flag, so the callback was corrected to read `matchSwitch.isOn` only for explicit interactions. Parallel preview-agent queries caused avoidable preview resets and unstable runtime IDs; subsequent verification used one named Preview panel sequentially. Several direct simulated pinches timed out, so measured-position and poke retries were used. The original Match switch row at world Y -22.5 cm was not reliably reachable by the preview hand simulator; raising the control panel 2 cm resolved it.

Changes requested: The user said “Please continue” after the interrupted script-author run. No feature-scope correction was requested.

## Prompt 4 — Radial Lens Distortion

Date: 2026-09-06

Prompt:

> Using the existing working ShotSpace SPECS project, implement Prompt 4:
> radial lens distortion in the spatial shot preview.
>
> Preserve all existing working systems and behavior, including:
>
> - ShotCamera and ShotCameraRig
> - ShotPreviewRT
> - PreviewPanel and PreviewScreen
> - LensController.ts
> - ShotSpaceLensControlsUI.ts
> - 24mm, 35mm, 50mm, and 85mm lens controls
> - Wide, Medium, and Close-Up framing presets
> - Match Framing
> - ActorA_FramingTarget
> - Rule-of-thirds guides
> - Existing render layers
> - Existing verified camera-distance calculations
>
> The final default state must remain:
>
> - 50mm
> - Medium
> - Match Framing ON
>
> Do not rebuild, rename, reset, or duplicate these systems.
>
> PHASE GOAL
>
> Create a controllable radial-distortion material that modifies only the
> image displayed inside PreviewScreen.
>
> The distortion must not affect:
>
> - The user's main SPECS view
> - PreviewPanel's physical frame
> - UI buttons
> - Labels
> - Rule-of-thirds guides
> - The diorama as seen outside the monitor
> - ShotCamera's position, rotation, FOV, or render target
>
> PRESERVE A FALLBACK
>
> Before modifying the preview material:
>
> 1. Preserve the existing working undistorted preview material.
> 2. Duplicate or create a new material named:
>
> ShotPreviewDistortionMaterial
>
> 3. Assign the new material only to the mesh or image surface displaying
>    ShotPreviewRT.
> 4. Keep the original material available as a fallback.
> 5. Do not create another camera or render target.
>
> MATERIAL INPUT
>
> ShotPreviewDistortionMaterial must sample the existing:
>
> ShotPreviewRT
>
> Create exposed material parameters named:
>
> - k1
> - k2
> - distortionBlend
>
> Use distortionBlend to interpolate between the original UV coordinates
> and distorted UV coordinates:
>
> - 0.0 = distortion disabled
> - 1.0 = full selected-lens distortion
>
> Do not implement the toggle by replacing the render target or changing
> ShotCamera.
>
> RADIAL DISTORTION SHADER
>
> Using /shader-graph, create a static radial UV-distortion effect.
>
> Do not use animated noise, procedural wobble, liquid distortion, or a
> generic noise-distortion subgraph.
>
> Use this calculation:
>
> 1. Read the PreviewScreen UV coordinates.
>
> 2. Convert them from 0–1 space into centered -1–1 space:
>
> centeredUV = UV * 2.0 - 1.0
>
> 3. Correct the horizontal coordinate for the 16:9 aspect ratio:
>
> centeredUV.x = centeredUV.x * 1.7777778
>
> 4. Calculate radial distance:
>
> r2 = dot(centeredUV, centeredUV)
> r4 = r2 * r2
>
> 5. Calculate radial scale:
>
> radialScale = 1.0 + (k1 * r2) + (k2 * r4)
>
> 6. Calculate distorted coordinates:
>
> distortedCenteredUV = centeredUV * radialScale
>
> 7. Remove the aspect-ratio correction:
>
> distortedCenteredUV.x =
> distortedCenteredUV.x / 1.7777778
>
> 8. Convert the result back to 0–1 UV space:
>
> distortedUV = distortedCenteredUV * 0.5 + 0.5
>
> 9. Blend between the original and distorted coordinates:
>
> finalUV = lerp(UV, distortedUV, distortionBlend)
>
> 10. Sample ShotPreviewRT using finalUV.
>
> 11. Pixels outside the valid 0–1 UV range should render as black or be
>     cleanly masked. They must not repeat, wrap, or smear.
>
> 12. Preserve the original image orientation. The resulting preview must
>     not be vertically or horizontally flipped.
>
> LENS DISTORTION PROFILES
>
> Extend the existing typed LensPreset data in LensController.ts with:
>
> - distortionK1
> - distortionK2
> - distortionDescription
>
> Start with these approximate creative-simulation values:
>
> 24mm:
> - k1: -0.080
> - k2: 0.015
> - Description: BARREL
>
> 35mm:
> - k1: -0.035
> - k2: 0.005
> - Description: MILD BARREL
>
> 50mm:
> - k1: 0.000
> - k2: 0.000
> - Description: NEUTRAL
>
> 85mm:
> - k1: 0.012
> - k2: 0.000
> - Description: SUBTLE PINCUSHION
>
> These are illustrative optical profiles, not measured profiles from
> specific commercial lenses.
>
> IMPORTANT SIGN VERIFICATION
>
> Because the visible direction of radial distortion depends on whether
> the shader implements forward or inverse UV mapping, verify the result
> visually.
>
> The intended result is:
>
> - 24mm: straight lines near the edges visibly bow outward in a
>   controlled barrel-distortion appearance.
> - 35mm: the same effect is present but milder.
> - 50mm: straight lines remain straight.
> - 85mm: straight lines bend very subtly in the opposite,
>   pincushion direction.
>
> If the implemented shader produces the opposite behavior, reverse the
> signs of k1 and k2 rather than changing the desired visual definitions.
>
> Do not exaggerate the effect so strongly that actors or the set become
> unusable for shot planning.
>
> CONTROLLER INTEGRATION
>
> Extend LensController.ts without creating a competing source of truth.
>
> When a lens is selected:
>
> 1. Continue applying the existing FOV value.
> 2. Continue applying the existing Match Framing behavior.
> 3. Read that lens preset's k1 and k2 values.
> 4. Send k1 and k2 to the unique runtime material used by PreviewScreen.
> 5. Update the distortion-description label.
> 6. Do not change distortionBlend when switching lenses.
>
> The current lens, current framing preset, Match Framing state, and lens
> distortion state must remain part of one coordinated application state.
>
> Create or use a unique runtime material instance so changing its
> parameters does not unintentionally affect other scene objects.
>
> DISTORTION TOGGLE
>
> Using /specs-build-ui, extend the existing world-space control panel
> with a native SPECS UI Kit toggle named exactly:
>
> Toggle_LensDistortion
>
> This is separate from:
>
> Toggle_MatchFraming
>
> Add a status label displaying:
>
> DISTORTION: ON
>
> or:
>
> DISTORTION: OFF
>
> Behavior when distortion is ON:
>
> - distortionBlend = 1.0
> - The active lens's k1 and k2 profile is visible.
>
> Behavior when distortion is OFF:
>
> - distortionBlend = 0.0
> - The preview uses its original UV coordinates.
> - The selected lens FOV remains active.
> - ShotCameraRig must not move.
> - Match Framing must not change.
> - The current lens and framing selections must not reset.
>
> Use Distortion ON as the default state.
>
> DISTORTION READOUT
>
> Extend the existing PreviewPanel information readout to include:
>
> OPTICAL PROFILE: BARREL
>
> Use the corresponding description for each lens:
>
> - BARREL
> - MILD BARREL
> - NEUTRAL
> - SUBTLE PINCUSHION
>
> When distortion is disabled, display:
>
> OPTICAL PROFILE: OFF
>
> VISUAL CALIBRATION
>
> Use the existing floor grid and vertical wall edges to evaluate the
> distortion.
>
> If necessary, add lightweight calibration objects to PrevisSet:
>
> - Two thin vertical columns near the left and right frame edges
> - A rectangular doorframe or window frame
> - A checker or grid reference
>
> These objects must use simple primitives and must be part of the set.
> Do not create detailed generated assets.
>
> IMPORTANT EXCLUSIONS
>
> During Prompt 4, do not add:
>
> - Chromatic aberration
> - Vignette
> - Blur
> - Depth of field
> - Exposure controls
> - Anamorphic distortion
> - Lens breathing
> - Focus controls
> - Saved storyboard cards
> - Actor grabbing
> - Camera grabbing
> - Lighting controls
> - Additional cameras
> - Additional render targets
> - Generated 3D assets
>
> VERIFICATION
>
> After implementation:
>
> 1. Save the project.
> 2. Run /verify-preview.
> 3. Confirm the original undistorted material still exists as a fallback.
> 4. Confirm PreviewScreen uses ShotPreviewDistortionMaterial.
> 5. Confirm the material samples the existing ShotPreviewRT.
> 6. Confirm no additional camera or render target was created.
> 7. Confirm the preview is not flipped.
> 8. Confirm invalid UV areas do not repeat or smear.
> 9. Select 24mm with distortion ON.
> 10. Confirm visible controlled barrel distortion at frame edges.
> 11. Select 35mm and confirm a milder version.
> 12. Select 50mm and confirm a neutral image.
> 13. Select 85mm and confirm subtle opposite-direction distortion.
> 14. Toggle distortion OFF at each focal length.
> 15. Confirm FOV changes remain visible while radial distortion disappears.
> 16. Confirm toggling distortion does not move ShotCameraRig.
> 17. Confirm toggling distortion does not change framing or Match Framing.
> 18. Confirm Match Framing still works from 24mm through 85mm.
> 19. Confirm the rule-of-thirds guides and UI remain undistorted.
> 20. Confirm no distortion is applied to the main SPECS view.
> 21. Confirm there are no persistent red Logger errors.
>
> If the shader graph fails or breaks the spatial preview:
>
> - Restore the original preview material.
> - Keep the completed focal-length and framing systems intact.
> - Report the exact shader or material error.
> - Do not replace the working preview system with an unverified approach.
>
> At completion, report:
>
> - Materials created or modified
> - Shader parameters exposed
> - Scripts modified
> - UI objects created
> - Final k1 and k2 values
> - Whether any parameter signs had to be reversed
> - Visual result for each focal length
> - Distortion-toggle verification
> - Regression results for lens selection and Match Framing
> - Any remaining warnings or limitations
>
> Update CLAD_PROMPT_LOG.md with the full prompt, implementation result,
> corrections, and verification history.

Result: Preserved `Assets/ShotSpace/Materials/ShotPreviewMaterial.mat` as the undistorted fallback. Created `ShotPreviewDistortionMaterial.mat` plus the custom `ShotPreviewRadialDistortion.graphShader`, assigned the new material only to `PreviewScreen`, and kept it bound to the existing `ShotPreviewRT`. The graph exposes `baseTex`, `k1`, `k2`, and `distortionBlend`; implements the specified centered-UV, 16:9-corrected r2/r4 radial calculation; blends original and distorted UVs; clamps sampling coordinates; and multiplies by an explicit 0–1 validity mask so invalid regions render black without wrap or smear. It uses static GLSL only and preserves mesh UV orientation.

`Assets/Scripts/LensController.ts` remains the single source of truth and now stores the lens profile coefficients/descriptions, distortion-enabled state, and the existing lens/framing/Match/distance state together. At startup it clones `PreviewScreen`'s assigned distortion material once, rebinds the existing `ShotPreviewRT`, and writes k1/k2/blend only to that unique runtime instance. Lens changes preserve the previous distortion blend. Distortion-toggle changes write only `distortionBlend` and emit coordinated state; they do not alter the camera, rig, framing, or Match Framing. `Assets/Scripts/ShotSpaceLensControlsUI.ts` now creates the native `Toggle_LensDistortion`, `LensDistortionStatusLabel`, `LensDistortionRowLabel`, and a five-line information readout containing the optical profile. Distortion defaults ON. The expanded controls use larger row spacing, and the distortion switch was placed on the opposite side from the Match switch to separate their poke targets.

Final lens values: 24mm `k1=-0.080`, `k2=0.015`, BARREL; 35mm `k1=-0.035`, `k2=0.005`, MILD BARREL; 50mm `k1=0.000`, `k2=0.000`, NEUTRAL; 85mm `k1=0.012`, `k2=0.000`, SUBTLE PINCUSHION. Visual verification showed controlled outward edge bowing at 24mm, a milder version at 35mm, a straight neutral image at 50mm, and a subtle opposite-direction response at 85mm. The requested signs produced the intended forward-mapping appearance, so no coefficient signs were reversed. Existing floor-grid lines and vertical set edges were sufficient; no calibration geometry was added.

Verification: TypeScript compilation, IDE lint checks, project save, runtime startup, material binding, and visual preview checks pass. `PreviewScreen` reports a unique runtime `Clone of ShotPreviewDistortionMaterial`; its authored material points to `ShotPreviewDistortionMaterial`, and that material's `baseTex` points to the existing `ShotPreviewRT`. The original `ShotPreviewMaterial` remains in the project. No camera or render-target asset was created. The image is not flipped. The validity mask prevents repeat/smear, and no invalid-UV artifact was visible at the tested coefficients. Distortion OFF was exercised at 24mm, 35mm, 50mm, and 85mm; each state retained the active FOV, Medium framing, and Match ON while the readout changed to `OPTICAL PROFILE: OFF`. At 24mm, toggling distortion changed ON/OFF while ShotCameraRig remained exactly at `(-10.514946, -5.279438, -82.810234)` with unchanged rotation and FOV `0.798`. Equivalent no-motion checks passed when enabling 35mm and 85mm profiles. Match Framing regression produced the previously verified Medium distances: 11.9 cm at 24mm, 17.3 cm at 35mm, 24.7 cm at 50mm, and 42.0 cm at 85mm. The rule-of-thirds guides remain separate straight Interface-layer meshes in front of the monitor; the main SPECS view, panel frame, UI, labels, and surrounding diorama remain undistorted. Final runtime and authored state were restored to 50mm, Medium, Match Framing ON, Distortion ON. Logger inspection contained no errors.

Problems and corrections: The first Code Node preset material was only a temporary creation path; it was replaced with an empty material and the custom imported shader-graph pass. The initial pass-attachment check found that the Empty Material preset still contains one pass, so the implementation correctly replaced that pass with `PassInfo.setPassConfiguration` rather than adding a second pass. An initial `defines = {}` assignment failed with `InternalError: Value is not an array`; removing the unnecessary defines override allowed the graph to attach and exposed exactly `PreviewEnabled`, `baseTex`, `distortionBlend`, `k1`, and `k2`. Early simulated hover/poke attempts timed out or touched neighboring tightly stacked controls. The control panel was expanded, row spacing was increased, the distortion switch was moved opposite the Match switch, and verification used measured-position held pinches followed by in-place release; this prevented release drift into adjacent rows and produced clean state transitions. No working camera, framing, or fallback material system was replaced during these corrections.

Changes requested: No correction to Prompt 4 scope was requested.

## Prompt 5 — Spatial Manipulation of Actors, Camera, and Key Light

Date: 2026-09-06

Prompt:

> Using the existing working ShotSpace SPECS project, implement Prompt 5:
> spatial manipulation of actors, the shot camera, and one key light.
>
> Preserve all existing working systems and behavior, including:
>
> - DioramaRoot and the set
> - ActorA and ActorA_FramingTarget
> - ActorB
> - ShotCameraRig and ShotCamera
> - CameraProxyMesh
> - KeyLightRig and KeyLight
> - ShotPreviewRT
> - PreviewPanel and PreviewScreen
> - LensController.ts
> - ShotSpaceLensControlsUI.ts
> - 24mm, 35mm, 50mm, and 85mm lens controls
> - Wide, Medium, and Close-Up framing presets
> - Match Framing
> - Radial lens-distortion profiles and toggle
> - Rule-of-thirds guides
> - Existing render layers
> - Existing verified camera-distance calculations
>
> Do not rebuild, rename, reset, or duplicate these systems.
>
> PHASE GOAL
>
> Allow the user to spatially:
>
> 1. Grab and reposition ActorA.
> 2. Grab and reposition ActorB.
> 3. Grab and reposition ShotCameraRig through CameraProxyMesh.
> 4. Grab, reposition, and aim KeyLightRig.
> 5. See all changes update live inside PreviewScreen.
>
> Use Spectacles Interaction Kit and /specs-interaction-recipes for all
> spatial interaction.
>
> Do not implement custom hand tracking or custom ray-interaction logic
> when an appropriate SIK component or recipe is available.
>
> INTERACTION ARCHITECTURE
>
> Create a TypeScript component named:
>
> SpatialManipulationController.ts
>
> Use it to coordinate:
>
> - Interaction start
> - Interaction update
> - Interaction end
> - Position constraints
> - Rotation constraints
> - Selection feedback
> - Camera-mode changes
> - Layout reset
>
> Create a separate component named:
>
> LightingController.ts
>
> Use it to coordinate:
>
> - Key-light intensity
> - Key-light color
> - Light UI state
> - Light reset behavior
>
> Do not create competing copies of the current lens, framing, Match
> Framing, or distortion state.
>
> ACTOR INTERACTION
>
> Make ActorA and ActorB independently grabbable.
>
> Create or configure stable SIK interactables named:
>
> - ActorA_Interactable
> - ActorB_Interactable
>
> Support:
>
> - Direct hand grabbing
> - Far-ray grabbing if supported reliably by the installed SIK version
> - Translation across the diorama floor
> - Rotation around the vertical axis
>
> Actor constraints:
>
> 1. Actors must remain upright.
> 2. Actors must not pitch or roll.
> 3. Actors must not scale during manipulation.
> 4. Actors must remain on the diorama floor.
> 5. Actors must remain within the playable set boundaries.
> 6. Actors must not pass behind the walls or disappear beneath the floor.
> 7. On release, clamp each actor to a valid position.
> 8. Preserve ActorA_FramingTarget as a child or functional reference of
>    ActorA so it moves with ActorA.
>
> Do not enable gravity, bouncing, or free physics simulation.
>
> Add visual interaction feedback:
>
> - Subtle highlight when hovered
> - Brighter outline, glow, or base indicator while grabbed
> - Return to normal appearance when released
>
> The interaction feedback must be visible in the main spatial view but
> must not contaminate ShotPreviewRT unless the feedback is intentionally
> part of the filmmaking visualization.
>
> CAMERA INTERACTION
>
> Make CameraProxyMesh the visible and grabbable representation of
> ShotCameraRig.
>
> Create or configure an SIK interactable named:
>
> CameraRig_Interactable
>
> Requirements:
>
> 1. Grabbing CameraProxyMesh must move ShotCameraRig.
> 2. ShotCamera must remain correctly parented to ShotCameraRig.
> 3. CameraProxyMesh must move with the rig.
> 4. PreviewScreen must update live while the camera moves.
> 5. The camera proxy must not appear inside ShotPreviewRT.
> 6. The camera must remain within safe diorama bounds.
> 7. Prevent the camera from moving inside ActorA, ActorB, walls, or the
>    floor.
> 8. Maintain a reasonable minimum distance from ActorA.
> 9. Allow useful horizontal positioning, vertical positioning, yaw, and
>    pitch.
> 10. Prevent roll or clamp it back to zero when released.
> 11. Do not allow camera scaling.
>
> Add a lightweight forward-direction or frustum visualizer as a child of
> ShotCameraRig if it can be implemented reliably.
>
> The visualizer must:
>
> - Belong to MainExperience
> - Be visible to the main SPECS camera
> - Not be visible to ShotCamera
> - Move and rotate with ShotCameraRig
> - Remain lightweight
>
> CAMERA AND MATCH-FRAMING CONFLICT RULE
>
> Manual camera manipulation must not fight the automatic framing system.
>
> When the user begins grabbing CameraProxyMesh:
>
> 1. Suspend automatic Match Framing calculations.
> 2. Do not snap the camera back during the grab.
>
> When the user releases CameraProxyMesh:
>
> 1. Set Match Framing to OFF.
> 2. Update Toggle_MatchFraming to show OFF.
> 3. Change the current framing label to CUSTOM.
> 4. Preserve the currently selected focal length.
> 5. Preserve the currently selected distortion profile.
> 6. Record the new camera position, rotation, and distance as the custom
>    camera state.
>
> Do not automatically aim the camera back at ActorA after a manual camera
> move.
>
> The user can return to automatic framing by selecting Wide, Medium, or
> Close-Up or by turning Match Framing back on.
>
> When the user selects a framing preset after manual manipulation:
>
> - Resume the existing automatic framing calculation.
> - Aim at ActorA_FramingTarget.
> - Move ShotCameraRig to the calculated distance.
> - Restore the corresponding framing label.
>
> ACTOR MOVEMENT AND FRAMING
>
> Do not continuously move ShotCameraRig while ActorA is being dragged.
>
> ActorA should move freely while the user observes the changing
> composition in PreviewScreen.
>
> After ActorA moves, provide a native SPECS UI Kit button named:
>
> Button_ReframeActorA
>
> Label it:
>
> REFRAME ACTOR A
>
> When triggered:
>
> 1. Use the current lens.
> 2. Use the most recently selected non-custom framing preset.
> 3. Recalculate the correct camera distance.
> 4. Aim ShotCamera at ActorA_FramingTarget.
> 5. Move ShotCameraRig into the corresponding framing.
> 6. Preserve the distortion state.
>
> If no previous framing preset is available, use Medium.
>
> KEY-LIGHT SETUP
>
> Use the existing KeyLightRig if it is valid.
>
> Configure one lightweight built-in light suitable for the SPECS target.
> Prefer a Spot Light if supported and visually reliable. If the current
> SPECS configuration does not support the required Spot Light behavior,
> use the most appropriate supported built-in light and report the
> substitution.
>
> Structure:
>
> KeyLightRig
> - KeyLight
> - KeyLightProxy
> - LightConeVisualizer
>
> KeyLight must:
>
> - Affect the PrevisSet objects
> - Visibly affect ActorA, ActorB, floor, walls, and set objects
> - Update live in ShotPreviewRT
> - Remain performant
> - Avoid expensive shadows if they cause performance or compatibility
>   problems
>
> KeyLightProxy and LightConeVisualizer must:
>
> - Belong to MainExperience
> - Be visible to the main SPECS camera
> - Not appear inside ShotPreviewRT
> - Clearly communicate the light's position and direction
> - Move and rotate with KeyLightRig
>
> LIGHT INTERACTION
>
> Create or configure an SIK interactable named:
>
> KeyLightRig_Interactable
>
> Requirements:
>
> 1. Grabbing KeyLightProxy moves KeyLightRig.
> 2. Allow horizontal and vertical translation.
> 3. Allow yaw and pitch so the user can aim the light.
> 4. Prevent roll or reset it on release.
> 5. Do not allow scaling.
> 6. Keep the light inside reasonable working bounds around the diorama.
> 7. Prevent the light from dropping beneath the floor.
> 8. Update the lighting in PreviewScreen during manipulation.
>
> Add the same hover, selection, and grab feedback used for the actors and
> camera.
>
> LIGHTING CONTROLS
>
> Using /specs-build-ui, extend the existing world-space control panel
> with a compact LIGHT section.
>
> Create native SPECS UI Kit buttons named:
>
> - LightButton_Low
> - LightButton_Medium
> - LightButton_High
> - LightButton_Warm
> - LightButton_Neutral
> - LightButton_Cool
>
> Intensity behavior:
>
> - LOW: visibly soft/dim but still readable
> - MEDIUM: balanced default
> - HIGH: clearly brighter without clipping the entire preview
>
> Use values appropriate to Lens Studio's light-intensity scale. Calibrate
> them visually rather than assuming the scale matches another engine.
>
> Color behavior:
>
> - WARM: approximately 3200K appearance
> - NEUTRAL: approximately 4300K appearance
> - COOL: approximately 5600K appearance
>
> Use RGB color approximations supported by Lens Studio. Do not implement
> a computationally expensive physical color-temperature conversion.
>
> Default lighting:
>
> - Intensity: MEDIUM
> - Color: NEUTRAL
>
> Only one intensity button and one color button should appear selected at
> a time.
>
> Add a light readout displaying:
>
> KEY LIGHT: MEDIUM / NEUTRAL
>
> Update it whenever an intensity or color button is selected.
>
> RESET LAYOUT
>
> Add a native SPECS UI Kit button named:
>
> Button_ResetLayout
>
> Label:
>
> RESET LAYOUT
>
> At initialization, store the verified default transforms for:
>
> - ActorA
> - ActorB
> - ShotCameraRig
> - KeyLightRig
>
> When Reset Layout is selected:
>
> 1. Restore the default actor transforms.
> 2. Restore the default camera transform.
> 3. Restore the default light transform.
> 4. Restore 50mm.
> 5. Restore Medium framing.
> 6. Restore Match Framing ON.
> 7. Restore lens distortion ON.
> 8. Restore key-light intensity to MEDIUM.
> 9. Restore key-light color to NEUTRAL.
> 10. Update all UI labels and selected states.
> 11. Do not rebuild or reload the scene.
>
> USER INSTRUCTIONS
>
> Add a small instruction panel that reads:
>
> GRAB ACTORS TO BLOCK THE SCENE
> GRAB CAMERA TO CREATE A CUSTOM SHOT
> GRAB LIGHT TO SHAPE THE IMAGE
>
> Keep it concise and readable. It must belong to Interface and must not
> appear in ShotPreviewRT.
>
> SELECTION STATE
>
> Only one manipulated object should be visually selected at a time.
>
> Track the current selection as:
>
> - NONE
> - ACTOR A
> - ACTOR B
> - CAMERA
> - KEY LIGHT
>
> Add a subtle readout:
>
> SELECTED: ACTOR A
>
> Update it when a user starts interacting with an object. Return to
> SELECTED: NONE after release, unless retaining the last selection
> creates a clearer user experience. Use one consistent behavior.
>
> IMPORTANT EXCLUSIONS
>
> During Prompt 5, do not add:
>
> - Additional lights
> - Full lighting plots
> - Shadows if they destabilize performance
> - Physical exposure controls
> - Aperture
> - Focus or depth of field
> - Lens breathing
> - Anamorphic controls
> - Additional actors
> - Prop libraries
> - Saved storyboard cards
> - Image capture
> - Shot export
> - Multiplayer
> - Voice commands
> - Generated 3D assets
> - New cameras
> - New render targets
>
> VERIFICATION
>
> After implementation:
>
> 1. Save the project.
> 2. Run /verify-preview.
> 3. Use /specs-preview-interaction to simulate supported grabs and button
>    triggers.
> 4. Confirm ActorA can be grabbed, moved, rotated, and released.
> 5. Confirm ActorA remains upright, on the floor, and within bounds.
> 6. Confirm ActorA_FramingTarget follows ActorA.
> 7. Confirm ActorB behaves the same way.
> 8. Confirm neither actor scales.
> 9. Confirm moving either actor updates PreviewScreen live.
> 10. Confirm CameraProxyMesh moves ShotCameraRig.
> 11. Confirm moving the camera updates PreviewScreen live.
> 12. Confirm the camera proxy and frustum do not appear in ShotPreviewRT.
> 13. Confirm manually moving the camera sets Match Framing OFF.
> 14. Confirm manual camera movement changes framing to CUSTOM.
> 15. Confirm the current lens and distortion state remain unchanged.
> 16. Confirm selecting a framing preset restores automatic framing.
> 17. Confirm Reframe Actor A works after ActorA is moved.
> 18. Confirm KeyLightRig can be translated and aimed.
> 19. Confirm moving KeyLightRig changes lighting in PreviewScreen.
> 20. Confirm the light proxy and cone do not appear in ShotPreviewRT.
> 21. Confirm LOW, MEDIUM, and HIGH produce visibly different results.
> 22. Confirm WARM, NEUTRAL, and COOL produce visibly different results.
> 23. Confirm the lighting readout and selected button states update.
> 24. Confirm Reset Layout restores every required default.
> 25. Confirm the 24mm, 35mm, 50mm, and 85mm controls still work.
> 26. Confirm Match Framing still produces the verified distance sequence:
>     11.9 cm, 17.3 cm, 24.7 cm, and 42.0 cm for Medium.
> 27. Confirm lens distortion still works and affects only PreviewScreen.
> 28. Confirm the rule-of-thirds guides remain undistorted.
> 29. Confirm no object manipulation creates a render feedback loop.
> 30. Confirm there are no persistent red Logger errors.
>
> If any interaction is unreliable:
>
> - Prioritize stable direct grabbing.
> - Remove far-ray grabbing if it is the source of instability.
> - Preserve the working lens, framing, distortion, and preview systems.
> - Do not replace SIK with custom hand-tracking logic.
> - Report the limitation clearly.
>
> At completion, report:
>
> - Scripts created or modified
> - SIK components and interaction recipes used
> - Interactable object names
> - Position and rotation constraints
> - Camera conflict behavior
> - Light type used
> - Final intensity and color values
> - UI objects created
> - Verification results
> - Any remaining warnings or device limitations
>
> Update CLAD_PROMPT_LOG.md with the complete Prompt 5 text,
> implementation result, correction prompts, and verification history.

Result: Added `Assets/Scripts/SpatialManipulationController.ts` and `Assets/Scripts/LightingController.ts` on the existing Systems object. Extended `LensController.ts` with custom-framing state, Match Framing suspend/resume for manual camera grabs, `reframeActorA()`, and `restoreDefaultShotState()`. Extended `ShotSpaceLensControlsUI.ts` with an Interface instruction panel, a compact LIGHT panel, Reframe/Reset buttons, selection readout, and lighting/selection sync. No existing lens, framing, Match, distortion, camera, or render-target system was rebuilt.

SIK recipe: `Interactable` + `InteractableManipulation` (DragInteraction pattern). Targeting is Direct | Indirect with High priority. Scale is disabled. Actors lock Y translation and use `RotationAxis.Y`. Camera and key light allow XYZ translation plus yaw/pitch; roll is zeroed on release. Named interactables: `ActorA_Interactable`, `ActorB_Interactable`, `CameraRig_Interactable`, `KeyLightRig_Interactable`. MainExperience visuals: `KeyLightProxy`, `CameraFrustumVisualizer`, and per-object selection indicators. ActorA_FramingTarget remains a child of ActorA.

Actor constraints: floor Y = 3 cm local, X/Z clamped to the playable set, no pitch/roll, scale restored. Camera bounds: world X -28..8, Y -8.5..10, Z -100..-62, minimum 8 cm from ActorA. Light bounds: X -32..10, Y -8.5..18, Z -112..-62. No physics bodies, gravity, or bounce.

Camera conflict: grab start suspends automatic framing; release sets Match OFF, framing CUSTOM, and preserves lens + distortion. Reframe Actor A reapplies the last non-custom preset (Medium during verification) without changing lens or distortion. Reset Layout restores stored transforms first, then 50mm / Medium / Match ON / Distortion ON / MEDIUM / NEUTRAL.

Key light: existing Spot Light, shadows off. Intensities LOW 1.4, MEDIUM 3.2, HIGH 6.4. Colors WARM `(1.00, 0.72, 0.42)`, NEUTRAL `(1.00, 0.87, 0.70)`, COOL `(0.92, 0.95, 1.00)`.

Verification: Compile and lint pass. Startup logs have no errors. Default state is 50mm / Medium / Match ON / Distortion ON / KEY LIGHT MEDIUM / NEUTRAL / SELECTED NONE / 24.7 cm. Medium Match Framing distances: 24mm 11.9 cm, 35mm 17.3 cm, 50mm 24.7 cm, 85mm 42.0 cm. Optical profiles still update (BARREL / MILD BARREL / NEUTRAL / SUBTLE PINCUSHION). ActorA grab moved local X from -4.5 to -1.02, kept Y=3, scale 2.2/6/2.2, upright rotation; FramingTarget followed; ShotCameraRig did not move. Camera proxy grab moved the rig, set FRAMING CUSTOM and MATCH OFF, and kept 85mm + SUBTLE PINCUSHION. REFRAME ACTOR A restored MEDIUM at 42.0 cm on 85mm. RESET LAYOUT restored 50mm / Medium / Match ON / NEUTRAL profile / 24.7 cm and KEY LIGHT MEDIUM / NEUTRAL, and returned ActorA to `(-4.5, 3, 0.5)`. HIGH intensity updated the light readout. No new camera or ShotPreviewRT was added. Rule-of-thirds guides remain Interface-layer and undistorted.

Problems and corrections: Runtime `Physics.ColliderComponent` creation did not produce a hittable collider, so authored `ColliderComponent`s were added to the four interactables. Parent non-uniform scale initially prevented SIK hits; interactables now invert parent scale so world scale is 1 and use world-sized boxes. Preview puppet grabs were often obstructed by UI, `InteractionPlaneColliderRoot`, or the camera collider; verification used a side viewpoint for ActorA and uniqueId drag once the camera proxy was in reach. ActorB and KeyLightRig use the same SIK handle path, but simulated grabs were blocked or timed out in Preview. Reset originally reframed from the leftover custom camera axis; it now restores the stored default camera transform before reapplying Medium framing.

Changes requested: No correction to Prompt 5 scope was requested.

## Prompt 6 — Save Shot and Three-Card Storyboard Rail

Date: 2026-09-06

Prompt:

> Using the existing working ShotSpace SPECS project, implement Prompt 6:
> Save Shot and a three-card spatial storyboard rail.
>
> Preserve all existing working systems and behavior, including:
>
> - DioramaRoot and PrevisSet
> - ActorA, ActorA_FramingTarget, and ActorA_Interactable
> - ActorB and ActorB_Interactable
> - ShotCameraRig, ShotCamera, and CameraRig_Interactable
> - KeyLightRig, KeyLight, and KeyLightRig_Interactable
> - ShotPreviewRT
> - PreviewPanel and PreviewScreen
> - LensController.ts
> - SpatialManipulationController.ts
> - LightingController.ts
> - ShotSpaceLensControlsUI.ts
> - Lens and framing controls
> - Match Framing and CUSTOM framing
> - Lens-distortion profiles and toggle
> - Rule-of-thirds guides
> - Reframe Actor A
> - Reset Layout
> - Existing render layers and verified calculations
>
> Do not rebuild, rename, reset, or duplicate these systems.
>
> PHASE GOAL
>
> Allow the user to:
>
> 1. Arrange actors, camera, lens, framing, distortion, and key light.
> 2. Press SAVE SHOT.
> 3. Save the complete arrangement into one of three storyboard cards.
> 4. See a schematic representation and technical metadata on each card.
> 5. Select a saved card to restore its complete shot setup.
> 6. Replace a selected shot after all three slots are occupied.
> 7. Clear the storyboard without resetting the current scene.
>
> The storyboard is session-based for this prototype. Do not add cloud
> storage, file export, or persistence between Lens sessions.
>
> STORYBOARD CONTROLLER
>
> Using /lens-api and the script-author agent, create:
>
> Assets/Scripts/StoryboardController.ts
>
> Create a typed ShotState structure containing deep copies of:
>
> - Shot number
> - Occupied/empty state
> - Lens label
> - Focal length
> - Camera FOV in radians
> - Framing label
> - Last non-custom framing preset
> - Match Framing enabled/disabled
> - Lens distortion enabled/disabled
> - Distortion k1
> - Distortion k2
> - Distortion description
> - ActorA position
> - ActorA rotation
> - ActorB position
> - ActorB rotation
> - ShotCameraRig position
> - ShotCameraRig rotation
> - KeyLightRig position
> - KeyLightRig rotation
> - Key-light intensity preset
> - Actual key-light intensity value
> - Key-light color preset
> - Actual key-light color value
> - Projected ActorA thumbnail position
> - Projected ActorB thumbnail position
> - Approximate ActorA thumbnail scale
> - Approximate ActorB thumbnail scale
> - Light-direction indicator angle
>
> When saving transforms, vectors, rotations, and colors, copy their
> values. Do not store mutable references that will continue changing
> after the shot is saved.
>
> Provide public methods for:
>
> - saveShot()
> - selectAndRecallShot(slotIndex)
> - replaceSelectedShot()
> - clearStoryboard()
> - updateStoryboardUI()
> - captureCurrentShotState()
> - restoreShotState(shotState)
>
> THREE-CARD STORYBOARD RAIL
>
> Using /specs-build-ui, create a world-space storyboard rail named:
>
> StoryboardRail
>
> Place it beneath or beside PreviewPanel where it is readable but does
> not obstruct the diorama or manipulation targets.
>
> Create exactly three fixed card slots named:
>
> - StoryboardCard_1
> - StoryboardCard_2
> - StoryboardCard_3
>
> Each card must have:
>
> - A 16:9 schematic thumbnail area
> - Shot-number label
> - Lens label
> - Framing label
> - Match state
> - Distortion state/profile
> - Key-light color/intensity label
> - Selected-state border
> - Empty-state appearance
>
> Empty cards should display:
>
> SHOT 1
> EMPTY
>
> SHOT 2
> EMPTY
>
> SHOT 3
> EMPTY
>
> Use native SPECS UI Kit buttons or supported UIKit interaction
> components for selecting cards.
>
> Do not use custom collider-based buttons if native UIKit interaction is
> available.
>
> SAVE SHOT CONTROLS
>
> Create native SPECS UI Kit buttons named:
>
> - Button_SaveShot
> - Button_ClearStoryboard
>
> Default labels:
>
> - SAVE SHOT
> - CLEAR BOARD
>
> Add a status label named:
>
> StoryboardStatusLabel
>
> Default status:
>
> READY TO SAVE
>
> SAVE BEHAVIOR
>
> When Button_SaveShot is triggered:
>
> 1. Find the first empty card, beginning with Card 1.
> 2. Capture the complete current ShotState.
> 3. Save it into that card.
> 4. Update the card's schematic and metadata.
> 5. Briefly highlight the saved card.
> 6. Select the newly saved card.
> 7. Display:
>
> SHOT 1 SAVED
>
> or the corresponding shot number.
>
> 8. Do not alter the current scene after saving.
> 9. Do not reset the camera, actors, lighting, lens, or framing.
>
> Continue filling the first available slot until all three are occupied.
>
> When all three slots are occupied:
>
> - If a card is selected, change the Save button label to:
>
> UPDATE SELECTED
>
> - Pressing it replaces the selected card with the current scene state.
> - Preserve that card's shot number.
> - Display:
>
> SHOT 2 UPDATED
>
> or the corresponding number.
>
> If all three slots are occupied and no card is selected:
>
> - Do not replace a shot automatically.
> - Display:
>
> SELECT A SHOT TO REPLACE
>
> CLEAR BOARD BEHAVIOR
>
> When Button_ClearStoryboard is triggered:
>
> 1. Clear all three stored ShotState objects.
> 2. Restore every card to its EMPTY appearance.
> 3. Clear the selected-card state.
> 4. Restore the Save button label to SAVE SHOT.
> 5. Display READY TO SAVE.
> 6. Do not change the current diorama, actors, camera, lens, framing,
>    distortion, or lighting.
>
> SHOT METADATA
>
> An occupied card should display compact information similar to:
>
> SHOT 1
> 24mm / WIDE
> MATCH ON
> BARREL
> WARM / HIGH
>
> For custom camera positions, display:
>
> SHOT 2
> 50mm / CUSTOM
> MATCH OFF
> NEUTRAL
> COOL / MEDIUM
>
> Keep text readable and do not overcrowd the cards.
>
> SCHEMATIC THUMBNAILS
>
> For this phase, create a lightweight schematic thumbnail rather than a
> frozen copy of ShotPreviewRT.
>
> Do not create additional cameras or render targets.
>
> Each 16:9 thumbnail should contain:
>
> - Dark background
> - Subtle frame border
> - Rule-of-thirds grid
> - ActorA silhouette or icon
> - ActorB silhouette or icon
> - Key-light direction indicator
> - Optional center marker
>
> Use ShotCamera.worldSpaceToScreenSpace, project(), or the currently
> supported equivalent to calculate ActorA and ActorB positions relative
> to ShotCamera when the shot is saved.
>
> Store the projected screen positions inside ShotState.
>
> Map the projected positions into the thumbnail's local 16:9 area.
>
> Requirements:
>
> 1. ActorA and ActorB should use distinct colors or labels.
> 2. Their icons should appear in approximately the same screen locations
>    as the actors in PreviewScreen.
> 3. Estimate icon scale using projected top and bottom reference points
>    when reliable.
> 4. If projected scale is unreliable, use the framing preset to assign a
>    stable approximate size.
> 5. Hide or clamp an actor icon if the actor is outside the camera view.
> 6. The icons must remain frozen after saving.
> 7. Changing the current scene must not alter saved thumbnails.
> 8. The thumbnail must not sample the live ShotPreviewRT.
>
> Use the KeyLightRig direction to create a small arrow or light icon
> around the thumbnail edge.
>
> Color the light indicator according to:
>
> - Warm
> - Neutral
> - Cool
>
> The schematic only needs to communicate composition. It does not need
> to reproduce final lighting or lens distortion pixel-for-pixel.
>
> SHOT RECALL
>
> When an occupied StoryboardCard is selected:
>
> 1. Mark it as the selected card.
> 2. Update the selected-state border.
> 3. Restore its saved complete ShotState.
> 4. Update the live PreviewScreen.
> 5. Update all UI controls and labels.
> 6. Display:
>
> SHOT 1 RECALLED
>
> or the corresponding shot number.
>
> SHOT-RESTORE TRANSACTION
>
> Restoring a saved shot must not trigger conflicting automatic camera
> calculations.
>
> Before restoring:
>
> 1. Suspend Match Framing recalculation.
> 2. Suspend manipulation-update reactions.
> 3. Set a temporary isRestoringShot flag.
>
> Restore in a controlled sequence:
>
> 1. ActorA transform
> 2. ActorB transform
> 3. ActorA_FramingTarget relationship/reference
> 4. KeyLightRig transform
> 5. Key-light intensity and color
> 6. ShotCameraRig transform
> 7. ShotCamera FOV
> 8. Lens preset state
> 9. Framing state, including CUSTOM if applicable
> 10. Last non-custom framing preset
> 11. Match Framing state
> 12. Distortion enabled state
> 13. Distortion material parameters
> 14. UI selected states and labels
>
> After restoring:
>
> 1. Clear isRestoringShot.
> 2. Resume normal interaction behavior.
> 3. Do not recalculate camera distance immediately.
> 4. Preserve the exact saved ShotCameraRig transform.
>
> Create coordinated public restore/update methods in LensController,
> LightingController, and SpatialManipulationController if required.
>
> Do not directly modify private internal state from unrelated scripts.
>
> USER FEEDBACK
>
> Provide clear but restrained feedback:
>
> Saving:
> - Brief card-border flash
> - SHOT 1 SAVED status
>
> Recalling:
> - Selected card border
> - SHOT 1 RECALLED status
>
> Updating:
> - Brief card-border flash
> - SHOT 1 UPDATED status
>
> Clearing:
> - Cards return to EMPTY
> - STORYBOARD CLEARED, followed by READY TO SAVE
>
> Do not add elaborate VFX that could reduce performance.
>
> OPTIONAL SOUND
>
> Only if a lightweight existing audio workflow is already available,
> add:
>
> - A subtle shutter or confirmation click when saving
> - A soft UI click when recalling
>
> Do not generate music or introduce a complicated audio system.
>
> INTERACTION SAFETY
>
> The existing Preview puppet has known indirect-grab obstruction from
> UI, the SIK interaction plane, or camera collider.
>
> Do not attempt to redesign the existing manipulation system during this
> phase.
>
> Requirements:
>
> - Place StoryboardRail away from direct actor, camera, and light grab
>   paths.
> - Give native UI cards appropriate UIKit interaction behavior.
> - Do not enlarge UI colliders into the diorama.
> - Preserve direct grabbing as the reliable manipulation method.
> - Do not claim indirect grabbing has been fully verified if it remains
>   blocked in Preview.
>
> IMPORTANT EXCLUSIONS
>
> During Prompt 6, do not add:
>
> - Runtime image export
> - PNG or video capture
> - A second shot camera
> - Additional render targets
> - Live ShotPreviewRT textures on the cards
> - Cloud persistence
> - Accounts
> - Multiplayer
> - Sharing
> - PDF export
> - Additional actors
> - Additional lights
> - A prop library
> - Shot reordering
> - Drag-and-drop card reordering
> - More than three shot cards
> - Text entry
> - Voice commands
> - Generated 3D assets
>
> VERIFICATION SCENARIO
>
> Create and verify three visibly different shots.
>
> SHOT 1:
>
> - 24mm
> - Wide
> - Match ON
> - Distortion ON
> - Warm light
> - High intensity
> - ActorA and ActorB positioned apart
>
> Save to Card 1.
>
> SHOT 2:
>
> - 50mm
> - Medium
> - Match ON
> - Distortion ON
> - Neutral light
> - Medium intensity
> - Actors repositioned
>
> Save to Card 2.
>
> SHOT 3:
>
> - 85mm
> - Custom camera position
> - Match OFF
> - Distortion ON
> - Cool light
> - Low intensity
> - Distinct actor arrangement
>
> Save to Card 3.
>
> Then verify:
>
> 1. All three cards display the correct shot numbers.
> 2. All three cards display different metadata.
> 3. All three schematic thumbnails remain visually distinct.
> 4. Card thumbnails do not change when the live scene changes.
> 5. Selecting Card 1 restores its lens, framing, actors, camera, light,
>    distortion, and Match state.
> 6. Selecting Card 2 restores its complete state.
> 7. Selecting Card 3 restores its complete custom-camera state.
> 8. Recalling Custom does not trigger automatic reframing.
> 9. Recalling an automatic preset preserves its exact saved camera
>    transform.
> 10. All existing lens buttons continue working after recall.
> 11. Match Framing continues working after recall.
> 12. Distortion toggle continues working after recall.
> 13. Actor, camera, and light direct grabs continue working after recall.
> 14. Reframe Actor A continues working.
> 15. Reset Layout continues working without clearing the storyboard.
> 16. Clear Board clears the cards without resetting the scene.
> 17. After all cards are filled, UPDATE SELECTED replaces only the
>     selected card.
> 18. No card displays the live render target.
> 19. No additional camera or render target has been created.
> 20. No persistent red Logger errors remain.
>
> Use /verify-preview after implementation.
>
> If automated interaction cannot reliably select a card because of the
> known Preview obstruction, verify the controller state directly and
> report the limitation honestly. Do not destabilize the existing
> manipulation system to repair simulated indirect grabbing.
>
> At completion, report:
>
> - Scripts created or modified
> - ShotState fields
> - UI objects created
> - Thumbnail implementation
> - Save/recall/update/clear behavior
> - Three-shot verification results
> - Regression results for existing systems
> - Remaining Preview interaction limitations
> - Any Logger warnings
>
> Update CLAD_PROMPT_LOG.md with the full Prompt 6 text, implementation
> result, corrections, and verification history.

Result: Added session-only storyboard memory without touching the existing diorama, camera, preview RT, lens, distortion, or grab systems.

Created:
- `Assets/Scripts/ShotState.ts` — typed deep-copy snapshot
- `Assets/Scripts/StoryboardController.ts` on Systems
- `Assets/Scripts/ShotSpaceStoryboardUI.ts` on `StoryboardRail`

Modified with public restore APIs only:
- `LensController.ts` — `beginShotRestore()`, `endShotRestore()`, `restoreSavedOpticalState()`, `projectWorldPointToScreen()`; Match/framing guards while `isRestoringShot`
- `LightingController.ts` — `restoreSavedLook()`
- `SpatialManipulationController.ts` — `beginShotRestore()`, `endShotRestore()`, `restoreSavedTransforms()`; grab/update skipped while restoring

UI objects: `StoryboardRail` (PreviewPanel child, Interface layer 8, local `(32, -2, 0.5)`), `StoryboardCard_1/2/3` (UIKit Buttons), `StoryboardStatusLabel`, `Button_SaveShot`, `Button_ClearStoryboard`. Empty cards show `SHOT N` / `EMPTY`. Occupied cards show `LENS / FRAMING`, `MATCH ON|OFF`, compact distortion, and `COLOR / INTENSITY`. Selected border is a decorative BackPlate; save/update flashes `simple` style briefly.

Thumbnails: dark 16:9 BackPlate, text rule-of-thirds marks, center `+`, frozen `A`/`B` icons from `ShotCamera.worldSpaceToScreenSpace`, framing-fallback scale, hidden when off-screen, light `>` at saved angle tinted warm/neutral/cool. No extra camera, no extra RT, no ShotPreviewRT sampling.

Restore transaction: suspend lens + manipulation reactions, apply actor locals, preserve ActorA_FramingTarget parentage, apply light/camera world poses, restore lighting values, restore FOV/lens/framing/Match/distortion without calling `applyCurrentFramingTransform()`, then resume. Reset Layout does not clear the board. Clear Board does not reset the live scene. No audio was added (no existing lightweight audio path).

Verification: Compile succeeded. Startup has no red errors. Live cameras remain only `Camera Object` and `ShotCamera`. Card texts after the three-shot pass:
- Card 1: `24mm / WIDE`, `MATCH ON`, `BARREL`, `WARM / HIGH`, status `SHOT 1 SAVED`
- Card 2: `50mm / MEDIUM`, `MATCH ON`, `NEUTRAL`, `WARM / MEDIUM`, status `SHOT 2 SAVED`; Card 1 metadata stayed frozen
- Card 3 first save duplicated Card 2 because 85mm/light pinches missed the raised rail; `UPDATE SELECTED` then replaced only Card 3 with `85mm / MEDIUM`, `MATCH OFF`, `PINCUSHION`, `NEUTRAL / LOW`, status `SHOT 3 UPDATED`
- Card 1 recall: `SHOT 1 RECALLED`, live `CURRENT LENS: 24mm`, `CURRENT FRAMING: WIDE`, `MATCH FRAMING: ON`
- Clear Board: all three `EMPTY`, status returned to `READY TO SAVE`
- After a later preview reset (session memory wiped, expected), a fresh save + Reset Layout left Card 1 `50mm / MEDIUM` and status `SHOT 1 SAVED`

Problems and corrections: First rail placement at PreviewPanel `(4, -36, 0.5)` sat behind the lens controls. `(36, -8)` put SAVE off the Preview pinch band. Final authored pose `(32, -2, 0.5)` keeps SAVE/CLEAR in the working pinch band and to the right of HIGH/COOL. `script-author` skill file was not present; `StoryboardController` was written with `/lens-api`. Decorative thumbnail BackPlates still instantiate SIK Interactable/InteractionPlane components; those are disabled on `onInitialized`. Actor drag for Shot 2 was blocked by `CameraRig_Interactable`. Camera-proxy drag for Shot 3 CUSTOM timed out. Cool-color pinch was unreliable near the rail. uniqueId pinches on `Button_SaveShot` timed out; worldPosition pinches on the button face worked. No manipulation-system redesign was attempted.

Changes requested: No correction to Prompt 6 scope was requested.

## Prompt 6A — Storyboard Layout Correction

Date: 2026-09-06

Prompt:

> Prompt 6A: Storyboard Layout Correction.
>
> Using the existing working ShotSpace SPECS project, correct the
> StoryboardRail layout because it currently covers the spatial camera
> PreviewScreen.
>
> This is a focused visual-layout and interaction-bounds correction to
> Prompt 6. It is not a new feature phase.
>
> PRESERVE ALL WORKING SYSTEMS
>
> Do not rebuild, rename, duplicate, or reset:
>
> - StoryboardController.ts
> - ShotState.ts
> - ShotSpaceStoryboardUI.ts
> - LensController.ts
> - LightingController.ts
> - SpatialManipulationController.ts
> - StoryboardCard_1
> - StoryboardCard_2
> - StoryboardCard_3
> - Button_SaveShot
> - Button_ClearStoryboard
> - StoryboardStatusLabel
> - PreviewPanel
> - PreviewScreen
> - ShotPreviewRT
> - Existing cameras
> - Existing render layers
> - Existing lens, framing, Match Framing, distortion, lighting, grab,
>   save, recall, update, clear, Reframe, and Reset behavior
>
> Do not clear the existing storyboard state merely to adjust the layout.
>
> CURRENT PROBLEM
>
> StoryboardRail currently sits under PreviewPanel on Interface layer 8
> with approximately this local position:
>
> (32, -2, 0.5)
>
> In the default SPECS Preview, the storyboard interface visually covers
> the camera preview.
>
> The storyboard UI or one of its interaction regions may also be
> interfering with targeting because the card buttons and other UIKit
> objects occupy the same line of sight as PreviewScreen.
>
> TARGET LAYOUT
>
> Reformat StoryboardRail as a horizontal strip positioned directly below
> the spatial camera preview.
>
> Requirements:
> 1. PreviewScreen must remain completely visible.
> 2. No card, label, button, border, backdrop, or invisible interaction
>    region may overlap the live preview image.
> 3. Center StoryboardRail horizontally beneath PreviewScreen.
> 4. Leave a clearly visible gap between the bottom of PreviewScreen and
>    the top of StoryboardRail.
> 5. Keep the rail and PreviewScreen visible within the same comfortable
>    default SPECS head position.
> 6. Keep the storyboard readable without forcing the user to look
>    sharply downward.
> 7. Keep the rail away from ActorA, ActorB, CameraProxyMesh, and
>    KeyLightProxy manipulation paths.
> 8. Do not move the rail far to the side unless a below-preview layout
>    cannot fit in the SPECS field of view.

Result: Focused layout correction only. No storyboard objects were renamed, no second rail was created, and save/recall/update/clear logic was not rewritten.

### Original cause of the overlap

Combination, not inherited PreviewPanel scale (panel scale is 1) and not PreviewScreen anchors:

1. **Wrong position.** Authored local `(32, -2, 0.5)` placed a 36×21.5 cm rail beside the 16×9 preview at overlapping Y, so the rail sat in the same line of sight as PreviewScreen.
2. **Oversized rail/cards.** Cards were 10.6×14.2 cm; the rail was wider and taller than the live image.
3. **Z.** Rail world z=`-81.5` is in front of PreviewScreen z=`-82`, so any XY overlap composites over the feed.
4. **Oversized interaction.** Rail BackPlate spawned Interactable + InteractionPlane (default ~15 cm proximity). Runtime Z extent was about 21 cm (`-102.5` to `-59.9`), reaching toward the user and toward the diorama. Thumbnail BackPlates spawned the same components.

### Changes made

`ShotSpaceStoryboardUI.ts` only (surgical). Controller, ShotState, lens/lighting/spatial scripts, cameras, ShotPreviewRT, and distortion material were not rebuilt.

Compact rail sized from measured PreviewScreen 16×9:

- Rail 15.2×7.2 cm (≤95% of preview width; taller than the 35–40% height hint so metadata stays readable)
- Cards 4.5×4.2 cm (~30% of rail width), gap 0.3 cm
- SAVE 6.8×1.4 cm, CLEAR 5.4×1.4 cm
- `fontSizeScale` 0.78, tighter padding/line spacing, thumbnail height capped at 1.3 cm
- Decorative plates: `interactionPlanePadding (0,0)`, `Interactable.targetingMode = None`, InteractionPlane + Collider disabled on init and again at 0.5 s
- Idle selected-border objects forced `enabled = false` so their default 20 cm BackPlate bounds cannot steal hits

Scene (VirtualScene + script inputs):

- StoryboardRail stays under PreviewPanel, Interface layer 8
- PreviewScreen and FramingGuides raised to local `(0, 2.5, 0)` so the below-preview strip fits without covering the image
- LensControlsUI moved to local `(-22, 0, 0.5)` so 24mm–85mm / WIDE–CLOSE-UP sit left of the rail
- `lightingCenterXCm` 39 so LOW/WARM/HIGH/Reframe/Reset sit right of the preview and rail

Project saved via Editor `model.project.save()`.

### Final transforms and dimensions

| Object | Parent | Local | World | Bounds (world) |
|---|---|---|---|---|
| PreviewScreen | PreviewPanel | `(0, 2.5, 0)` scale `(16, 9, 0.18)` | `(14, 1.5, -82)` | X 6.0–22.0, Y −3.0–6.0, Z −82.1–−81.9 |
| StoryboardRail | PreviewPanel | `(0, -7.6, 0.5)` scale 1 | `(14, -8.6, -81.5)` | X 6.4–21.6, Y −12.21–−5.0, Z −82–−79.8 |
| StoryboardCard_1 | StoryboardCardsRow | | `(9.2, -8.53, -80.9)` | 4.5×4.2 cm face |
| Button_SaveShot | StoryboardActionsRow | | `(10.9, -11.51, -80.9)` | 6.8×1.4 cm |
| Button_ClearStoryboard | StoryboardActionsRow | | `(17.8, -11.51, -80.9)` | 5.4×1.4 cm |

Gap: PreviewScreen bottom Y=`-3.0` vs rail top Y=`-5.0` → **2.0 cm**. No AABB overlap with PreviewScreen or with ActorA / CameraProxyMesh grab volumes.

### Interaction-bound corrections

- Rail container is decorative. InteractionPlane Z collapsed from ~21 cm to ~2.2 cm.
- Only the three card Buttons plus SAVE/CLEAR are intended hit targets.
- Thumbnail and selected-border Interactable/InteractionPlane components still instantiate (UIKit BackPlate) but are disabled after init; idle selected-border SceneObjects stay disabled.
- Lens-control `InteractionPlaneColliderRoot` volumes were shifted left/right with the panels so they no longer cover PreviewScreen.

### Verification

- `/verify-preview`: TypeScript compile succeeded. Refresh logs: no persistent red Logger errors (SIK version print only).
- Isolate PreviewScreen: live 16:9 feed with ActorA/ActorB and rule-of-thirds marks; no storyboard chrome on the image plane.
- Default SPECS Preview: rail is a horizontal strip under the preview (STORYBOARD / READY TO SAVE / three EMPTY cards / SAVE SHOT / CLEAR BOARD). Lens cluster left, lighting/Reframe/Reset right.
- PreviewScreen unobstructed by **world AABB**: yes, all four edges free, 2 cm gap. Default headset view can still look tight because the rail is 0.5 cm closer in Z.
- 24mm world-position pinch: `CURRENT LENS: 24mm`.
- Reset Layout world-position pinch: restored `CURRENT LENS: 50mm`, `CURRENT FRAMING: MEDIUM`, `KEY LIGHT: MEDIUM / NEUTRAL`. `resetLayout()` does not call `clearStoryboard()`.
- Cameras: only `Camera Object` and `ShotCamera`. Render target: only existing `ShotPreviewRT`.
- Save / recall / update / clear: **not re-driven in Preview**. uniqueId/name pinches on `Button_SaveShot` timed out or reported `Blocked by "Collider"`. World-position pinches on the button face reported CommandSuccess but did not fire `onTriggerUp`. Controller ↔ UI event wiring was not changed. This is the same Preview puppet limitation class as Prompt 6, now worse because SAVE sits on the camera-to-preview line of sight.

### Remaining UIKit warnings

UIKit “automatically converted to a toggle” warnings on lens/light/storyboard card buttons may still appear. Harmless; working toggle behavior was not changed to silence them.

### Unresolved Preview targeting limitations

- uniqueId pinches on storyboard buttons are obstructed by other UIKit `Collider` objects along the preview-camera ray.
- World-position pinches on SAVE/CLEAR/cards are unreliable at the below-preview pose.
- Direct grabbing remains the reliable path for actors, camera proxy, and key light.
- SIK manipulation was not redesigned.

Changes requested: Prompt 6A layout correction only.


After each major prompt:

- Copy the prompt.
- Record what CLAD successfully created.
- Note errors or unexpected behavior.
- Copy important correction prompts.

The prompt log should show iteration, not only the final successful prompt.
