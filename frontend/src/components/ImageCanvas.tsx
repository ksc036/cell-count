import type { MouseEvent } from "react";
import type { DividerLine, GlobalOverlay, LineOrientation, Patch, ViewMode } from "../types";

type ImageState = {
  file: File;
  url: string;
  width: number;
  height: number;
};

type ImageCanvasProps = {
  imageState: ImageState | null;
  patches: Patch[];
  lines: DividerLine[];
  overlays: GlobalOverlay[];
  placementMode: LineOrientation | null;
  previewPosition: number | null;
  deleteMode: boolean;
  selectPatchMode: boolean;
  selectedPatchIds: Set<string>;
  hoveredPatchId: string | null;
  hoveredOverlayId: string | null;
  viewMode: ViewMode;
  focusedPatch: Patch | null;
  overlayOpacity: number;
  onPreviewChange: (position: number | null) => void;
  onCommitLine: (position: number) => void;
  onOverlayHover: (overlayId: string | null) => void;
  onOverlayDelete: (overlayId: string) => void;
  onPatchHover: (patchId: string | null) => void;
  onPatchToggle: (patchId: string) => void;
  onPatchFocus: (patchId: string) => void;
};

function formatPoints(points: GlobalOverlay["contour"]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function formatLocalPoints(points: GlobalOverlay["contour"], patch: Patch) {
  return points.map((point) => `${point.x - patch.x},${point.y - patch.y}`).join(" ");
}

function ImageCanvas({
  imageState,
  patches,
  lines,
  overlays,
  placementMode,
  previewPosition,
  deleteMode,
  selectPatchMode,
  selectedPatchIds,
  hoveredPatchId,
  hoveredOverlayId,
  viewMode,
  focusedPatch,
  overlayOpacity,
  onPreviewChange,
  onCommitLine,
  onOverlayHover,
  onOverlayDelete,
  onPatchHover,
  onPatchToggle,
  onPatchFocus
}: ImageCanvasProps) {
  function getImagePosition(event: MouseEvent<SVGSVGElement>) {
    if (!imageState) {
      return null;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const scaleX = imageState.width / rect.width;
    const scaleY = imageState.height / rect.height;
    return {
      x: Math.max(0, Math.min(imageState.width, (event.clientX - rect.left) * scaleX)),
      y: Math.max(0, Math.min(imageState.height, (event.clientY - rect.top) * scaleY))
    };
  }

  function handleMouseMove(event: MouseEvent<SVGSVGElement>) {
    const position = getImagePosition(event);
    if (!position || !placementMode) {
      onPreviewChange(null);
      return;
    }
    onPreviewChange(placementMode === "horizontal" ? position.y : position.x);
  }

  function handleMouseLeave() {
    onPreviewChange(null);
    onOverlayHover(null);
    onPatchHover(null);
  }

  function handleCanvasClick(event: MouseEvent<SVGSVGElement>) {
    const position = getImagePosition(event);
    if (!position || !placementMode) {
      return;
    }
    onCommitLine(placementMode === "horizontal" ? position.y : position.x);
  }

  const visiblePatch = viewMode === "patch" ? focusedPatch : null;
  const visibleOverlays = visiblePatch ? overlays.filter((overlay) => overlay.patchId === visiblePatch.id) : overlays;
  const visiblePatches = visiblePatch ? [visiblePatch] : patches;
  const detailOverlays = visiblePatch
    ? visibleOverlays.map((overlay) => ({
        ...overlay,
        localPoints: formatLocalPoints(overlay.contour, visiblePatch)
      }))
    : ([] as Array<GlobalOverlay & { localPoints: string }>);
  const viewBox =
    visiblePatch && imageState
      ? `0 0 ${visiblePatch.width} ${visiblePatch.height}`
      : imageState
        ? `0 0 ${imageState.width} ${imageState.height}`
        : "0 0 0 0";

  if (!imageState) {
    return (
      <section className="canvas-shell canvas-empty">
        <p>Upload a microscopy image to begin.</p>
      </section>
    );
  }

  return (
    <section className="canvas-shell">
      <svg
        aria-label="Image workspace"
        className={viewMode === "patch" ? "image-stage image-stage-patch" : "image-stage"}
        viewBox={viewBox}
        onClick={handleCanvasClick}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        {visiblePatch ? (
          <image
            height={imageState.height}
            href={imageState.url}
            width={imageState.width}
            x={-visiblePatch.x}
            y={-visiblePatch.y}
          />
        ) : (
          <image height={imageState.height} href={imageState.url} width={imageState.width} x={0} y={0} />
        )}

        {viewMode === "full"
          ? visiblePatches.map((patch) => {
          const isSelected = selectedPatchIds.has(patch.id);
          const isHovered = hoveredPatchId === patch.id;
          const showLabel = selectPatchMode && (isHovered || isSelected);

          return (
            <g key={patch.id}>
              <rect
                className={
                  selectPatchMode
                    ? isSelected
                      ? "patch-region is-selected"
                      : isHovered
                        ? "patch-region is-hovered"
                        : "patch-region"
                    : "patch-region is-hidden"
                }
                height={patch.height}
                width={patch.width}
                x={patch.x}
                y={patch.y}
                onClick={(event) => {
                  if (placementMode || deleteMode) {
                    return;
                  }
                  event.stopPropagation();
                  if (selectPatchMode) {
                    onPatchToggle(patch.id);
                    return;
                  }
                  onPatchFocus(patch.id);
                }}
                onMouseEnter={() => onPatchHover(patch.id)}
              />
              {showLabel ? (
                <g className="patch-label-group">
                  <rect className="patch-label-pill" height={18} rx={9} width={42} x={patch.x + 8} y={patch.y + 8} />
                  <text className="patch-label-text" x={patch.x + 29} y={patch.y + 20}>
                    {patch.label}
                  </text>
                </g>
              ) : null}
            </g>
          );
        })
          : null}

        {viewMode === "full"
          ? lines.map((line) =>
              line.orientation === "horizontal" ? (
                <line key={line.id} className="divider-line" x1={0} x2={imageState.width} y1={line.position} y2={line.position} />
              ) : (
                <line key={line.id} className="divider-line" x1={line.position} x2={line.position} y1={0} y2={imageState.height} />
              )
            )
          : null}

        {previewPosition !== null && placementMode === "horizontal" ? (
          <line className="preview-line" x1={0} x2={imageState.width} y1={previewPosition} y2={previewPosition} />
        ) : null}
        {previewPosition !== null && placementMode === "vertical" ? (
          <line className="preview-line" x1={previewPosition} x2={previewPosition} y1={0} y2={imageState.height} />
        ) : null}

        {visiblePatch
          ? detailOverlays.map((overlay) => (
              <polygon
                key={overlay.globalId}
                className={hoveredOverlayId === overlay.globalId ? "overlay-shape is-hovered" : "overlay-shape"}
                points={overlay.localPoints}
                style={{
                  ["--overlay-opacity" as string]: String(overlayOpacity),
                  pointerEvents: deleteMode ? "auto" : "none"
                }}
                onClick={(event) => {
                  if (!deleteMode) {
                    return;
                  }
                  event.stopPropagation();
                  onOverlayDelete(overlay.globalId);
                }}
                onMouseEnter={() => {
                  if (deleteMode) {
                    onOverlayHover(overlay.globalId);
                  }
                }}
              />
            ))
          : visibleOverlays.map((overlay) => (
          <polygon
            key={overlay.globalId}
            className={hoveredOverlayId === overlay.globalId ? "overlay-shape is-hovered" : "overlay-shape"}
            points={formatPoints(overlay.contour)}
            style={{
              ["--overlay-opacity" as string]: String(overlayOpacity),
              pointerEvents: deleteMode ? "auto" : "none"
            }}
            onClick={(event) => {
              if (!deleteMode) {
                return;
              }
              event.stopPropagation();
              onOverlayDelete(overlay.globalId);
            }}
            onMouseEnter={() => {
              if (deleteMode) {
                onOverlayHover(overlay.globalId);
              }
            }}
          />
            ))}
      </svg>
    </section>
  );
}

export default ImageCanvas;
