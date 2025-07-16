#!/bin/bash
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CFG_FILE="$BASE_DIR/config.txt"
OUT_FILE="$BASE_DIR/schema.sql"

# Verifica presenza file di configurazione
if [ ! -f "$CFG_FILE" ]; then
  echo "❌ File di configurazione '$CFG_FILE' non trovato."
  exit 1
fi

# Legge i 4 valori dalla config.txt
readarray -t CFG < "$CFG_FILE"
DB_HOST="${CFG[0]}"
DB_NAME="${CFG[1]}"
DB_USER="${CFG[2]}"
DB_PASS="${CFG[3]}"

echo "▶️  Connessione a $DB_HOST, esportazione database '$DB_NAME'..."

TMP_FILE=$(mktemp)

mysqldump -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASS" \
  --no-data --routines --triggers "$DB_NAME" > "$TMP_FILE"

if [ $? -ne 0 ]; then
  echo "❌ Errore durante mysqldump"
  rm -f "$TMP_FILE"
  exit 2
fi

echo "-- Schema generato il $(date)" > "$OUT_FILE"
echo "CREATE DATABASE IF NOT EXISTS \`$DB_NAME\`;" >> "$OUT_FILE"
echo "USE \`$DB_NAME\`;" >> "$OUT_FILE"
echo "" >> "$OUT_FILE"

sed 's/CREATE TABLE /CREATE TABLE IF NOT EXISTS /g' "$TMP_FILE" >> "$OUT_FILE"

rm -f "$TMP_FILE"

echo "✅ schema.sql creato con controllo su database e tabelle."
