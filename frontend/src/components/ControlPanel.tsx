import type { ChangeEvent } from "react";
import type { AnalyzeOptions, LineOrientation, ViewMode } from "../types";

type ControlPanelProps = {
  hasImage: boolean;
  placementMode: LineOrientation | null;
  deleteMode: boolean;
  selectPatchMode: boolean;
  viewMode: ViewMode;
  focusedPatchId: string | null;
  selectedPatchCount: number;
  isAnalyzing: boolean;
  analysisOptions: AnalyzeOptions;
  overlayOpacity: number;
  onFileChange: (file: File | null) => void;
  onAnalysisOptionsChange: (options: AnalyzeOptions) => void;
  onPlacementModeChange: (mode: LineOrientation | null) => void;
  onToggleDeleteMode: () => void;
  onTogglePatchSelectionMode: () => void;
  onClearLines: () => void;
  onResetDeletedOverlays: () => void;
  onAnalyze: () => void;
  onOverlayOpacityChange: (value: number) => void;
  onReturnToFullView: () => void;
  onFocusPreviousPatch: () => void;
  onFocusNextPatch: () => void;
  onDeleteAllPatchOverlays?: () => void;
  onAnalyzeFocusedPatch?: () => void;
};

function ControlPanel({
  hasImage,
  placementMode,
  deleteMode,
  selectPatchMode,
  viewMode,
  focusedPatchId,
  selectedPatchCount,
  isAnalyzing,
  analysisOptions,
  overlayOpacity,
  onFileChange,
  onAnalysisOptionsChange,
  onPlacementModeChange,
  onToggleDeleteMode,
  onTogglePatchSelectionMode,
  onClearLines,
  onResetDeletedOverlays,
  onAnalyze,
  onOverlayOpacityChange,
  onReturnToFullView,
  onFocusPreviousPatch,
  onFocusNextPatch,
  onDeleteAllPatchOverlays,
  onAnalyzeFocusedPatch
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
          <button className={selectPatchMode ? "active" : ""} disabled={!hasImage} type="button" onClick={onTogglePatchSelectionMode}>
            {selectPatchMode ? "Selecting patches..." : "원하는 patch만 보내기"}
          </button>
        </div>
        <p className="helper-copy">
          {selectedPatchCount > 0 ? `${selectedPatchCount} patch selected for the next analysis.` : "No patch selected: analyze all patches."}
        </p>
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
          {isAnalyzing ? "Analyzing..." : selectedPatchCount > 0 ? "Analyze selected patches" : "Run patch analysis"}
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

      <div className="panel-block">
        <p className="panel-label">5. View mode</p>
        <div className="button-grid">
          <button className={viewMode === "full" ? "active" : ""} disabled={!hasImage} type="button" onClick={onReturnToFullView}>
            전체 이미지 보기
          </button>
          <button className={viewMode === "patch" ? "active" : ""} disabled={!focusedPatchId} type="button" onClick={onFocusPreviousPatch}>
            이전 patch
          </button>
          <button className={viewMode === "patch" ? "active" : ""} disabled={!focusedPatchId} type="button" onClick={onFocusNextPatch}>
            다음 patch
          </button>
        </div>
        {viewMode === "patch" && focusedPatchId ? <p className="helper-copy">Patch detail: {focusedPatchId}</p> : null}
      </div>

      <div className="panel-block">
        <p className="panel-label">6. Patch tools</p>
        <label>
          Overlay opacity
          <input
            aria-label="Overlay opacity"
            max={0.9}
            min={0.05}
            step={0.05}
            type="range"
            value={overlayOpacity}
            onChange={(event) => onOverlayOpacityChange(Number(event.target.value))}
          />
        </label>
        <div className="button-grid">
          <button disabled={!focusedPatchId || isAnalyzing} type="button" onClick={onAnalyzeFocusedPatch}>
            현재 Patch만 재분석
          </button>
          <button disabled={!focusedPatchId} type="button" onClick={onDeleteAllPatchOverlays}>
            해당 Patch 전체 세그먼트 제거
          </button>
        </div>
      </div>
    </section>
  );
}

export default ControlPanel;
