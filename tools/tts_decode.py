"""Estrae l'audio da una risposta Gemini TTS (JSON salvato dal runner) e lo salva in WAV.
Uso: python3 tools/tts_decode.py 02_assets/_raw/tts_Leda_v4.json 02_assets/voice/takes/vo_Leda_v4.wav"""
import base64, json, re, sys, wave

src, dst = sys.argv[1], sys.argv[2]
j = json.load(open(src, encoding="utf-8"))
if "error" in j:
    sys.exit("errore API: " + json.dumps(j["error"], ensure_ascii=False)[:600])
part = next(p for c in j["candidates"] for p in c["content"]["parts"] if "inlineData" in p)
data = base64.b64decode(part["inlineData"]["data"])
mime = part["inlineData"].get("mimeType", "")
if data[:4] == b"RIFF":          # il modello gemini-3.8-flash-tts restituisce già un WAV
    open(dst, "wb").write(data)
else:                            # PCM grezzo s16le mono, es. "audio/L16;codec=pcm;rate=24000"
    m = re.search(r"rate=(\d+)", mime)
    with wave.open(dst, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(int(m.group(1)) if m else 24000); w.writeframes(data)
print(dst, len(data), "byte", mime)
