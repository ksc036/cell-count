# StarDist Cell Count

Local web app for microscopy cell counting with patch-based StarDist analysis and client-side overlay correction.

## Structure

- `frontend`: React + TypeScript + Vite UI
- `backend`: FastAPI batch patch-analysis server
- `docs/superpowers/specs`: design docs
- `docs/superpowers/plans`: implementation plans

## Features

- Upload `png`, `jpg`, `jpeg`, `tif`, or `tiff` microscopy images
- Add horizontal and vertical divider lines directly on the image
- Compute patch rectangles in the client and crop patch images before upload
- Send all patches in one batch request to the FastAPI backend
- Run StarDist analysis per patch and return patch-local contours
- Merge contours back into original-image coordinates on the client
- Delete incorrect overlays in the browser without re-running analysis
- Enter manual additional cell counts per patch
- See automatic, manual, and final totals immediately

## One-command local run

```bash
./start-dev.sh
```

This starts:

- frontend: `http://127.0.0.1:5173`
- backend: `http://127.0.0.1:8000`

Press `Ctrl+C` to stop both processes together.

## Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server starts on `http://localhost:5173`.

## Backend setup

Create and activate a Python virtual environment if you want isolation, then install the requirements:

```bash
cd backend
python3 -m pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload
```

The API server starts on `http://localhost:8000`.

## StarDist notes

- The backend uses `labels, details = model.predict_instances(normalize(img))`.
- Version 1 extracts per-object contours from the instance label image and returns those contours to the frontend.
- The backend lazily imports StarDist dependencies, so the API can still start even if the model stack is missing, but `/api/analyze` will return a dependency error until the StarDist requirements are installed.
- The current implementation loads the pretrained `2D_versatile_fluo` model.

## Verification

Frontend:

```bash
cd frontend
npm test -- --run
npm run build
```

Backend:

```bash
cd backend
python3 -m pytest -q
```
