#!/usr/bin/env bash
# Build ServeIQ_Development_Report.pdf from screenshots in ./ss
# Usage: ./build-report.sh
# Screenshots the report uses (place in ./ss with these exact names):
#   guest-home.png          — guest home (signed out)
#   guest-home-loggedin.png — guest home (logged in)
#   host-dashboard.png      — host dashboard
#   search.png              — search screen
#   hotel.png               — hotel detail
#   login2.png              — login screen

set -euo pipefail

CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
REPORT_DIR="/var/folders/kq/5zms9f3x35v433vx8pc7r8_r0000gn/T/opencode/report"
SS_DIR="$(cd "$(dirname "$0")" && pwd)/ss"
OUT_PDF="$(cd "$(dirname "$0")" && pwd)/ServeIQ_Development_Report.pdf"

# 1. Copy user-provided screenshots into the report working dir
rm -rf "$REPORT_DIR/shots"
mkdir -p "$REPORT_DIR/shots"
for f in "$SS_DIR"/*.png "$SS_DIR"/*.jpg "$SS_DIR"/*.jpeg; do
  [ -e "$f" ] && cp "$f" "$REPORT_DIR/shots/" || true
done

echo "Using screenshots from: $SS_DIR"
echo "  $(ls "$REPORT_DIR/shots" | wc -l | tr -d ' ') files -> $REPORT_DIR/shots"

# 2. Regenerate the PDF
"$CHROME" --headless --disable-gpu --no-sandbox \
  --print-to-pdf="$OUT_PDF" --no-pdf-header-footer \
  "$REPORT_DIR/report.html" >/dev/null 2>&1 || { echo "Chrome print failed"; exit 1; }

python3 - "$OUT_PDF" <<'PY'
import re, sys
p = sys.argv[1]
d = open(p, "rb").read()
pages = len(re.findall(rb"/Type\s*/Page[^s]", d))
print(f"PDF written: {p} ({pages} pages, {len(d)//1024} KB)")
PY
