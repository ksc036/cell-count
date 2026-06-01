#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_BIN="${PYTHON_BIN:-}"
status=0
warning_count=0

pick_python() {
  if [[ -n "${PYTHON_BIN}" ]]; then
    echo "${PYTHON_BIN}"
    return
  fi
  if [[ -x "${ROOT_DIR}/.venv/bin/python" ]]; then
    echo "${ROOT_DIR}/.venv/bin/python"
    return
  fi
  echo "python3"
}

print_ok() {
  echo "[ok] $1"
}

print_warn() {
  echo "[missing] $1"
  status=1
}

print_note() {
  echo "[note] $1"
  warning_count=$((warning_count + 1))
}

if command -v python3 >/dev/null 2>&1; then
  print_ok "python3: $(python3 --version 2>&1)"
else
  print_warn "python3"
fi

PYTHON_CMD="$(pick_python)"
if [[ -x "${PYTHON_CMD}" ]] || command -v "${PYTHON_CMD}" >/dev/null 2>&1; then
  print_ok "selected python: ${PYTHON_CMD}"
else
  print_warn "selected python runtime (${PYTHON_CMD})"
fi

if "${PYTHON_CMD}" -m uvicorn --version >/dev/null 2>&1; then
  print_ok "uvicorn is installed for ${PYTHON_CMD}"
else
  print_warn "uvicorn is not installed for ${PYTHON_CMD}"
fi

if command -v node >/dev/null 2>&1; then
  print_ok "node: $(node -v)"
else
  print_warn "node"
fi

if command -v npm >/dev/null 2>&1; then
  print_ok "npm: $(npm -v)"
else
  print_warn "npm"
fi

if [[ -d "${ROOT_DIR}/frontend/node_modules" ]]; then
  print_ok "frontend node_modules present"
else
  print_warn "frontend/node_modules missing"
fi

if [[ -f "${ROOT_DIR}/backend/requirements.txt" ]]; then
  print_ok "backend requirements file present"
fi

if [[ -x "${ROOT_DIR}/.venv/bin/python" ]]; then
  print_ok "project virtualenv present at .venv"
else
  print_note "project virtualenv missing (.venv) - recommended, but not required if python3 already has the needed packages"
fi

if [[ "${status}" -ne 0 ]]; then
  echo
  echo "Some required tools are missing."
  echo "Recommended next step on Ubuntu: ./setup-ubuntu.sh"
fi

if [[ "${status}" -eq 0 && "${warning_count}" -gt 0 ]]; then
  echo
  echo "Environment is runnable, but a project virtualenv is still recommended."
fi

exit "${status}"
