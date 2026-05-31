import { useEffect, useMemo, useState } from "react";
import ControlPanel from "./components/ControlPanel";
import ImageCanvas from "./components/ImageCanvas";
import PatchSummary from "./components/PatchSummary";
import { analyzePatches } from "./lib/api";
import { createPatchUploads } from "./lib/cropImage";
import { buildPatches } from "./lib/patches";
import {
  collectPatchOverlayIds,
  flattenOverlayMap,
  mergePatchResultsByPatch,
  replaceOverlayMap,
  summarizePatchCounts,
  summarizeTotals
} from "./lib/overlays";
import type { AnalyzeOptions, DividerLine, LineOrientation, OverlayMap, ViewMode } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

type ImageState = {
  file: File;
  url: string;
  width: number;
  height: number;
};

function nextLineId() {
  return `line-${crypto.randomUUID()}`;
}

function nextOrientation(mode: LineOrientation | null): LineOrientation | null {
  return mode;
}

async function loadImageState(file: File): Promise<ImageState> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await img.decode();
  return {
    file,
    url,
    width: img.naturalWidth,
    height: img.naturalHeight
  };
}

async function loadHtmlImage(url: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

function getPatchById(patches: ReturnType<typeof buildPatches>, patchId: string | null) {
  if (!patchId) {
    return null;
  }
  return patches.find((patch) => patch.id === patchId) ?? null;
}

function App() {
  const [imageState, setImageState] = useState<ImageState | null>(null);
  const [lines, setLines] = useState<DividerLine[]>([]);
  const [placementMode, setPlacementMode] = useState<LineOrientation | null>(null);
  const [previewPosition, setPreviewPosition] = useState<number | null>(null);
  const [overlayMap, setOverlayMap] = useState<OverlayMap>({});
  const [deletedOverlayIds, setDeletedOverlayIds] = useState<Set<string>>(new Set());
  const [manualCounts, setManualCounts] = useState<Record<string, number>>({});
  const [hoveredOverlayId, setHoveredOverlayId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectPatchMode, setSelectPatchMode] = useState(false);
  const [selectedPatchIds, setSelectedPatchIds] = useState<Set<string>>(new Set());
  const [analyzedPatchIds, setAnalyzedPatchIds] = useState<Set<string>>(new Set());
  const [hoveredPatchId, setHoveredPatchId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("full");
  const [focusedPatchId, setFocusedPatchId] = useState<string | null>(null);
  const [lastFocusedPatchId, setLastFocusedPatchId] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.22);
  const [globalAnalysisOptions, setGlobalAnalysisOptions] = useState<AnalyzeOptions>({
    probThresh: 0.5,
    nmsThresh: 0.4,
    minArea: 0
  });
  const [patchAnalysisOptionsById, setPatchAnalysisOptionsById] = useState<Record<string, AnalyzeOptions>>({});

  function resetAnalysisState() {
    setOverlayMap({});
    setDeletedOverlayIds(new Set());
    setManualCounts({});
    setHoveredOverlayId(null);
    setAnalyzedPatchIds(new Set());
    setPatchAnalysisOptionsById({});
  }

  const patches = useMemo(() => {
    if (!imageState) {
      return [];
    }
    return buildPatches(imageState.width, imageState.height, lines);
  }, [imageState, lines]);

  const flatOverlays = useMemo(() => flattenOverlayMap(overlayMap), [overlayMap]);
  const activeOverlays = useMemo(
    () => flatOverlays.filter((overlay) => !deletedOverlayIds.has(overlay.globalId)),
    [flatOverlays, deletedOverlayIds]
  );

  const focusedPatch = useMemo(() => getPatchById(patches, focusedPatchId), [patches, focusedPatchId]);

  const patchCounts = useMemo(
    () => summarizePatchCounts(patches, overlayMap, deletedOverlayIds, manualCounts),
    [patches, overlayMap, deletedOverlayIds, manualCounts]
  );
  const totalCounts = useMemo(() => summarizeTotals(patchCounts), [patchCounts]);
  const effectiveSelectedPatches = useMemo(
    () => (selectedPatchIds.size > 0 ? patches.filter((patch) => selectedPatchIds.has(patch.id)) : patches),
    [patches, selectedPatchIds]
  );
  const effectiveSelectedPatchCount = effectiveSelectedPatches.length;
  const analyzedPatches = useMemo(
    () => patches.filter((patch) => analyzedPatchIds.has(patch.id)),
    [patches, analyzedPatchIds]
  );
  const navigablePatches = useMemo(
    () => effectiveSelectedPatches.filter((patch) => analyzedPatchIds.has(patch.id)),
    [effectiveSelectedPatches, analyzedPatchIds]
  );
  const focusedPatchPosition = useMemo(() => {
    if (!focusedPatchId) {
      return null;
    }
    const currentIndex = navigablePatches.findIndex((patch) => patch.id === focusedPatchId);
    return currentIndex === -1 ? null : currentIndex + 1;
  }, [focusedPatchId, navigablePatches]);
  const focusedPatchAnalysisOptions = useMemo(() => {
    if (!focusedPatchId) {
      return globalAnalysisOptions;
    }
    return {
      ...globalAnalysisOptions,
      ...(patchAnalysisOptionsById[focusedPatchId] ?? {})
    };
  }, [focusedPatchId, globalAnalysisOptions, patchAnalysisOptionsById]);
  const currentManualCount = focusedPatchId ? String(manualCounts[focusedPatchId] ?? "") : "";
  const displayedManualCount = viewMode === "full" ? String(totalCounts.manualAddedCount || "") : currentManualCount;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }

      if (viewMode === "full") {
        if (event.key === "Escape") {
          event.preventDefault();
          setPlacementMode(null);
          setPreviewPosition(null);
          setDeleteMode(false);
          setSelectPatchMode(false);
          setHoveredPatchId(null);
          return;
        }

        if (event.code === "KeyR" || event.key.toLowerCase() === "r") {
          event.preventDefault();
          void handleAnalyze();
          return;
        }

        if (event.code === "KeyH" || event.key.toLowerCase() === "h") {
          event.preventDefault();
          setDeleteMode(false);
          setSelectPatchMode(false);
          setPlacementMode((current) => (current === "horizontal" ? null : "horizontal"));
          return;
        }

        if (event.code === "KeyV" || event.key.toLowerCase() === "v") {
          event.preventDefault();
          setDeleteMode(false);
          setSelectPatchMode(false);
          setPlacementMode((current) => (current === "vertical" ? null : "vertical"));
          return;
        }
      }

      const isToggleFullViewKey = event.code === "KeyF" || event.key.toLowerCase() === "f";

      if (isToggleFullViewKey) {
        event.preventDefault();
        if (viewMode === "patch") {
          setViewMode("full");
          setFocusedPatchId(null);
          return;
        }

        const fallbackPatch = navigablePatches[0] ?? effectiveSelectedPatches[0] ?? patches[0] ?? null;
        const nextPatch =
          navigablePatches.find((patch) => patch.id === lastFocusedPatchId) ??
          effectiveSelectedPatches.find((patch) => patch.id === lastFocusedPatchId) ??
          patches.find((patch) => patch.id === lastFocusedPatchId) ??
          fallbackPatch;

        if (nextPatch) {
          setViewMode("patch");
          setFocusedPatchId(nextPatch.id);
          setLastFocusedPatchId(nextPatch.id);
        }
        return;
      }

      if (viewMode !== "patch") {
        return;
      }
      if (event.code === "KeyR" || event.key.toLowerCase() === "r") {
        event.preventDefault();
        void handleAnalyzeFocusedPatch();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        handleFocusSiblingPatch("previous");
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        handleFocusSiblingPatch("next");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewMode, lastFocusedPatchId, navigablePatches, effectiveSelectedPatches, patches, handleAnalyze, handleAnalyzeFocusedPatch]);

  async function handleFileChange(file: File | null) {
    if (!file) {
      return;
    }

    try {
      setErrorMessage(null);
      if (imageState) {
        URL.revokeObjectURL(imageState.url);
      }
      const nextImageState = await loadImageState(file);
      setImageState(nextImageState);
      setLines([]);
      setPlacementMode(null);
      setPreviewPosition(null);
      resetAnalysisState();
      setDeleteMode(false);
      setSelectPatchMode(false);
      setSelectedPatchIds(new Set());
      setHoveredPatchId(null);
      setViewMode("full");
      setFocusedPatchId(null);
      setLastFocusedPatchId(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load the selected image.");
    }
  }

  function handleCommitLine(position: number) {
    const orientation = nextOrientation(placementMode);
    if (!orientation) {
      return;
    }
    resetAnalysisState();
    setSelectedPatchIds(new Set());
    setViewMode("full");
    setFocusedPatchId(null);
    setLastFocusedPatchId(null);
    setLines((current) => [...current, { id: nextLineId(), orientation, position }]);
  }

  async function analyzeTargetPatches(targetPatches: typeof patches, options: AnalyzeOptions, replaceAll = false) {
    if (!imageState) {
      setErrorMessage("Upload an image before running analysis.");
      return;
    }
    if (targetPatches.length === 0) {
      setErrorMessage("Choose at least one patch to analyze.");
      return;
    }

    setPlacementMode(null);
    setPreviewPosition(null);
    setDeleteMode(false);
    setSelectPatchMode(false);
    setHoveredPatchId(null);
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const sourceImage = await loadHtmlImage(imageState.url);
      const uploads = await createPatchUploads(sourceImage, targetPatches);
      const response = await analyzePatches(API_BASE_URL, uploads, options);
      const incomingOverlayMap = mergePatchResultsByPatch(patches, response.patchResults);
      const returnedPatchIds = response.patchResults.map((result) => result.patchId);
      setOverlayMap((current) => (replaceAll ? incomingOverlayMap : replaceOverlayMap(current, incomingOverlayMap)));
      setDeletedOverlayIds((current) => {
        if (replaceAll) {
          return new Set();
        }
        const next = new Set(current);
        for (const patchId of returnedPatchIds) {
          for (const overlayId of collectPatchOverlayIds(overlayMap, patchId)) {
            next.delete(overlayId);
          }
        }
        return next;
      });
      setAnalyzedPatchIds((current) => (replaceAll ? new Set(returnedPatchIds) : new Set([...current, ...returnedPatchIds])));
      setHoveredOverlayId(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Patch analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleAnalyze() {
    await analyzeTargetPatches(effectiveSelectedPatches, globalAnalysisOptions, selectedPatchIds.size > 0);
  }

  async function handleAnalyzeFocusedPatch() {
    const patch = getPatchById(patches, focusedPatchId);
    if (!patch) {
      setErrorMessage("Open a patch detail view before re-analyzing a single patch.");
      return;
    }
    await analyzeTargetPatches([patch], focusedPatchAnalysisOptions);
  }

  function handleDeleteOverlay(globalId: string) {
    setDeletedOverlayIds((current) => new Set([...current, globalId]));
    setHoveredOverlayId(null);
  }

  function handleManualCountChange(patchId: string, value: number) {
    setManualCounts((current) => ({
      ...current,
      [patchId]: value
    }));
  }

  function handlePlacementModeChange(mode: LineOrientation | null) {
    setDeleteMode(false);
    setSelectPatchMode(false);
    setPlacementMode(mode);
  }

  function handleToggleDeleteMode() {
    setPlacementMode(null);
    setSelectPatchMode(false);
    setDeleteMode((current) => !current);
  }

  function handleClearLines() {
    setLines([]);
    resetAnalysisState();
    setSelectedPatchIds(new Set());
    setViewMode("full");
    setFocusedPatchId(null);
    setLastFocusedPatchId(null);
  }

  function handleTogglePatchSelectionMode() {
    setPlacementMode(null);
    setDeleteMode(false);
    setSelectPatchMode((current) => !current);
    setHoveredPatchId(null);
  }

  function handlePatchToggle(patchId: string) {
    setSelectedPatchIds((current) => {
      const next = new Set(current);
      if (next.has(patchId)) {
        next.delete(patchId);
      } else {
        next.add(patchId);
      }
      return next;
    });
  }

  function handleFocusPatch(patchId: string) {
    setViewMode("patch");
    setFocusedPatchId(patchId);
    setLastFocusedPatchId(patchId);
    setDeleteMode(false);
    setSelectPatchMode(false);
  }

  function handleReturnToFullView() {
    setViewMode("full");
    setFocusedPatchId(null);
  }

  function handleFocusSiblingPatch(direction: "previous" | "next") {
    if (!focusedPatchId || navigablePatches.length === 0) {
      return;
    }
    const currentIndex = navigablePatches.findIndex((patch) => patch.id === focusedPatchId);
    if (currentIndex === -1) {
      setFocusedPatchId(navigablePatches[0].id);
      return;
    }
    const nextIndex =
      direction === "previous"
        ? (currentIndex - 1 + navigablePatches.length) % navigablePatches.length
        : (currentIndex + 1) % navigablePatches.length;
    setFocusedPatchId(navigablePatches[nextIndex].id);
    setLastFocusedPatchId(navigablePatches[nextIndex].id);
  }

  function handleDeleteAllPatchOverlays(patchId: string) {
    const overlayIds = collectPatchOverlayIds(overlayMap, patchId);
    setDeletedOverlayIds((current) => new Set([...current, ...overlayIds]));
  }

  function handleFocusedPatchAnalysisOptionsChange(options: AnalyzeOptions) {
    if (!focusedPatchId) {
      return;
    }
    setPatchAnalysisOptionsById((current) => ({
      ...current,
      [focusedPatchId]: options
    }));
  }

  function handleCurrentManualCountChange(value: string) {
    if (!focusedPatchId) {
      return;
    }
    const trimmed = value.trim();
    setManualCounts((current) => {
      if (trimmed === "") {
        const next = { ...current };
        delete next[focusedPatchId];
        return next;
      }
      const parsed = Number.parseInt(trimmed, 10);
      return {
        ...current,
        [focusedPatchId]: Number.isNaN(parsed) || parsed < 0 ? 0 : parsed
      };
    });
  }

  return (
    <main className="layout">
      <section className="workspace-panel">
        <div className="workspace-header">
          <div>
            <p className="eyebrow">Patch-aware StarDist workflow</p>
            <h1>Cell Count Review Studio</h1>
          </div>
          <div className="workspace-status">
            <div className="badge-strip">
              <span>{patches.length} patches</span>
              <span>{effectiveSelectedPatchCount} selected</span>
              {focusedPatchId && focusedPatchPosition !== null ? (
                <span>{focusedPatchPosition} / {navigablePatches.length || effectiveSelectedPatchCount}</span>
              ) : null}
            </div>
            <div className="manual-count-inline">
              <label className="manual-count-field">
                자동 세그먼트 개수
                <input aria-label="Automatic segment count" disabled readOnly type="text" value={String(activeOverlays.length)} />
              </label>
              <label className="manual-count-field">
                못센 객체개수
                <input
                  aria-label={viewMode === "full" ? "Total manual missed count" : "Inline manual missed count"}
                  disabled={viewMode === "full" || !focusedPatchId}
                  inputMode="numeric"
                  placeholder="0"
                  type="number"
                  value={displayedManualCount}
                  onChange={(event) => handleCurrentManualCountChange(event.target.value)}
                />
              </label>
            </div>
          </div>
        </div>

        <ImageCanvas
          imageState={imageState}
          lines={lines}
          patches={patches}
          overlays={activeOverlays}
          placementMode={placementMode}
          previewPosition={previewPosition}
          deleteMode={deleteMode}
          selectPatchMode={selectPatchMode}
          selectedPatchIds={selectedPatchIds}
          hoveredPatchId={hoveredPatchId}
          hoveredOverlayId={hoveredOverlayId}
          viewMode={viewMode}
          focusedPatch={focusedPatch}
          overlayOpacity={overlayOpacity}
          onPreviewChange={setPreviewPosition}
          onCommitLine={handleCommitLine}
          onOverlayHover={setHoveredOverlayId}
          onOverlayDelete={handleDeleteOverlay}
          onPatchHover={setHoveredPatchId}
          onPatchToggle={handlePatchToggle}
          onPatchFocus={handleFocusPatch}
        />
      </section>

      <aside className="sidebar">
        <ControlPanel
          hasImage={Boolean(imageState)}
          placementMode={placementMode}
          deleteMode={deleteMode}
          selectPatchMode={selectPatchMode}
          viewMode={viewMode}
          focusedPatchId={focusedPatchId}
          effectiveSelectedPatchCount={effectiveSelectedPatchCount}
          focusedPatchPosition={focusedPatchPosition}
          isAnalyzing={isAnalyzing}
          globalAnalysisOptions={globalAnalysisOptions}
          patchAnalysisOptions={focusedPatchAnalysisOptions}
          overlayOpacity={overlayOpacity}
          currentManualCount={currentManualCount}
          onFileChange={handleFileChange}
          onGlobalAnalysisOptionsChange={setGlobalAnalysisOptions}
          onPatchAnalysisOptionsChange={handleFocusedPatchAnalysisOptionsChange}
          onPlacementModeChange={handlePlacementModeChange}
          onToggleDeleteMode={handleToggleDeleteMode}
          onTogglePatchSelectionMode={handleTogglePatchSelectionMode}
          onClearLines={handleClearLines}
          onResetDeletedOverlays={() => setDeletedOverlayIds(new Set())}
          onAnalyze={handleAnalyze}
          onOverlayOpacityChange={setOverlayOpacity}
          onReturnToFullView={handleReturnToFullView}
          onFocusPreviousPatch={() => handleFocusSiblingPatch("previous")}
          onFocusNextPatch={() => handleFocusSiblingPatch("next")}
          onDeleteAllPatchOverlays={
            focusedPatchId ? () => handleDeleteAllPatchOverlays(focusedPatchId) : undefined
          }
          onAnalyzeFocusedPatch={focusedPatchId ? handleAnalyzeFocusedPatch : undefined}
          onCurrentManualCountChange={handleCurrentManualCountChange}
        />

        {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

        <PatchSummary
          patches={analyzedPatches}
          patchCounts={patchCounts}
          totalCounts={totalCounts}
          manualCounts={manualCounts}
          onManualCountChange={handleManualCountChange}
          onPatchOpen={handleFocusPatch}
        />
      </aside>
    </main>
  );
}

export default App;
