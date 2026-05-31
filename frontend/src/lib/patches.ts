import type { DividerLine, Patch } from "../types";

function clampPositions(values: number[], max: number): number[] {
  return [...new Set(values.map((value) => Math.round(value)).filter((value) => value > 0 && value < max))].sort(
    (left, right) => left - right
  );
}

export function getLinePositions(lines: DividerLine[], orientation: DividerLine["orientation"]): number[] {
  return lines.filter((line) => line.orientation === orientation).map((line) => line.position);
}

export function buildPatches(imageWidth: number, imageHeight: number, lines: DividerLine[]): Patch[] {
  const xs = [0, ...clampPositions(getLinePositions(lines, "vertical"), imageWidth), imageWidth];
  const ys = [0, ...clampPositions(getLinePositions(lines, "horizontal"), imageHeight), imageHeight];
  const patches: Patch[] = [];

  for (let rowIndex = 0; rowIndex < ys.length - 1; rowIndex += 1) {
    for (let columnIndex = 0; columnIndex < xs.length - 1; columnIndex += 1) {
      const x = xs[columnIndex];
      const y = ys[rowIndex];
      const width = xs[columnIndex + 1] - x;
      const height = ys[rowIndex + 1] - y;
      const label = `R${rowIndex + 1}C${columnIndex + 1}`;
      patches.push({
        id: label,
        rowIndex,
        columnIndex,
        x,
        y,
        width,
        height,
        label
      });
    }
  }

  return patches;
}
