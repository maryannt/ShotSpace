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

## Logging Instructions

After each major prompt:

- Copy the prompt.
- Record what CLAD successfully created.
- Note errors or unexpected behavior.
- Copy important correction prompts.

The prompt log should show iteration, not only the final successful prompt.
