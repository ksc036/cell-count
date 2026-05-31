# StarDist Cell Count Web App Design

## Overview

This project is a local web application for counting cells in microscopy images using StarDist-based segmentation plus lightweight user correction tools.

The user uploads an image, draws horizontal and vertical divider lines to split the image into patches, runs analysis, sends cropped patch images to the backend in one batch request, reviews returned patch-level overlays, deletes incorrect overlays directly on the image, and enters manual extra counts per patch for missed cells. The app then shows per-patch and total cell counts immediately.

## Goals

- Support local analysis of `png`, `jpg`, `jpeg`, `tif`, and `tiff` images.
- Allow users to divide the image into rectangular patches using horizontal and vertical lines.
- Run StarDist-based segmentation on cropped patch images uploaded from the client.
- Render returned patch overlays on top of the original image after client-side merging.
- Let users remove incorrect overlays from the client without re-running analysis.
- Let users enter manual additional counts per patch without clicking exact locations.
- Show automatic, manual, and final counts per patch and for the full image.

## Non-Goals

- No user accounts or authentication.
- No persistent database in version 1.
- No server-side editing workflow after initial analysis.
- No coordinate-based manual cell placement.
- No collaborative editing or multi-user sessions.

## Product Flow

1. The user uploads an image.
2. The app renders the image in an interactive canvas.
3. The user enters horizontal-line or vertical-line placement mode.
4. A preview line follows the mouse cursor.
5. Clicking the image commits the line to the canvas.
6. The client computes patch rectangles from the current horizontal and vertical lines.
7. The client crops patch images from the original image using those rectangles.
8. The user starts analysis.
9. The client sends all cropped patch images and patch metadata to the backend in one batch request.
10. The backend runs StarDist on each uploaded patch image independently.
11. The backend returns a patch-result list, each containing patch-local overlays.
12. The client converts patch-local overlays into original-image coordinates and merges them into one overlay layer.
13. The client computes automatic counts per patch from the patch results.
14. The user can enter delete-overlay mode, hover an overlay to highlight it, and click to remove it.
15. The user can enter a manual additional count for each patch.
16. The client recomputes patch totals and the global total immediately.

## Architecture

### Frontend

- `React` + `TypeScript` + `Vite`
- Single-page local web UI
- Canvas-based image viewer with overlay and divider rendering
- Client-side state for:
  - uploaded image metadata
  - divider lines
  - computed patches
  - cropped patch payloads
  - patch analysis results
  - merged overlays in original-image coordinates
  - deleted overlay ids
  - per-patch manual extra counts

### Backend

- `FastAPI`
- Multipart batch-upload endpoint for patch analysis
- Image decoding for `png/jpg/tiff`
- StarDist inference per uploaded patch image
- Response containing patch-result objects

### Inference Stack

- `stardist`
- `tensorflow` or StarDist-compatible backend dependency
- `numpy`
- `opencv-python`
- `Pillow`
- `tifffile`

## Responsibility Split

### Backend Responsibilities

- Load and normalize each uploaded patch image.
- Accept patch metadata from the client.
- Run StarDist on each uploaded patch image.
- Return patch-local overlay geometry and metadata for each patch.

### Frontend Responsibilities

- Manage divider-line creation and deletion.
- Compute patch rectangles from image bounds plus current horizontal and vertical lines.
- Crop each patch image from the original image before analysis.
- Submit a batch of patch images plus patch metadata for analysis.
- Convert patch-local overlays into original-image coordinates.
- Merge returned patch overlays into one client-side overlay collection.
- Render merged overlays on the image.
- Compute automatic counts per patch from patch results and non-deleted overlays.
- Remove overlays only in client state after user deletion.
- Store manual additional counts per patch.
- Compute final per-patch and total counts.

## Patch Model

The client is the source of truth for patch definitions.

Given:
- image width and height
- sorted horizontal divider positions
- sorted vertical divider positions

The client computes rectangular patches by splitting the image bounds into a grid. Each patch includes:

- `id`
- `rowIndex`
- `columnIndex`
- `x`
- `y`
- `width`
- `height`
- `label`

Suggested labels:
- `R1C1`, `R1C2`, `R2C1`, etc.

## Overlay Model

The backend returns overlays in patch-local coordinates. The client is responsible for converting them into original-image coordinates by adding the patch origin offset.

Each patch-local overlay should include:

- `id`
- `polygon`: list of points in patch-local coordinates
- `bbox`: `{ x, y, width, height }` in patch-local coordinates
- `centroid`: `{ x, y }` in patch-local coordinates

The client should wrap each returned overlay with:

- `globalId`
- `patchId`
- `sourceOverlayId`
- `polygon` in original-image coordinates
- `bbox` in original-image coordinates
- `centroid` in original-image coordinates

The client should use `patchId` as the primary patch association for counting and editing.

## Counting Rules

For each patch:

- `automaticCount` = number of overlays assigned to the patch that are not deleted
- `manualAddedCount` = user-entered integer for that patch
- `finalCount` = `automaticCount + manualAddedCount`

For the whole image:

- `totalAutomaticCount` = sum of patch automatic counts
- `totalManualAddedCount` = sum of patch manual added counts
- `totalFinalCount` = sum of patch final counts

