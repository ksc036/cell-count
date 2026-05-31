from __future__ import annotations

from typing import Optional

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


class AnalyzeOptions(BaseModel):
    model_name: Optional[str] = Field(default=None, alias="modelName")
    channel_mode: str = Field(default="average", alias="channelMode")
    prob_thresh: float = Field(default=0.5, alias="probThresh")
    nms_thresh: float = Field(default=0.4, alias="nmsThresh")
    min_area: int = Field(default=0, alias="minArea")
    max_area: Optional[int] = Field(default=None, alias="maxArea")


class AnalyzeMetadata(BaseModel):
    patches: list[PatchMetadata]
    options: AnalyzeOptions = Field(default_factory=AnalyzeOptions)


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
