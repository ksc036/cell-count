from __future__ import annotations

import io
import json

import numpy as np
from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def png_bytes() -> bytes:
    try:
        from PIL import Image
    except Exception as exc:  # pragma: no cover
        raise AssertionError("Pillow must be installed for tests") from exc

    image = Image.fromarray(np.zeros((8, 8), dtype=np.uint8))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def test_health() -> None:
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_requires_metadata() -> None:
    response = client.post("/api/analyze", files={})
    assert response.status_code == 400
    assert response.json()["detail"] == "metadata form field is required."


def test_analyze_returns_patch_results(monkeypatch) -> None:
    def fake_analyze_patch_image(
        image: np.ndarray,
        model_name: str | None = None,
        channel_mode: str = "average",
        prob_thresh: float = 0.5,
        nms_thresh: float = 0.4,
    ) -> np.ndarray:
        labels = np.zeros_like(image, dtype=np.uint16)
        labels[1:4, 1:4] = 1
        return labels

    monkeypatch.setattr("app.main.analyze_patch_image", fake_analyze_patch_image)

    metadata = {
        "patches": [
            {
                "patchId": "R1C1",
                "x": 0,
                "y": 0,
                "width": 8,
                "height": 8,
                "fileField": "patch_R1C1",
            }
        ]
    }

    response = client.post(
        "/api/analyze",
        data={"metadata": json.dumps(metadata)},
        files={"patch_R1C1": ("R1C1.png", png_bytes(), "image/png")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["patchResults"][0]["patchId"] == "R1C1"
    assert len(body["patchResults"][0]["overlays"]) == 1
    overlay = body["patchResults"][0]["overlays"][0]
    assert overlay["id"] == "ov-1"
    assert overlay["bbox"]["width"] > 0
    assert len(overlay["contour"]) >= 4


def test_analyze_reports_missing_patch(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.main.analyze_patch_image",
        lambda image, model_name=None, channel_mode="average", prob_thresh=0.5, nms_thresh=0.4: image,
    )
    metadata = {
        "patches": [
            {
                "patchId": "R1C1",
                "x": 0,
                "y": 0,
                "width": 8,
                "height": 8,
                "fileField": "patch_R1C1",
            }
        ]
    }

    response = client.post("/api/analyze", data={"metadata": json.dumps(metadata)})
    assert response.status_code == 400
    assert response.json()["detail"] == "Missing patch file for R1C1."
