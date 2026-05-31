import type { ChangeEvent } from "react";
import type { AnalyzeOptions, LineOrientation, ViewMode } from "../types";

type ControlPanelProps = {
  hasImage: boolean;
  placementMode: LineOrientation | null;
  deleteMode: boolean;
  selectPatchMode: boolean;
  viewMode: ViewMode;
  focusedPatchId: string | null;
  effectiveSelectedPatchCount: number;
  focusedPatchPosition: number | null;
  isAnalyzing: boolean;
  globalAnalysisOptions: AnalyzeOptions;
  patchAnalysisOptions: AnalyzeOptions;
  overlayOpacity: number;
  currentManualCount: string;
  onFileChange: (file: File | null) => void;
  onGlobalAnalysisOptionsChange: (options: AnalyzeOptions) => void;
  onPatchAnalysisOptionsChange: (options: AnalyzeOptions) => void;
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
  onCurrentManualCountChange: (value: string) => void;
};

function ControlPanel({
  hasImage,
  placementMode,
  deleteMode,
  selectPatchMode,
  viewMode,
  focusedPatchId,
  effectiveSelectedPatchCount,
  focusedPatchPosition,
  isAnalyzing,
  globalAnalysisOptions,
  patchAnalysisOptions,
  overlayOpacity,
  currentManualCount,
  onFileChange,
  onGlobalAnalysisOptionsChange,
  onPatchAnalysisOptionsChange,
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
  onAnalyzeFocusedPatch,
  onCurrentManualCountChange
}: ControlPanelProps) {
  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    onFileChange(file);
    event.target.value = "";
  }

  function handleNumberOption<K extends keyof AnalyzeOptions>(
    key: K,
    fallback: number,
    options: AnalyzeOptions,
    onChange: (options: AnalyzeOptions) => void
  ) {
    return (event: ChangeEvent<HTMLInputElement>) => {
      const rawValue = event.target.value;
      const parsed = rawValue === "" ? fallback : Number(rawValue);
      onChange({
        ...options,
        [key]: Number.isNaN(parsed) ? fallback : parsed
      });
    };
  }

  function displayIntegerValue(value: number | undefined): string {
    return value && value > 0 ? String(value) : "";
  }

  function renderAnalysisInputs(
    options: AnalyzeOptions,
    onChange: (options: AnalyzeOptions) => void,
    scopeLabel: string
  ) {
    return (
      <div className="panel-block">
        <p className="panel-label">{scopeLabel}</p>
        <div className="input-grid">
          <label>
            Prob
            <input
              aria-label={`${scopeLabel} probability threshold`}
              inputMode="decimal"
              max={1}
              min={0}
              step={0.05}
              type="number"
              value={options.probThresh ?? 0.5}
              onChange={handleNumberOption("probThresh", 0.5, options, onChange)}
            />
          </label>
          <label>
            NMS
            <input
              aria-label={`${scopeLabel} NMS threshold`}
              inputMode="decimal"
              max={1}
              min={0}
              step={0.05}
              type="number"
              value={options.nmsThresh ?? 0.4}
              onChange={handleNumberOption("nmsThresh", 0.4, options, onChange)}
            />
          </label>
          <label>
            Min area
            <input
              aria-label={`${scopeLabel} minimum area`}
              inputMode="numeric"
              placeholder="0"
              min={0}
              step={1}
              type="number"
              value={displayIntegerValue(options.minArea)}
              onChange={(event) => {
                const rawValue = event.target.value.trim();
                onChange({
                  ...options,
                  minArea: rawValue === "" ? 0 : Math.max(0, Number.parseInt(rawValue, 10) || 0)
                });
              }}
            />
          </label>
          <label>
            Max area
            <input
              aria-label={`${scopeLabel} maximum area`}
              inputMode="numeric"
              placeholder="0"
              min={0}
              step={1}
              type="number"
              value={displayIntegerValue(options.maxArea)}
              onChange={(event) => {
                const rawValue = event.target.value.trim();
                onChange({
                  ...options,
                  maxArea: rawValue === "" ? undefined : Math.max(0, Number.parseInt(rawValue, 10) || 0)
                });
              }}
            />
          </label>
        </div>
      </div>
    );
  }

  return (
    <section className="panel">
      <div className="panel-block">
        <p className="panel-label">Upload</p>
        <label className="file-picker">
          <input accept=".png,.jpg,.jpeg,.tif,.tiff" aria-label="Upload image" type="file" onChange={handleUpload} />
          <span>Select png / jpg / tiff</span>
        </label>
      </div>

      {viewMode === "full" ? (
        <>
          <div className="panel-block">
            <p className="panel-label">Global controls</p>
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
              {effectiveSelectedPatchCount > 0
                ? `${effectiveSelectedPatchCount} selected patches will be used for global analysis.`
                : "No image loaded yet."}
            </p>
          </div>

          {renderAnalysisInputs(globalAnalysisOptions, onGlobalAnalysisOptionsChange, "Global analysis options")}

          <div className="panel-block">
            <p className="panel-label">Run</p>
            <button className="primary-button" disabled={!hasImage || isAnalyzing} type="button" onClick={onAnalyze}>
              {isAnalyzing ? "Analyzing..." : effectiveSelectedPatchCount > 0 ? "Run selected patches" : "Run all patches"}
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="panel-block">
            <p className="panel-label">Patch navigation</p>
            <div className="button-grid">
              <button type="button" onClick={onReturnToFullView}>
                전체 이미지 보기
              </button>
              <button disabled={!focusedPatchId} type="button" onClick={onFocusPreviousPatch}>
                이전 patch
              </button>
              <button disabled={!focusedPatchId} type="button" onClick={onFocusNextPatch}>
                다음 patch
              </button>
            </div>
            {viewMode === "patch" && focusedPatchId ? (
              <p className="helper-copy">
                {focusedPatchId}
                {focusedPatchPosition !== null ? ` • ${focusedPatchPosition} / ${effectiveSelectedPatchCount}` : ""}
              </p>
            ) : null}
          </div>

          {renderAnalysisInputs(patchAnalysisOptions, onPatchAnalysisOptionsChange, "Patch analysis options")}

          <div className="panel-block">
            <p className="panel-label">Patch actions</p>
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
            <label>
              못센 객체 개수
              <input
                aria-label="Manual missed count"
                inputMode="numeric"
                placeholder="0"
                type="number"
                value={currentManualCount}
                onChange={(event) => onCurrentManualCountChange(event.target.value)}
              />
            </label>
            <div className="button-grid">
              <button className="primary-button" disabled={!focusedPatchId || isAnalyzing} type="button" onClick={onAnalyzeFocusedPatch}>
                현재 Patch만 재분석
              </button>
              <button className={deleteMode ? "danger" : ""} disabled={!focusedPatchId} type="button" onClick={onToggleDeleteMode}>
                {deleteMode ? "Delete mode on" : "Delete overlay"}
              </button>
              <button disabled={!focusedPatchId} type="button" onClick={onDeleteAllPatchOverlays}>
                해당 Patch 전체 세그먼트 제거
              </button>
              <button disabled={!focusedPatchId} type="button" onClick={onResetDeletedOverlays}>
                Reset deleted overlays
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default ControlPanel;
