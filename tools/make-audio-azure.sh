#!/bin/bash
# Records every Dutch text of Leren.be with an Azure neural voice (Flemish male voice Arnaud by default)
# and writes audio/nl/<hash>.m4a + audio/nl/manifest.json — same files as make-audio.sh,
# so the app needs no changes.
#
# Run from the repo folder (Mac or Linux with ffmpeg):
#   export AZURE_SPEECH_KEY=...   AZURE_SPEECH_REGION=westeurope
#   bash tools/make-audio-azure.sh            # all texts (overwrites the Ellen files)
#   LIMIT=10 bash tools/make-audio-azure.sh   # first 10 texts only, to listen first
#   VOICE=nl-BE-DenaNeural OUT=audio/nl-f bash tools/make-audio-azure.sh   # female voice (Dafna) into its own folder
# Voices: nl-BE-DenaNeural (female), nl-BE-ArnaudNeural (male), nl-NL-FennaNeural, nl-NL-MaartenNeural …
# New courses (texts from tools/collect-course-audio.js):
#   VOICE=en-GB-SoniaNeural XMLLANG=en-GB OUT=audio/en TEXTS=audio/en/texts.tsv bash tools/make-audio-azure.sh
#   VOICE=fr-BE-CharlineNeural XMLLANG=fr-BE OUT=audio/fr TEXTS=audio/fr/texts.tsv bash tools/make-audio-azure.sh
set -e
cd "$(dirname "$0")/.."
: "${AZURE_SPEECH_KEY:?Set AZURE_SPEECH_KEY first (Azure portal → Speech resource → Keys and Endpoint)}"
REGION="${AZURE_SPEECH_REGION:-westeurope}"
VOICE="${VOICE:-nl-BE-ArnaudNeural}"
RATE="${RATE:--10%}"        # a bit slower than normal for beginners
LIMIT="${LIMIT:-0}"         # 0 = all
OUT="${OUT:-audio/nl}"     # audio/nl = male (Arnaud), audio/nl-f = female (Dena)
TEXTS="${TEXTS:-audio/nl/texts.tsv}"  # one Dutch text list for every voice; courses: audio/<lang>/texts.tsv
XMLLANG="${XMLLANG:-nl-BE}"
mkdir -p "$OUT"
DONE="$OUT/.done-$VOICE"    # resume list: hashes already recorded with this voice
touch "$DONE"
# Fresh checkout (the resume list is not committed): count the recordings already in the folder as done,
# so only new texts are recorded.
[ -s "$DONE" ] || for f in "$OUT"/*.m4a; do [ -e "$f" ] && basename "$f" .m4a; done > "$DONE"
# AAC/M4A: afconvert on a Mac, ffmpeg elsewhere (Linux, cloud).
to_m4a(){ if command -v afconvert >/dev/null; then afconvert -f m4af -d aac -b 48000 "$1" "$2"; else ffmpeg -loglevel error -y -i "$1" -c:a aac -b:a 48k "$2"; fi; }
esc(){ sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' <<<"$1"; }
total=$(wc -l < "$TEXTS" | tr -d ' '); n=0
while IFS=$'\t' read -r h t; do
  n=$((n+1)); [ -z "$h" ] && continue
  [ "$LIMIT" -gt 0 ] && [ "$n" -gt "$LIMIT" ] && break
  grep -qx "$h" "$DONE" && continue
  ssml="<speak version='1.0' xml:lang='$XMLLANG'><voice name='$VOICE'><prosody rate='$RATE'>$(esc "$t")</prosody></voice></speak>"
  for try in $(seq 1 30); do
    code=$(curl -s --max-time 60 -o "/tmp/leren-$h.wav" -w '%{http_code}' -X POST \
      "https://$REGION.tts.speech.microsoft.com/cognitiveservices/v1" \
      -H "Ocp-Apim-Subscription-Key: $AZURE_SPEECH_KEY" \
      -H "Content-Type: application/ssml+xml; charset=utf-8" \
      -H "X-Microsoft-OutputFormat: riff-24khz-16bit-mono-pcm" \
      -H "User-Agent: leren-be" --data-binary "$ssml") || code=000   # dropped connection: retry instead of quitting
    [ "$code" = 200 ] && break
    [ "$code" = 401 ] && { echo; echo "Wrong key or region (HTTP 401)."; exit 1; }
    if [ "$code" = 429 ]; then sleep 15; else sleep $((try*3)); fi   # 429: free tier allows ~20 requests a minute
  done
  [ "$code" = 200 ] || { echo; echo "Failed on \"$t\" (HTTP $code): $(head -c 300 "/tmp/leren-$h.wav" 2>/dev/null | tr -cd '[:print:]'). Run again to resume."; exit 1; }
  to_m4a "/tmp/leren-$h.wav" "$OUT/$h.m4a" || { echo; echo "Could not convert \"$t\". Run again to resume."; exit 1; }
  rm -f "/tmp/leren-$h.wav"; echo "$h" >> "$DONE"
  printf "\r%d / %d" "$n" "$total"
done < "$TEXTS"
echo
( printf "["; first=1
  for f in "$OUT"/*.m4a; do b=$(basename "$f" .m4a); if [ $first = 1 ]; then first=0; else printf ","; fi; printf '"%s"' "$b"; done
  printf "]\n" ) > "$OUT/manifest.json"
echo "Done with $VOICE. Bump CACHE_NAME in sw.js, then upload the $OUT folder to GitHub."
