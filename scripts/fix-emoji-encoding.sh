#!/usr/bin/env bash
set -euo pipefail

FILE="src/components/ABTestingPro.js"

# Make a backup
cp "$FILE" "$FILE.bak"

# Replace the most common mojibake sequences with proper emoji
perl -0777 -i -pe '
s/ðŸŽ¯/🎯/g;
s/ðŸŒ™/🌙/g;
s/â˜€ï¸�/☀️/g;
s/â�³/⏳/g;
s/ðŸš€/🚀/g;
s/âš ï¸�/⚠️/g;
s/ðŸ“Š/📊/g;
s/ðŸ§ /🧠/g;
s/ðŸ“ˆ/📈/g;
s/ðŸ‘¥/👥/g;
s/âœ…/✅/g;
s/ðŸ”„/🔄/g;
s/ðŸŽ²/🎲/g;
s/ðŸ�†/🏆/g;
s/âš¡/⚡/g;
' "$FILE"
