#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROJECT_DIR"
mkdir -p backups
if [[ ! -f data/bot.sqlite ]]; then
  echo "Chua co database data/bot.sqlite; khong co gi de sao luu."
  exit 1
fi
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_STAMP="$STAMP" node --input-type=module -e '
  import Database from "better-sqlite3";
  const source = new Database("data/bot.sqlite", { readonly: true, fileMustExist: true });
  await source.backup(`backups/bot-${process.env.BACKUP_STAMP}.sqlite`);
  source.close();
'
echo "Da tao backup trong thu muc backups/."
