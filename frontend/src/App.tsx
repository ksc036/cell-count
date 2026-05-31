import { useMemo, useState } from "react";
import ControlPanel from "./components/ControlPanel";
import ImageCanvas from "./components/ImageCanvas";
import PatchSummary from "./components/PatchSummary";
import { analyzePatches } from "./lib/api";
import { createPatchUploads } from "./lib/cropImage";
import { buildPatches } from "./lib/patches";
import { mergePatchResults, summarizePatchCounts, summarizeTotals } from "./lib/overlays";
import type { DividerLine, GlobalOverlay, LineOrientation } from "./types";

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

function App() {
  const [imageState, setImageState] = useState<ImageState | null>(null);
  const [lines, setLines] = useState<DividerLine[]>([]);
  const [placementMode, setPlacementMode] = useState<LineOrientation | null>(null);
  const [previewPosition, setPreviewPosition] = useState<number | null>(null);
  const [globalOverlays, setGlobalOverlays] = useState<GlobalOverlay[]>([]);
  const [deletedOverlayIds, setDeletedOverlayIds] = useState<Set<string>>(new Set());
  const [manualCounts, setManualCounts] = useState<Record<string, number>>({});
  const [hoveredOverlayId, setHoveredOverlayId] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function resetAnalysisState() {
    setGlobalOverlays([]);
    setDeletedOverlayIds(new Set());
    setManualCounts({});
    setHoveredOverlayId(null);
  }

  const patches = useMemo(() => {
    if (!imageState) {
      return [];
    }
    return buildPatches(imageState.width, imageState.height, lines);
  }, [imageState, lines]);

  const patchCounts = useMemo(
    () => summarizePatchCounts(patches, globalOverlays, deletedOverlayIds, manualCounts),
    [patches, globalOverlays, deletedOverlayIds, manualCounts]
  );
  const totalCounts = useMemo(() => summarizeTotals(patchCounts), [patchCounts]);

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
    setLines((current) => [...current, { id: nextLineId(), orientation, position }]);
  }

  async function handleAnalyze() {
    if (!imageState) {
      setErrorMessage("Upload an image before running analysis.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      const sourceImage = await loadHtmlImage(imageState.url);
      const uploads = await createPatchUploads(sourceImage, patches);
      const response = await analyzePatches(API_BASE_URL, uploads);
      setGlobalOverlays(mergePatchResults(patches, response.patchResults));
      setDeletedOverlayIds(new Set());
      setHoveredOverlayId(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Patch analysis failed.");
    } finally {
      setIsAnalyzing(false);
    }
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
    setPlacementMode(mode);
  }

  function handleToggleDeleteMode() {
    setPlacementMode(null);
    setDeleteMode((current) => !current);
  }

  function handleClearLines() {
    setLines([]);
    resetAnalysisState();
  }

  return (
    <main className="layout">
      <section className="workspace-panel">
        <div className="workspace-header">
          <div>
            <p className="eyebrow">Patch-aware StarDist workflow</p>
            <h1>Cell Count Review Studio</h1>
          </div>
          <div className="badge-strip">
            <span>{patches.length} patches</span>
            <span>{globalOverlays.length - deletedOverlayIds.size} active overlays</span>
          </div>
        </div>

        <ImageCanvas
          imageState={imageState}
          lines={lines}
          overlays={globalOverlays.filter((overlay) => !deletedOverlayIds.has(overlay.globalId))}
          placementMode={placementMode}
          previewPosition={previewPosition}
          deleteMode={deleteMode}
          hoveredOverlayId={hoveredOverlayId}
          onPreviewChange={setPreviewPosition}
          onCommitLine={handleCommitLine}
          onOverlayHover={setHoveredOverlayId}
          onOverlayDelete={handleDeleteOverlay}
        />
      </section>

      <aside className="sidebar">
        <ControlPanel
          hasImage={Boolean(imageState)}
          placementMode={placementMode}
          deleteMode={deleteMode}
          isAnalyzing={isAnalyzing}
          onFileChange={handleFileChange}
          onPlacementModeChange={handlePlacementModeChange}
          onToggleDeleteMode={handleToggleDeleteMode}
          onClearLines={handleClearLines}
          onResetDeletedOverlays={() => setDeletedOverlayIds(new Set())}
          onAnalyze={handleAnalyze}
        />

        {errorMessage ? <p className="error-banner">{errorMessage}</p> : null}

        <PatchSummary
          patches={patches}
          patchCounts={patchCounts}
          totalCounts={totalCounts}
          manualCounts={manualCounts}
          onManualCountChange={handleManualCountChange}
        />
      </aside>
    </main>
  );
}

export default App;
