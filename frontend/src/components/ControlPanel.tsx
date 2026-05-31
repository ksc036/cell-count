import type { ChangeEvent } from "react";
import type { LineOrientation } from "../types";

type ControlPanelProps = {
  hasImage: boolean;
  placementMode: LineOrientation | null;
  deleteMode: boolean;
  isAnalyzing: boolean;
  onFileChange: (file: File | null) => void;
  onPlacementModeChange: (mode: LineOrientation | null) => void;
  onToggleDeleteMode: () => void;
  onClearLines: () => void;
  onResetDeletedOverlays: () => void;
  onAnalyze: () => void;
};

function ControlPanel({
  hasImage,
  placementMode,
  deleteMode,
  isAnalyzing,
  onFileChange,
  onPlacementModeChange,
  onToggleDeleteMode,
  onClearLines,
  onResetDeletedOverlays,
  onAnalyze
}: ControlPanelProps) {
  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    onFileChange(file);
    event.target.value = "";
  }

  return (
    <section className="panel">
      <div className="panel-block">
        <p className="panel-label">1. Upload image</p>
        <label className="file-picker">
          <input accept=".png,.jpg,.jpeg,.tif,.tiff" aria-label="Upload image" type="file" onChange={handleUpload} />
          <span>Select png / jpg / tiff</span>
        </label>
      </div>

      <div className="panel-block">
        <p className="panel-label">2. Draw patch dividers</p>
        <div className="button-grid">
          <button
            className={placementMode === "horizontal" ? "active" : ""}
            disabled={!hasImage}
            type="button"
            onClick={() => onPlacementModeChange(placementMode === "horizontal" ? null : "horizontal")}
          >
            Add horizontal line
          </button>
          <button
            className={placementMode === "vertical" ? "active" : ""}
            disabled={!hasImage}
            type="button"
            onClick={() => onPlacementModeChange(placementMode === "vertical" ? null : "vertical")}
          >
            Add vertical line
          </button>
          <button disabled={!hasImage} type="button" onClick={onClearLines}>
            Clear lines
          </button>
        </div>
      </div>

      <div className="panel-block">
        <p className="panel-label">3. Analyze patches</p>
        <button className="primary-button" disabled={!hasImage || isAnalyzing} type="button" onClick={onAnalyze}>
          {isAnalyzing ? "Analyzing..." : "Run patch analysis"}
        </button>
      </div>

      <div className="panel-block">
        <p className="panel-label">4. Correct overlays</p>
        <div className="button-grid">
          <button className={deleteMode ? "danger" : ""} disabled={!hasImage} type="button" onClick={onToggleDeleteMode}>
            {deleteMode ? "Delete mode on" : "Delete overlay"}
          </button>
          <button disabled={!hasImage} type="button" onClick={onResetDeletedOverlays}>
            Reset deleted overlays
          </button>
        </div>
      </div>
    </section>
  );
}

export default ControlPanel;
