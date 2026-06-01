#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
BACKEND_HOST="${BACKEND_HOST:-127.0.0.1}"
FRONTEND_HOST="${FRONTEND_HOST:-127.0.0.1}"

backend_pid=""
frontend_pid=""

cleanup() {
  if [[ -n "${frontend_pid}" ]] && kill -0 "${frontend_pid}" 2>/dev/null; then
    kill "${frontend_pid}" 2>/dev/null || true
  fi
  if [[ -n "${backend_pid}" ]] && kill -0 "${backend_pid}" 2>/dev/null; then
    kill "${backend_pid}" 2>/dev/null || true
  fi
}

port_in_use() {
  local port="$1"
  lsof -ti tcp:"${port}" >/dev/null 2>&1
}

trap cleanup EXIT INT TERM

if port_in_use "${BACKEND_PORT}"; then
  echo "Backend port ${BACKEND_PORT} is already in use. Stop the existing process first."
  exit 1
fi

if port_in_use "${FRONTEND_PORT}"; then
  echo "Frontend port ${FRONTEND_PORT} is already in use. Stop the existing process first."
  exit 1
fi

cd "${ROOT_DIR}"
python3 -m uvicorn backend.app.main:app --host "${BACKEND_HOST}" --port "${BACKEND_PORT}" &
backend_pid=$!

(
  cd "${ROOT_DIR}/frontend"
  npm run dev -- --host "${FRONTEND_HOST}" --port "${FRONTEND_PORT}"
) &
frontend_pid=$!

echo "Backend:  http://${BACKEND_HOST}:${BACKEND_PORT}"
echo "Frontend: http://${FRONTEND_HOST}:${FRONTEND_PORT}"
echo "Press Ctrl+C to stop both servers."

wait "${backend_pid}" "${frontend_pid}"
