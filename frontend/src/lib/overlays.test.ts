import { describe, expect, it } from "vitest";
import type { Patch, PatchAnalysisResult } from "../types";
import { mergePatchResults, summarizePatchCounts, summarizeTotals } from "./overlays";

const patches: Patch[] = [
  { id: "R1C1", rowIndex: 0, columnIndex: 0, x: 0, y: 0, width: 50, height: 50, label: "R1C1" },
  { id: "R1C2", rowIndex: 0, columnIndex: 1, x: 50, y: 0, width: 50, height: 50, label: "R1C2" }
];

const patchResults: PatchAnalysisResult[] = [
  {
    patchId: "R1C1",
    overlays: [
      {
        id: "ov-1",
        contour: [
          { x: 1, y: 1 },
          { x: 4, y: 1 },
          { x: 4, y: 4 }
        ],
        bbox: { x: 1, y: 1, width: 3, height: 3 },
        centroid: { x: 2, y: 2 }
      }
    ]
  },
  {
    patchId: "R1C2",
    overlays: [
      {
        id: "ov-2",
        contour: [
          { x: 2, y: 3 },
          { x: 5, y: 3 },
          { x: 5, y: 8 }
        ],
        bbox: { x: 2, y: 3, width: 3, height: 5 },
        centroid: { x: 4, y: 5 }
      }
    ]
  }
];

describe("overlay helpers", () => {
  it("translates patch-local overlays into global coordinates", () => {
    const overlays = mergePatchResults(patches, patchResults);
    expect(overlays[1]).toMatchObject({
      globalId: "R1C2:ov-2",
      patchId: "R1C2",
      centroid: { x: 54, y: 5 },
      bbox: { x: 52, y: 3, width: 3, height: 5 }
    });
  });

  it("recomputes counts using deleted overlays and manual additions", () => {
    const overlays = mergePatchResults(patches, patchResults);
    const patchCounts = summarizePatchCounts(patches, overlays, new Set(["R1C1:ov-1"]), {
      R1C1: 2,
      R1C2: 1
    });

    expect(patchCounts).toEqual([
      { patchId: "R1C1", automaticCount: 0, manualAddedCount: 2, finalCount: 2 },
      { patchId: "R1C2", automaticCount: 1, manualAddedCount: 1, finalCount: 2 }
    ]);
    expect(summarizeTotals(patchCounts)).toEqual({
      automaticCount: 1,
      manualAddedCount: 3,
      finalCount: 4
    });
  });
});
