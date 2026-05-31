import type { AnalyzeOptions, AnalyzeResponse, PatchUpload } from "../types";

export async function analyzePatches(
  apiBaseUrl: string,
  patches: PatchUpload[],
  options: AnalyzeOptions = {}
): Promise<AnalyzeResponse> {
  const formData = new FormData();
  const metadata = {
    options: {
      modelName: options.modelName,
      channelMode: options.channelMode ?? "average",
      probThresh: options.probThresh ?? 0.5,
      nmsThresh: options.nmsThresh ?? 0.4,
      minArea: options.minArea ?? 0
    },
    patches: patches.map((patch) => ({
      patchId: patch.patchId,
      x: patch.x,
      y: patch.y,
      width: patch.width,
      height: patch.height,
      fileField: patch.fileField
    }))
  };

  formData.set("metadata", JSON.stringify(metadata));
  for (const patch of patches) {
    formData.set(patch.fileField, patch.file, patch.file.name);
  }

  const response = await fetch(`${apiBaseUrl}/api/analyze`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Patch analysis request failed.");
  }

  return (await response.json()) as AnalyzeResponse;
}
