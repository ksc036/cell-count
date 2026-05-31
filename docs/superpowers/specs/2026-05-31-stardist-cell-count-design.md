# StarDist Cell Count Web App Design

## Overview

This project is a local web application for counting cells in microscopy images using StarDist-based segmentation plus lightweight user correction tools.

The user uploads an image, draws horizontal and vertical divider lines to split the image into patches, runs analysis, reviews detected overlays, deletes incorrect overlays directly on the image, and enters manual extra counts per patch for missed cells. The app then shows per-patch and total cell counts immediately.

## Goals

- Support local analysis of `png`, `jpg`, `jpeg`, `tif`, and `tiff` images.
- Allow users to divide the image into rectangular patches using horizontal and vertical lines.
- Run StarDist-based segmentation per patch on the server.
- Render returned overlays on top of the original image.
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
7. The user starts analysis.
8. The client sends the image and divider-line positions to the backend.
9. The backend runs StarDist on each computed patch and returns overlay objects in original-image coordinates.
10. The client renders overlays on top of the image.
11. The client maps overlays to patches and computes automatic counts per patch.
12. The user can enter delete-overlay mode, hover an overlay to highlight it, and click to remove it.
13. The user can enter a manual additional count for each patch.
14. The client recomputes patch totals and the global total immediately.

## Architecture

### Frontend

- `React` + `TypeScript` + `Vite`
- Single-page local web UI
- Canvas-based image viewer with overlay and divider rendering
- Client-side state for:
  - uploaded image metadata
  - divider lines
  - computed patches
  - returned overlays
  - deleted overlay ids
  - per-patch manual extra counts

### Backend

- `FastAPI`
- Multipart upload endpoint for image analysis
- Image decoding for `png/jpg/tiff`
- Patch cropping and StarDist inference
- Response containing overlay objects only

### Inference Stack

- `stardist`
- `tensorflow` or StarDist-compatible backend dependency
- `numpy`
- `opencv-python`
- `Pillow`
- `tifffile`

## Responsibility Split

### Backend Responsibilities

- Load and normalize the uploaded image.
- Accept divider-line positions from the client.
- Derive patch crops from the divider positions for inference.
- Run StarDist on each patch.
- Convert detected objects back into original-image coordinates.
- Return a flat overlay list with geometry and metadata.

### Frontend Responsibilities

- Manage divider-line creation and deletion.
- Compute patch rectangles from image bounds plus current horizontal and vertical lines.
- Submit image plus line positions for analysis.
- Render overlays on the image.
- Assign each overlay to a patch using overlay centroid or other stable anchor point.
- Compute automatic counts per patch from non-deleted overlays.
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

The backend returns overlays with enough geometry to render and hit-test them on the client.

Each overlay should include:

- `id`
- `polygon`: list of points in original-image coordinates
- `bbox`: `{ x, y, width, height }`
- `centroid`: `{ x, y }`
- `patchHint` optional

The client should rely on `centroid` to map an overlay to a patch. If the centroid falls inside a patch rectangle, that overlay belongs to the patch.

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
- multipart image file
- divider lines payload, either as JSON field or structured form field

Request body concept:

```json
{
  "horizontalLines": [120, 340],
  "verticalLines": [200, 480]
}
```

Response:

```json
{
  "imageWidth": 1024,
  "imageHeight": 768,
  "overlays": [
    {
      "id": "ov-1",
      "polygon": [{ "x": 10, "y": 12 }, { "x": 18, "y": 12 }, { "x": 18, "y": 20 }],
      "bbox": { "x": 10, "y": 12, "width": 8, "height": 8 },
      "centroid": { "x": 14, "y": 16 }
    }
  ]
}
```

No patch-level counts are returned. The client computes them from patch geometry plus overlays.

## UI Design

### Main Layout

- Left side: image workspace
- Right side: controls and patch summary

### Controls

- Upload image
- Add horizontal line
- Add vertical line
- Clear all lines
- Run analysis
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
- Show request failure state if backend analysis fails.
- Validate numeric manual inputs.
- Reset derived state cleanly when a new image is uploaded.

### Backend

- Reject unsupported file types.
- Return clear errors for unreadable images.
- Return clear errors if inference setup is unavailable.
- Validate divider positions against image bounds.

## Performance Notes

- Use client-side derived state for counts so overlay deletion updates instantly.
- Keep backend stateless for version 1.
- Expect StarDist inference cost to scale with patch count.
- Avoid sending rendered overlay images from the server; send geometry only.

## Testing Strategy

### Frontend

- Unit tests for patch computation from divider lines.
- Unit tests for overlay-to-patch assignment.
- Unit tests for count recomputation after overlay deletion.
- Unit tests for final count calculation with manual additions.
- Component tests for line placement and delete-overlay behavior.

### Backend

- Unit tests for divider-line to patch-bound calculation.
- Unit tests for image decoding across `png/jpg/tiff`.
- Contract tests for analysis response shape.
- Smoke test for StarDist inference pipeline when model dependencies are available.

## Initial File Direction

### Frontend

- `frontend/src/App.tsx`
- `frontend/src/components/ImageCanvas.tsx`
- `frontend/src/components/ControlPanel.tsx`
- `frontend/src/components/PatchSummary.tsx`
- `frontend/src/lib/patches.ts`
- `frontend/src/lib/overlays.ts`
- `frontend/src/types.ts`

### Backend

- `backend/app/main.py`
- `backend/app/schemas.py`
- `backend/app/image_io.py`
- `backend/app/patching.py`
- `backend/app/inference.py`

## Open Implementation Choices Resolved

- Patch rectangles are computed on the client.
- The backend returns overlays, not patch counts.
- Overlay deletion is client-only.
- Manual correction is patch-level numeric input only.
- Version 1 is a local web app, not a desktop package.

## Success Criteria

- A local user can upload a supported image and draw divider lines.
- The app can analyze the image with StarDist and render overlays.
- The user can delete incorrect overlays directly from the UI.
- The user can enter manual additional counts per patch.
- The app shows accurate per-patch and total counts after each edit.
