import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ImageCanvas from "./ImageCanvas";

describe("ImageCanvas", () => {
  it("commits a horizontal line using image coordinates", () => {
    const commitLine = vi.fn();
    render(
      <ImageCanvas
        deleteMode={false}
        hoveredOverlayId={null}
        imageState={{
          file: new File(["test"], "test.png"),
          url: "http://example.com/test.png",
          width: 200,
          height: 100
        }}
        lines={[]}
        overlays={[]}
        placementMode="horizontal"
        previewPosition={null}
        onCommitLine={commitLine}
        onOverlayDelete={vi.fn()}
        onOverlayHover={vi.fn()}
        onPreviewChange={vi.fn()}
      />
    );

    const stage = screen.getByLabelText("Image workspace");
    vi.spyOn(stage, "getBoundingClientRect").mockReturnValue({
      width: 400,
      height: 200,
      left: 0,
      top: 0,
      right: 400,
      bottom: 200,
      x: 0,
      y: 0,
      toJSON: () => ({})
    });

    fireEvent.click(stage, { clientX: 200, clientY: 50 });
    expect(commitLine).toHaveBeenCalledWith(25);
  });
});
