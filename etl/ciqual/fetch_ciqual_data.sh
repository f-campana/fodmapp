#!/usr/bin/env bash
set -euo pipefail

# Checksums below were verified from fresh downloads of these exact public URLs:
# - https://entrepot.recherche.data.gouv.fr/api/access/datafile/666260
# - https://entrepot.recherche.data.gouv.fr/api/access/datafile/666252
# - https://entrepot.recherche.data.gouv.fr/api/access/datafile/666250

TARGET_DIR="${CIQUAL_DATA_DIR:-${1:-${PWD}/.ciqual-data}}"
mkdir -p "${TARGET_DIR}"

XLSX_NAME="Table Ciqual 2025_FR_2025_11_03.xlsx"
ALIM_XML_NAME="alim_2025_11_03.xml"
ALIM_GRP_XML_NAME="alim_grp_2025_11_03.xml"

XLSX_URL="https://entrepot.recherche.data.gouv.fr/api/access/datafile/666260"
ALIM_XML_URL="https://entrepot.recherche.data.gouv.fr/api/access/datafile/666252"
ALIM_GRP_XML_URL="https://entrepot.recherche.data.gouv.fr/api/access/datafile/666250"

XLSX_SHA256="5555c572fa3735991298d832d0427788fa69a11b4fd20a5d580d58942369fbb0"
ALIM_XML_SHA256="e0b1de25b3039028205e9d54a96892e403e1b313c2efeb41180fabe132627478"
ALIM_GRP_XML_SHA256="e216928be1001aed15ba1b120405b70a98145da2a1a76026d6e33542bd5e39dc"

sha256_file() {
  local file_path="$1"

  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "${file_path}" | awk '{print $1}'
    return
  fi

  if command -v shasum >/dev/null 2>&1; then
    shasum -a 256 "${file_path}" | awk '{print $1}'
    return
  fi

  echo "[FAIL] No sha256 tool found (sha256sum or shasum required)." >&2
  exit 1
}

download_and_verify() {
  local url="$1"
  local dest="$2"
  local expected_sha="$3"
  local actual_sha

  if [[ ! -f "${dest}" ]]; then
    echo "[INFO] Downloading $(basename "${dest}")" >&2
    curl -L --fail --retry 3 --retry-delay 2 --retry-all-errors -o "${dest}" "${url}"
  else
    echo "[INFO] Reusing existing $(basename "${dest}")" >&2
  fi

  actual_sha="$(sha256_file "${dest}")"
  if [[ "${actual_sha}" != "${expected_sha}" ]]; then
    echo "[FAIL] SHA-256 mismatch for ${dest}" >&2
    echo "  expected: ${expected_sha}" >&2
    echo "  actual:   ${actual_sha}" >&2
    exit 1
  fi

  echo "[INFO] Verified $(basename "${dest}")" >&2
}

XLSX_PATH="${TARGET_DIR}/${XLSX_NAME}"
ALIM_XML_PATH="${TARGET_DIR}/${ALIM_XML_NAME}"
ALIM_GRP_XML_PATH="${TARGET_DIR}/${ALIM_GRP_XML_NAME}"

download_and_verify "${XLSX_URL}" "${XLSX_PATH}" "${XLSX_SHA256}"
download_and_verify "${ALIM_XML_URL}" "${ALIM_XML_PATH}" "${ALIM_XML_SHA256}"
download_and_verify "${ALIM_GRP_XML_URL}" "${ALIM_GRP_XML_PATH}" "${ALIM_GRP_XML_SHA256}"

printf 'CIQUAL_XLSX=%s\n' "${XLSX_PATH}"
printf 'CIQUAL_ALIM_XML=%s\n' "${ALIM_XML_PATH}"
printf 'CIQUAL_GRP_XML=%s\n' "${ALIM_GRP_XML_PATH}"
