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
        with Image.open(BytesIO(data)) as pil_image:
            image = np.asarray(pil_image)

    image = np.squeeze(image)

    if image.ndim == 3 and image.shape[0] in (3, 4) and image.shape[-1] not in (3, 4):
        image = np.moveaxis(image, 0, -1)

    if image.ndim not in (2, 3):
        raise ValueError("Only 2D grayscale or 2D RGB images are supported.")

    if image.ndim == 3 and image.shape[-1] not in (1, 3, 4):
        raise ValueError("Only images with 1, 3, or 4 channels are supported.")

    return image
