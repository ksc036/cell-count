import type { MouseEvent } from "react";
import type { DividerLine, GlobalOverlay, LineOrientation } from "../types";

type ImageState = {
  file: File;
  url: string;
  width: number;
  height: number;
};

type ImageCanvasProps = {
  imageState: ImageState | null;
  lines: DividerLine[];
  overlays: GlobalOverlay[];
  placementMode: LineOrientation | null;
  previewPosition: number | null;
  deleteMode: boolean;
  hoveredOverlayId: string | null;
  onPreviewChange: (position: number | null) => void;
  onCommitLine: (position: number) => void;
  onOverlayHover: (overlayId: string | null) => void;
  onOverlayDelete: (overlayId: string) => void;
};

function formatPoints(points: GlobalOverlay["contour"]) {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function ImageCanvas({
  imageState,
  lines,
  overlays,
  placementMode,
  previewPosition,
  deleteMode,
  hoveredOverlayId,
  onPreviewChange,
  onCommitLine,
  onOverlayHover,
  onOverlayDelete
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
  }

  function handleCanvasClick(event: MouseEvent<SVGSVGElement>) {
    const position = getImagePosition(event);
    if (!position || !placementMode) {
      return;
    }
    onCommitLine(placementMode === "horizontal" ? position.y : position.x);
  }

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
        className="image-stage"
        viewBox={`0 0 ${imageState.width} ${imageState.height}`}
        onClick={handleCanvasClick}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
      >
        <image height={imageState.height} href={imageState.url} width={imageState.width} x={0} y={0} />

        {lines.map((line) =>
          line.orientation === "horizontal" ? (
            <line key={line.id} className="divider-line" x1={0} x2={imageState.width} y1={line.position} y2={line.position} />
          ) : (
            <line key={line.id} className="divider-line" x1={line.position} x2={line.position} y1={0} y2={imageState.height} />
          )
        )}

        {previewPosition !== null && placementMode === "horizontal" ? (
          <line className="preview-line" x1={0} x2={imageState.width} y1={previewPosition} y2={previewPosition} />
        ) : null}
        {previewPosition !== null && placementMode === "vertical" ? (
          <line className="preview-line" x1={previewPosition} x2={previewPosition} y1={0} y2={imageState.height} />
        ) : null}

        {overlays.map((overlay) => (
          <polygon
            key={overlay.globalId}
            className={hoveredOverlayId === overlay.globalId ? "overlay-shape is-hovered" : "overlay-shape"}
            points={formatPoints(overlay.contour)}
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
