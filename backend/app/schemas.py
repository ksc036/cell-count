from __future__ import annotations

from pydantic import BaseModel, Field


class Point(BaseModel):
    x: float
    y: float


class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float


class PatchMetadata(BaseModel):
    patch_id: str = Field(alias="patchId")
    x: int
    y: int
    width: int
    height: int
    file_field: str = Field(alias="fileField")


class AnalyzeMetadata(BaseModel):
    patches: list[PatchMetadata]


class PatchOverlay(BaseModel):
    id: str
    contour: list[Point]
    bbox: BoundingBox
    centroid: Point


class PatchResult(BaseModel):
    patch_id: str = Field(alias="patchId")
    overlays: list[PatchOverlay]


class AnalyzeResponse(BaseModel):
    patch_results: list[PatchResult] = Field(alias="patchResults")
