from __future__ import annotations

from functools import lru_cache

import numpy as np


@lru_cache(maxsize=1)
def get_model():
    try:
        from csbdeep.utils import normalize
        from stardist.models import StarDist2D
    except Exception as exc:  # pragma: no cover - exercised indirectly
        raise RuntimeError(
            "StarDist dependencies are not available. Install backend requirements before running analysis."
        ) from exc

    model = StarDist2D.from_pretrained("2D_versatile_fluo")
    return model, normalize


def analyze_patch_image(image: np.ndarray) -> np.ndarray:
    model, normalize = get_model()
    labels, _details = model.predict_instances(normalize(image))
    return labels
