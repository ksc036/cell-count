from __future__ import annotations

import json

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from .contours import overlays_from_labels
from .image_io import load_patch_image
from .inference import analyze_patch_image
from .schemas import AnalyzeMetadata, AnalyzeResponse, PatchResult

app = FastAPI(title="StarDist Cell Count API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
async def analyze(request: Request) -> AnalyzeResponse:
    form = await request.form()
    metadata_raw = form.get("metadata")
    if not isinstance(metadata_raw, str):
        raise HTTPException(status_code=400, detail="metadata form field is required.")

    try:
        metadata = AnalyzeMetadata.model_validate(json.loads(metadata_raw))
    except Exception as exc:
        raise HTTPException(status_code=400, detail="metadata must be valid JSON.") from exc

    patch_results: list[PatchResult] = []

    for patch in metadata.patches:
        upload = form.get(patch.file_field)
        if upload is None or not hasattr(upload, "read"):
            raise HTTPException(status_code=400, detail=f"Missing patch file for {patch.patch_id}.")

        file_bytes = await upload.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail=f"Patch file for {patch.patch_id} is empty.")

        try:
            image = load_patch_image(file_bytes, upload.filename or patch.file_field)
            labels = analyze_patch_image(image)
            overlays = overlays_from_labels(labels)
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        patch_results.append(PatchResult(patchId=patch.patch_id, overlays=overlays))

    return AnalyzeResponse(patchResults=patch_results)
