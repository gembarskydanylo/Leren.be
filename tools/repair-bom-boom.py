#!/usr/bin/env python3
"""Record the bom/boom minimal pair with explicit Dutch IPA using Azure Speech.
AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=northeurope python3 tools/repair-bom-boom.py
Writes four versioned clips; existing recordings/manifests stay intact.
"""
import argparse, os, pathlib, subprocess, tempfile, urllib.request, urllib.error, wave
from xml.sax.saxutils import escape

PAIRS = [('7dc692a9', 'bom', 'b\u0254m'), ('c79493aa', 'boom', 'bo\u02d0m')]
VOICES = [('nl', 'nl-BE-ArnaudNeural'), ('nl-f', 'nl-BE-DenaNeural')]
ROOT = pathlib.Path(__file__).resolve().parent.parent

def ssml(voice, word, ipa):
    return ('<speak version="1.0" xml:lang="nl-BE"><voice name="'+voice+'">'
            '<prosody rate="-10%"><phoneme alphabet="ipa" ph="'+ipa+'">'+escape(word)+
            '</phoneme></prosody></voice></speak>')

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--key-file',type=pathlib.Path,help='Optional private temporary file; never committed')
    args=parser.parse_args()
    key=args.key_file.read_text().strip() if args.key_file else os.environ.get('AZURE_SPEECH_KEY','').strip()
    if not key: raise SystemExit('Set AZURE_SPEECH_KEY or provide --key-file')
    region=os.environ.get('AZURE_SPEECH_REGION','northeurope')
    if not region.replace('-','').isalnum(): raise SystemExit('Invalid Azure region')
    # Stage every response before updating the four output files.
    with tempfile.TemporaryDirectory(prefix='leren-phonemes-') as temp:
        staged=[]
        for folder,voice in VOICES:
            for hash_id,word,ipa in PAIRS:
                request=urllib.request.Request('https://'+region+'.tts.speech.microsoft.com/cognitiveservices/v1',
                    data=ssml(voice,word,ipa).encode('utf8'),method='POST',headers={
                        'Ocp-Apim-Subscription-Key':key,'Content-Type':'application/ssml+xml; charset=utf-8',
                        'X-Microsoft-OutputFormat':'riff-24khz-16bit-mono-pcm','User-Agent':'leren-be-pronunciation-repair'})
                try:
                    with urllib.request.urlopen(request,timeout=60) as response: data=response.read()
                except urllib.error.HTTPError as error:
                    raise SystemExit('Azure synthesis failed (HTTP '+str(error.code)+'); no clips published') from None
                wav=pathlib.Path(temp)/(folder+'-'+hash_id+'.wav');wav.write_bytes(data)
                with wave.open(str(wav)) as sound:
                    duration=sound.getnframes()/sound.getframerate()
                    if not .15 < duration < 10: raise SystemExit('Unexpected audio duration')
                audio=wav.with_suffix('.m4a')
                subprocess.run(['afconvert','-f','m4af','-d','aac','-b','48000',str(wav),str(audio)],check=True)
                target=ROOT/'audio'/folder/'pronunciation-v105'/(hash_id+'.m4a')
                staged.append((audio,target))
                print(folder,word,ipa,'HTTP 200',round(duration,2),'seconds')
        for audio,target in staged:
            target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(audio.read_bytes())
    print('Four corrected clips ready. Review and publish with the v105 URL mapping/cache.')

if __name__=='__main__': main()