Deleting an overlay only affects client state. It does not trigger a backend update or re-analysis.

## API Design

### `POST /api/analyze`

Request:
- multipart patch image files
- patch metadata payload describing the uploaded patches

Request body concept:

```json
{
  "patches": [
    {
      "patchId": "R1C1",
      "x": 0,
      "y": 0,
      "width": 200,
      "height": 120,
      "fileField": "patch_R1C1"
    },
    {
      "patchId": "R1C2",
      "x": 200,
      "y": 0,
      "width": 280,
      "height": 120,
      "fileField": "patch_R1C2"
    }
  ]
}
```

Response:

```json
{
  "patchResults": [
    {
      "patchId": "R1C1",
      "overlays": [
        {
          "id": "ov-1",
          "polygon": [{ "x": 10, "y": 12 }, { "x": 18, "y": 12 }, { "x": 18, "y": 20 }],
          "bbox": { "x": 10, "y": 12, "width": 8, "height": 8 },
          "centroid": { "x": 14, "y": 16 }
        }
      ]
    }
  ]
}
```

The backend returns patch results, not merged image overlays and not patch-level final counts. The client merges overlays and computes counts.

## UI Design

### Main Layout

- Left side: image workspace
- Right side: controls and patch summary

### Controls

- Upload image
- Add horizontal line
- Add vertical line
- Clear all lines
- Run patch analysis
- Delete overlay mode toggle
- Reset deleted overlays

### Image Workspace

- Render original image
- Render committed divider lines
- Render preview line during placement mode
- Render overlays after analysis
- Highlight overlay on hover in delete mode

### Patch Summary Panel

For each patch show:

- patch label
- automatic count
- manual added count input
- final count

Also show:

- total automatic count
- total manual added count
- total final count

## Interaction Details

### Divider Lines

- Only one placement mode is active at a time.
- Horizontal preview follows the current mouse `y`.
- Vertical preview follows the current mouse `x`.
- Clicking commits the preview as a real divider line.
- Divider positions should be stored in image coordinate space, not screen coordinate space.

### Overlay Deletion

- Deletion uses a dedicated mode to avoid accidental edits.
- Hovering an overlay in delete mode highlights it.
- Clicking marks it deleted in client state.
- Deleted overlays disappear visually and are excluded from automatic counts immediately.

### Manual Additional Count

- Each patch has a numeric input with a default of `0`.
- Only non-negative integers are allowed.
- Manual additions do not create new overlay graphics.

## Error Handling

### Frontend

- Block analysis if no image is uploaded.
- Block analysis if patch cropping fails for any patch.
- Show request failure state if backend analysis fails.
- Validate numeric manual inputs.
- Reset derived state cleanly when a new image is uploaded.

### Backend

- Reject unsupported file types.
- Return clear errors for unreadable patch images.
- Return clear errors if inference setup is unavailable.
- Validate patch metadata against the uploaded files.

## Performance Notes

- Use client-side derived state for counts so overlay deletion updates instantly.
- Keep backend stateless for version 1.
- Expect StarDist inference cost to scale with patch count.
- Avoid sending rendered overlay images from the server; send geometry only.
- Prefer a single batch request over multiple patch requests to reduce UI coordination complexity.

## Testing Strategy

### Frontend

- Unit tests for patch computation from divider lines.
- Unit tests for patch cropping metadata generation.
- Unit tests for patch-result to global-overlay coordinate conversion.
- Unit tests for count recomputation after overlay deletion.
- Unit tests for final count calculation with manual additions.
- Component tests for line placement and delete-overlay behavior.

### Backend

- Unit tests for patch metadata parsing and file matching.
- Unit tests for image decoding across uploaded `png/jpg/tiff` patch files.
- Contract tests for analysis response shape.
- Smoke test for batch StarDist inference pipeline when model dependencies are available.

## Initial File Direction

### Frontend

- `frontend/src/App.tsx`
- `frontend/src/components/ImageCanvas.tsx`
- `frontend/src/components/ControlPanel.tsx`
- `frontend/src/components/PatchSummary.tsx`
- `frontend/src/lib/patches.ts`
- `frontend/src/lib/cropImage.ts`
- `frontend/src/lib/overlays.ts`
- `frontend/src/lib/analyzePatches.ts`
- `frontend/src/types.ts`

### Backend

- `backend/app/main.py`
- `backend/app/schemas.py`
- `backend/app/image_io.py`
- `backend/app/inference.py`

## Open Implementation Choices Resolved

- Patch rectangles are computed on the client.
- The client crops patch images and uploads them in one batch request.
- The backend returns patch-local overlays, not merged image overlays and not patch counts.
- The client converts patch-local overlays into full-image overlays.
- Overlay deletion is client-only.
- Manual correction is patch-level numeric input only.
- Version 1 is a local web app, not a desktop package.

## Success Criteria

- A local user can upload a supported image and draw divider lines.
- The app can crop the image into patches, upload them in one request, analyze them with StarDist, and render merged overlays.
- The user can delete incorrect overlays directly from the UI.
- The user can enter manual additional counts per patch.
- The app shows accurate per-patch and total counts after each edit.
