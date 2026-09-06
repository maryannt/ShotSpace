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

## Logging Instructions

After each major prompt:

- Copy the prompt.
- Record what CLAD successfully created.
- Note errors or unexpected behavior.
- Copy important correction prompts.

The prompt log should show iteration, not only the final successful prompt.
