from __future__ import annotations

import cv2
import numpy as np

from .schemas import BoundingBox, PatchOverlay, Point


def _contour_points(contour: np.ndarray) -> list[Point]:
    return [Point(x=float(point[0][0]), y=float(point[0][1])) for point in contour]


def overlays_from_labels(labels: np.ndarray) -> list[PatchOverlay]:
    overlays: list[PatchOverlay] = []
    for object_id in [value for value in np.unique(labels) if value > 0]:
        mask = (labels == object_id).astype(np.uint8)
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            continue

        contour = max(contours, key=cv2.contourArea)
        x, y, width, height = cv2.boundingRect(contour)
        moments = cv2.moments(contour)
        if moments["m00"] == 0:
            centroid_x = x + width / 2.0
            centroid_y = y + height / 2.0
        else:
            centroid_x = moments["m10"] / moments["m00"]
            centroid_y = moments["m01"] / moments["m00"]

        overlays.append(
            PatchOverlay(
                id=f"ov-{int(object_id)}",
                contour=_contour_points(contour),
                bbox=BoundingBox(x=float(x), y=float(y), width=float(width), height=float(height)),
                centroid=Point(x=float(centroid_x), y=float(centroid_y)),
            )
        )

    return overlays
