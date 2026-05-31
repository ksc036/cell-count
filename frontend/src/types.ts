export type LineOrientation = "horizontal" | "vertical";

export type Point = {
  x: number;
  y: number;
};

export type BoundingBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type DividerLine = {
  id: string;
  orientation: LineOrientation;
  position: number;
};

export type Patch = {
  id: string;
  rowIndex: number;
  columnIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
};

export type PatchUpload = {
  patchId: string;
  fileField: string;
  file: File;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type AnalyzeOptions = {
  modelName?: string;
  channelMode?: "average" | "red" | "green" | "blue";
  probThresh?: number;
  nmsThresh?: number;
  minArea?: number;
  maxArea?: number;
};

export type PatchLocalOverlay = {
  id: string;
  contour: Point[];
  bbox: BoundingBox;
  centroid: Point;
};

export type GlobalOverlay = {
  globalId: string;
  patchId: string;
  sourceOverlayId: string;
  contour: Point[];
  bbox: BoundingBox;
  centroid: Point;
};

export type PatchAnalysisResult = {
  patchId: string;
  overlays: PatchLocalOverlay[];
};

export type AnalyzeResponse = {
  patchResults: PatchAnalysisResult[];
};

export type PatchCountSummary = {
  patchId: string;
  automaticCount: number;
  manualAddedCount: number;
  finalCount: number;
};

export type TotalCountSummary = {
  automaticCount: number;
  manualAddedCount: number;
  finalCount: number;
};
