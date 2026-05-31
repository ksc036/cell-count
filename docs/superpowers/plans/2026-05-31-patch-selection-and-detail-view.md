# Patch Selection And Detail View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add selected-patch-only analysis, full-image vs patch-detail viewing, patch-level bulk deletion, overlay opacity control, and one shared state model so every edit stays consistent across views.

**Architecture:** Keep one frontend source of truth for patches, overlays-by-patch, deleted ids, selected patch ids, focused patch id, and view mode. Reuse the existing backend analyze endpoint, but send only the chosen patch uploads and replace overlays only for the returned patch ids.

**Tech Stack:** React, TypeScript, Vite, Vitest, FastAPI

---

### Task 1: Extend frontend state and domain helpers

**Files:**
- Modify: `frontend/src/types.ts`
- Modify: `frontend/src/lib/overlays.ts`

- [ ] Add view mode, patch selection state, and per-patch overlay grouping types.
- [ ] Add helpers to replace overlays for only returned patches while preserving others.
- [ ] Add helpers for patch-wide deletion and filtered rendering counts.

### Task 2: Build patch selection and detail-view UI

**Files:**
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/ControlPanel.tsx`
- Modify: `frontend/src/components/ImageCanvas.tsx`
- Modify: `frontend/src/components/PatchSummary.tsx`
- Modify: `frontend/src/styles.css`

- [ ] Add "selected patch only" interaction mode with hover label and click-to-toggle.
- [ ] Add full-image vs patch-detail view mode and previous/next patch controls.
- [ ] Make patch detail fill the workspace and support overlay deletion there too.
- [ ] Add patch-level bulk delete and overlay opacity controls.

### Task 3: Verify behavior

**Files:**
- Modify: `frontend/src/components/ImageCanvas.test.tsx`
- Modify: `frontend/src/lib/overlays.test.ts`

- [ ] Update tests for selected patch replacement and shared-state behavior.
- [ ] Run frontend tests and build.
- [ ] Run backend tests to confirm request contract still passes.
