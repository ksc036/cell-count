import { describe, expect, it } from "vitest";
import { buildPatches } from "./patches";

describe("buildPatches", () => {
  it("creates a single patch when there are no divider lines", () => {
    const patches = buildPatches(100, 80, []);
    expect(patches).toEqual([
      {
        id: "R1C1",
        rowIndex: 0,
        columnIndex: 0,
        x: 0,
        y: 0,
        width: 100,
        height: 80,
        label: "R1C1"
      }
    ]);
  });

  it("builds a grid from horizontal and vertical lines", () => {
    const patches = buildPatches(100, 80, [
      { id: "h1", orientation: "horizontal", position: 50 },
      { id: "v1", orientation: "vertical", position: 25 },
      { id: "v2", orientation: "vertical", position: 60 }
    ]);

    expect(patches.map((patch) => patch.label)).toEqual(["R1C1", "R1C2", "R1C3", "R2C1", "R2C2", "R2C3"]);
    expect(patches[1]).toMatchObject({
      x: 25,
      y: 0,
      width: 35,
      height: 50
    });
    expect(patches[5]).toMatchObject({
      x: 60,
      y: 50,
      width: 40,
      height: 30
    });
  });
});
