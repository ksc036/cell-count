from __future__ import annotations

from io import BytesIO

import numpy as np
from PIL import Image
import tifffile


def load_patch_image(data: bytes, file_name: str) -> np.ndarray:
    suffix = file_name.lower().rsplit(".", 1)[-1] if "." in file_name else ""
    if suffix in {"tif", "tiff"}:
      image = tifffile.imread(BytesIO(data))
    else:
      image = np.array(Image.open(BytesIO(data)))

    if image.ndim == 2:
        return image
    if image.ndim == 3:
        return image[..., 0]
    raise ValueError("Unsupported patch image shape.")
