#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"

if [[ ! -f .env ]]; then
  echo "Chua co .env. Hay chay bash scripts/termux-setup.sh truoc."
  exit 1
fi

for KEY in DISCORD_TOKEN DISCORD_CLIENT_ID DISCORD_TEST_GUILD_ID; do
  if ! grep -Eq "^${KEY}=.+$" .env; then
    echo "Thieu gia tri $KEY trong .env. Hay mo nano .env de bo sung."
    exit 1
  fi
done

if [[ ! -f dist/index.js ]]; then
  echo "Chua co ban build. Dang build..."
  pnpm run build
fi

mkdir -p data backups
echo "Dang dang ky Slash Commands cho server thu nghiem..."
pnpm run deploy:commands
echo "Dang khoi dong bot. Giu Termux chay; nhan Ctrl+C de dung bot."
pnpm start
