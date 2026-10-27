# Dutch pronunciation repairs

## bom / boom - 26 October 2026 - v105

The user reported that the long-O example sounded like a different word, especially with Dafna. The text/hash mapping was already distinct; the correction replaces the two minimal-pair clips for both existing teachers with explicitly constrained phonemes.

- `bom` (bomb), `7dc692a9`: IPA `bɔm` (short o).
- `boom` (tree), `c79493aa`: IPA `boːm` (long oo).
- Peter: Azure `nl-BE-ArnaudNeural`, folder `audio/nl/pronunciation-v105/`.
- Dafna: Azure `nl-BE-DenaNeural`, folder `audio/nl-f/pronunciation-v105/`.
- Azure SSML phoneme element, `alphabet="ipa"`, existing -10% synthesis rate and M4A AAC conversion. Existing client pitch preservation and playback rate retained.
- Reference: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-ssml-phonetic-sets#nl-nlnl-be . The documented oː example is boom. Replay tool: tools/repair-bom-boom.py. Credentials are read from the environment or an optional private temporary file, never committed.
- Azure returned HTTP 200 for all four requested syntheses. The recordings differ byte-for-byte, decode to non-silent PCM and contain measurable sound; bom has a shorter active span than boom in each voice. These are technical checks, not an independent human listening assessment. The agent cannot listen to audio input in this runtime; user listening verification remains necessary.
- Runtime routes only these two hashes to new versioned URLs for each voice. Other original audio/manifests and the user's pending recordings are untouched. All four fixed files are precached by SW v105. Old cached unversioned files cannot satisfy the corrected URLs.
