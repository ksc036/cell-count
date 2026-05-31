# StarDist Cell Count App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local web app that lets a user upload a microscopy image, split it into patches with horizontal and vertical divider lines, batch-upload cropped patches to a FastAPI backend for StarDist analysis, review overlays, delete wrong overlays, and add manual counts per patch.

**Architecture:** A React + TypeScript frontend owns image interaction, patch computation, patch cropping, overlay merging, and count recalculation. A FastAPI backend accepts a single multipart request containing many patch images plus metadata, runs StarDist inference per patch, extracts object contours from instance labels, and returns patch-local overlay results.

**Tech Stack:** React, TypeScript, Vite, Vitest, FastAPI, Python 3.9+, StarDist, NumPy, OpenCV, Pillow, tifffile, uvicorn

---

### Task 1: Scaffold the repository structure

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/tsconfig.node.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/styles.css`
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `.gitignore`
- Create: `README.md`

- [ ] **Step 1: Create the base project files**

Create a Vite React frontend and FastAPI backend skeleton with separate directories and a root README.

- [ ] **Step 2: Verify the file structure exists**

Run: `find frontend backend -maxdepth 3 -type f | sort`
Expected: lists the frontend and backend scaffold files

- [ ] **Step 3: Commit**

```bash
git add .gitignore README.md frontend backend
git commit -m "chore: scaffold frontend and backend apps"
```

### Task 2: Implement shared frontend types and patch math

**Files:**
- Create: `frontend/src/types.ts`
- Create: `frontend/src/lib/patches.ts`
- Create: `frontend/src/lib/overlays.ts`
- Create: `frontend/src/lib/cropImage.ts`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/patches.test.ts`
- Create: `frontend/src/lib/overlays.test.ts`

- [ ] **Step 1: Write failing patch and overlay tests**

Add tests for:
- patch grid computation from horizontal and vertical lines
- patch label generation
- patch-local overlay to global overlay conversion
- automatic/final count recomputation after deletion and manual additions

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --runInBand`
Expected: test failures due to missing implementations

- [ ] **Step 3: Implement the patch and overlay helpers**

Add pure functions for:
- sorting and deduplicating lines
- generating rectangular patch records
- cropping images with canvas
- translating patch-local contours to original-image coordinates
- deriving counts

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test -- --runInBand`
Expected: all helper tests pass

- [ ] **Step 5: Commit**

```bash
git add frontend/src/types.ts frontend/src/lib
git commit -m "feat: add patch and overlay domain logic"
```

### Task 3: Build the interactive frontend UI

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/styles.css`
- Create: `frontend/src/components/ImageCanvas.tsx`
- Create: `frontend/src/components/ControlPanel.tsx`
- Create: `frontend/src/components/PatchSummary.tsx`
- Create: `frontend/src/components/ImageCanvas.test.tsx`

- [ ] **Step 1: Write failing UI tests**

Add focused component tests for:
- line placement mode toggling
- patch summary rendering
- delete overlay mode behavior at the state level

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test -- --runInBand`
Expected: failures caused by missing components and interactions

- [ ] **Step 3: Implement the frontend components**

Build:
- upload flow for supported image types
- interactive image canvas with divider preview and commit-on-click
- patch summary panel with automatic/manual/final counts
- delete overlay mode with hover highlight and click deletion
- analysis button that crops patch images, sends one batch request, merges overlays, and updates counts

- [ ] **Step 4: Verify tests and build**

Run: `cd frontend && npm test -- --runInBand`
Expected: all frontend tests pass

Run: `cd frontend && npm run build`
Expected: Vite build succeeds

- [ ] **Step 5: Commit**

```bash
git add frontend/src
git commit -m "feat: build interactive cell count frontend"
```

### Task 4: Implement the FastAPI batch analysis backend

**Files:**
- Modify: `backend/app/main.py`
- Create: `backend/app/schemas.py`
- Create: `backend/app/image_io.py`
- Create: `backend/app/inference.py`
- Create: `backend/app/contours.py`
- Create: `backend/tests/test_api.py`

- [ ] **Step 1: Write failing backend tests**

Add tests for:
- health endpoint
- analyze endpoint request validation
- analyze endpoint response shape
- contour extraction fallback using mocked inference

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd backend && python3 -m pytest -q`
Expected: failures due to missing backend modules and routes

- [ ] **Step 3: Implement backend modules**

Build:
- multipart patch upload parsing
- patch metadata validation
- image loading for png/jpg/tiff
- StarDist inference adapter using `predict_instances`
- contour extraction from instance label maps
- JSON response generation with patch-local contours, bounding boxes, and centroids
- fallback error messaging when StarDist dependencies are unavailable

- [ ] **Step 4: Run backend tests**

Run: `cd backend && python3 -m pytest -q`
Expected: all backend tests pass

- [ ] **Step 5: Commit**

```bash
git add backend
git commit -m "feat: add batch patch analysis backend"
```

### Task 5: Wire the full stack and verify the end-to-end developer workflow

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-05-31-stardist-cell-count-design.md`

- [ ] **Step 1: Update docs**

Document:
- setup steps
- frontend and backend run commands
- StarDist dependency expectations
- supported image types
- current interaction model

- [ ] **Step 2: Run the full verification commands**

Run: `cd frontend && npm test -- --runInBand && npm run build`
Expected: tests and build pass

Run: `cd backend && python3 -m pytest -q`
Expected: backend tests pass

- [ ] **Step 3: Commit**

```bash
git add README.md docs/superpowers/specs/2026-05-31-stardist-cell-count-design.md
git commit -m "docs: add setup and verification guidance"
```
