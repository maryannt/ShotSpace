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

## Logging Instructions

After each major prompt:

- Copy the prompt.
- Record what CLAD successfully created.
- Note errors or unexpected behavior.
- Copy important correction prompts.

The prompt log should show iteration, not only the final successful prompt.
