from __future__ import annotations

from functools import lru_cache
from typing import Optional

import numpy as np

FLUORESCENCE_MODELS = {
    "2D_versatile_fluo": "fluorescence",
}

HISTOLOGY_MODELS = {
    "2D_versatile_he": "he",
}

MODEL_OPTIONS = {
    **FLUORESCENCE_MODELS,
    **HISTOLOGY_MODELS,
}


@lru_cache(maxsize=1)
def get_model(model_name: str):
    try:
        from stardist.models import StarDist2D
    except Exception as exc:  # pragma: no cover - exercised indirectly
        raise RuntimeError(
            "StarDist dependencies are not available. Install backend requirements before running analysis."
        ) from exc

    return StarDist2D.from_pretrained(model_name)


def select_default_model(image: np.ndarray) -> str:
    if image.ndim == 3 and image.shape[-1] >= 3:
        rgb = image[..., :3]
        if np.array_equal(rgb[..., 0], rgb[..., 1]) and np.array_equal(rgb[..., 1], rgb[..., 2]):
            return "2D_versatile_fluo"
        return "2D_versatile_he"
    return "2D_versatile_fluo"


def prepare_image_for_model(image: np.ndarray, model_name: str, channel_mode: str = "average") -> np.ndarray:
    image = np.asarray(image)

    if model_name in HISTOLOGY_MODELS:
        if image.ndim == 2:
            image = np.stack([image, image, image], axis=-1)
        elif image.shape[-1] == 4:
            image = image[..., :3]
        return image.astype(np.float32, copy=False)

    if image.ndim == 2:
        return image.astype(np.float32, copy=False)

    if image.shape[-1] == 4:
        image = image[..., :3]

    if image.shape[-1] == 1:
        return image[..., 0].astype(np.float32, copy=False)

    if channel_mode == "average":
        return image[..., :3].mean(axis=-1, dtype=np.float32)

    channel_map = {
        "red": 0,
        "green": 1,
        "blue": 2,
    }
    return image[..., channel_map[channel_mode]].astype(np.float32, copy=False)


def normalize_for_model(image: np.ndarray) -> np.ndarray:
    try:
        from csbdeep.utils import normalize
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(
            "StarDist dependencies are not available. Install backend requirements before running analysis."
        ) from exc
    return normalize(image, 1, 99.8, axis=(0, 1))


def analyze_patch_image(
    image: np.ndarray,
    model_name: Optional[str] = None,
    channel_mode: str = "average",
    prob_thresh: float = 0.5,
    nms_thresh: float = 0.4,
) -> np.ndarray:
    chosen_model = model_name or select_default_model(image)
    if chosen_model not in MODEL_OPTIONS:
        raise ValueError(f"Unsupported model name: {chosen_model}")

    model = get_model(chosen_model)
    prepared = prepare_image_for_model(image, chosen_model, channel_mode)
    normalized = normalize_for_model(prepared)
    labels, _details = model.predict_instances(
        normalized,
        prob_thresh=float(prob_thresh),
        nms_thresh=float(nms_thresh),
    )
    return labels
