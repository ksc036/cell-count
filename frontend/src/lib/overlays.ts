import type {
  GlobalOverlay,
  OverlayMap,
  Patch,
  PatchAnalysisResult,
  PatchCountSummary,
  PatchLocalOverlay,
  TotalCountSummary
} from "../types";

function translatePoint(x: number, y: number, patch: Patch) {
  return {
    x: x + patch.x,
    y: y + patch.y
  };
}

export function toGlobalOverlay(patch: Patch, overlay: PatchLocalOverlay): GlobalOverlay {
  return {
    globalId: `${patch.id}:${overlay.id}`,
    patchId: patch.id,
    sourceOverlayId: overlay.id,
    contour: overlay.contour.map((point) => translatePoint(point.x, point.y, patch)),
    bbox: {
      x: overlay.bbox.x + patch.x,
      y: overlay.bbox.y + patch.y,
      width: overlay.bbox.width,
      height: overlay.bbox.height
    },
    centroid: translatePoint(overlay.centroid.x, overlay.centroid.y, patch)
  };
}

export function mergePatchResults(patches: Patch[], patchResults: PatchAnalysisResult[]): GlobalOverlay[] {
  const patchMap = new Map(patches.map((patch) => [patch.id, patch]));
  return patchResults.flatMap((result) => {
    const patch = patchMap.get(result.patchId);
    if (!patch) {
      return [];
    }
    return result.overlays.map((overlay) => toGlobalOverlay(patch, overlay));
  });
}

export function mergePatchResultsByPatch(patches: Patch[], patchResults: PatchAnalysisResult[]): OverlayMap {
  return patchResults.reduce<OverlayMap>((accumulator, result) => {
    accumulator[result.patchId] = mergePatchResults(patches, [result]);
    return accumulator;
  }, {});
}

export function replaceOverlayMap(existing: OverlayMap, incoming: OverlayMap): OverlayMap {
  return {
    ...existing,
    ...incoming
  };
}

export function flattenOverlayMap(overlayMap: OverlayMap): GlobalOverlay[] {
  return Object.values(overlayMap).flat();
}

export function collectPatchOverlayIds(overlayMap: OverlayMap, patchId: string): string[] {
  return (overlayMap[patchId] ?? []).map((overlay) => overlay.globalId);
}

export function summarizePatchCounts(
  patches: Patch[],
  overlayMap: OverlayMap,
  deletedOverlayIds: Set<string>,
  manualCounts: Record<string, number>
): PatchCountSummary[] {
  return patches.map((patch) => {
    const automaticCount = (overlayMap[patch.id] ?? []).filter((overlay) => !deletedOverlayIds.has(overlay.globalId)).length;
    const manualAddedCount = manualCounts[patch.id] ?? 0;
    return {
      patchId: patch.id,
      automaticCount,
      manualAddedCount,
      finalCount: automaticCount + manualAddedCount
    };
  });
}

export function summarizeTotals(patchCounts: PatchCountSummary[]): TotalCountSummary {
  return patchCounts.reduce(
    (totals, patchCount) => ({
      automaticCount: totals.automaticCount + patchCount.automaticCount,
      manualAddedCount: totals.manualAddedCount + patchCount.manualAddedCount,
      finalCount: totals.finalCount + patchCount.finalCount
    }),
    {
      automaticCount: 0,
      manualAddedCount: 0,
      finalCount: 0
    }
  );
}
