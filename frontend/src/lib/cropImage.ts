import type { Patch, PatchUpload } from "../types";

async function canvasToFile(canvas: HTMLCanvasElement, fileName: string): Promise<File> {
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) {
    throw new Error("Failed to create patch image blob.");
  }
  return new File([blob], fileName, { type: "image/png" });
}

export async function createPatchUploads(sourceImage: HTMLImageElement, patches: Patch[]): Promise<PatchUpload[]> {
  return Promise.all(
    patches.map(async (patch) => {
      const canvas = document.createElement("canvas");
      canvas.width = patch.width;
      canvas.height = patch.height;
      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Canvas 2D context is unavailable.");
      }
      context.drawImage(
        sourceImage,
        patch.x,
        patch.y,
        patch.width,
        patch.height,
        0,
        0,
        patch.width,
        patch.height
      );
      return {
        patchId: patch.id,
        fileField: `patch_${patch.id}`,
        file: await canvasToFile(canvas, `${patch.id}.png`),
        x: patch.x,
        y: patch.y,
        width: patch.width,
        height: patch.height
      };
    })
  );
}
