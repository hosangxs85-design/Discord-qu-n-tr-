#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if ! command -v pkg >/dev/null 2>&1; then
  echo "Loi: Script nay chi chay trong Termux tren Android."
  exit 1
fi

ARCH="$(uname -m)"
if [[ "$ARCH" != "aarch64" && "$ARCH" != "arm64" ]]; then
  echo "Canh bao: kien truc $ARCH chua duoc xac nhan cho goi SQLite tren Android."
  echo "Dung lai va gui thong tin nay de kiem tra truoc khi cai tiep."
  exit 1
fi

echo "[1/5] Cap nhat Termux packages..."
pkg update -y
pkg upgrade -y

echo "[2/5] Cai Node.js LTS va cong cu build..."
pkg install -y nodejs-lts clang make python git nano

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if (( NODE_MAJOR < 22 )); then
  echo "Loi: can Node.js 22 tro len; hien tai la $(node --version)."
  exit 1
fi

echo "Node: $(node --version) | npm: $(npm --version)"

echo "[3/5] Cai pnpm va dependencies tu lockfile..."
if command -v corepack >/dev/null 2>&1; then
  corepack enable
  corepack prepare pnpm@11.25.0 --activate
else
  echo "Corepack khong co san; cai pnpm da ghim bang npm global..."
  npm install --global pnpm@11.25.0
fi
pnpm install --frozen-lockfile

echo "[4/5] Kiem tra type, test va build..."
pnpm run typecheck
pnpm test
pnpm run build

echo "[5/5] Tao thu muc du lieu va file cau hinh neu chua co..."
mkdir -p data backups
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Da tao .env tu .env.example. Chua co Discord Token trong file nay."
fi

cat <<'MSG'

HOAN TAT CAI DAT CO BAN.
Buoc tiep theo:
  1. Chay: nano .env
  2. Dien DISCORD_TOKEN, DISCORD_CLIENT_ID va DISCORD_TEST_GUILD_ID.
  3. Luu file: Ctrl+O, Enter; thoat: Ctrl+X.
  4. Chay: bash scripts/termux-start.sh

Khong gui noi dung .env, Token hoac anh chup co Token cho bat ky ai.
MSG
