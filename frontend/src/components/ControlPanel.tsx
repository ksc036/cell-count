import type { ChangeEvent } from "react";
import type { AnalyzeOptions, LineOrientation } from "../types";

type ControlPanelProps = {
  hasImage: boolean;
  placementMode: LineOrientation | null;
  deleteMode: boolean;
  isAnalyzing: boolean;
  analysisOptions: AnalyzeOptions;
  onFileChange: (file: File | null) => void;
  onAnalysisOptionsChange: (options: AnalyzeOptions) => void;
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
  analysisOptions,
  onFileChange,
  onAnalysisOptionsChange,
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

  function handleNumberOption<K extends keyof AnalyzeOptions>(key: K, fallback: number) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const parsed = rawValue === "" ? fallback : Number(rawValue);
      onAnalysisOptionsChange({
        ...analysisOptions,
        [key]: Number.isNaN(parsed) ? fallback : parsed
      });
    };
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
        <div className="input-grid">
          <label>
            Prob
            <input
              aria-label="Probability threshold"
              inputMode="decimal"
              max={1}
              min={0}
              step={0.05}
              type="number"
              value={analysisOptions.probThresh ?? 0.5}
              onChange={handleNumberOption("probThresh", 0.5)}
            />
          </label>
          <label>
            NMS
            <input
              aria-label="NMS threshold"
              inputMode="decimal"
              max={1}
              min={0}
              step={0.05}
              type="number"
              value={analysisOptions.nmsThresh ?? 0.4}
              onChange={handleNumberOption("nmsThresh", 0.4)}
            />
          </label>
          <label>
            Min area
            <input
              aria-label="Minimum area"
              inputMode="numeric"
              min={0}
              step={1}
              type="number"
              value={analysisOptions.minArea ?? 0}
              onChange={handleNumberOption("minArea", 0)}
            />
          </label>
          <label>
            Max area
            <input
              aria-label="Maximum area"
              inputMode="numeric"
              min={0}
              step={1}
              type="number"
              value={analysisOptions.maxArea ?? ""}
              onChange={(event) => {
                const rawValue = event.target.value.trim();
                onAnalysisOptionsChange({
                  ...analysisOptions,
                  maxArea: rawValue === "" ? undefined : Math.max(0, Number.parseInt(rawValue, 10) || 0)
                });
              }}
            />
          </label>
        </div>
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
