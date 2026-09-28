# Analisi dei brani candidati (tempo, tonalità, energia ogni 2 s): python3 analyze_music.py
import numpy as np, librosa, glob, os, json, subprocess, warnings
from paths import ASSETS, OUT
warnings.filterwarnings('ignore')
res={}
KEYS=['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
maj=np.array([6.35,2.23,3.48,2.33,4.38,4.09,2.52,5.19,2.39,3.66,2.29,2.88]); mnr=np.array([6.33,2.68,3.52,5.38,2.60,3.53,2.54,4.75,3.98,2.69,3.34,3.17])
for p in sorted(glob.glob(str(ASSETS / 'music/candidates/*.mp3'))):
    name=os.path.basename(p)[:-4]
    br=subprocess.run(['ffprobe','-v','error','-show_entries','format=bit_rate,duration','-of','csv=p=0',p],capture_output=True,text=True).stdout.strip()
    y,sr=librosa.load(p,sr=22050,mono=True)
    tempo,beats=librosa.beat.beat_track(y=y,sr=sr)
    tempo=float(np.atleast_1d(tempo)[0])
    chroma=librosa.feature.chroma_cqt(y=y,sr=sr).mean(axis=1)
    best=None
    for i in range(12):
        for prof,mode in ((maj,'maj'),(mnr,'min')):
            c=np.corrcoef(np.roll(prof,i),chroma)[0,1]
            if best is None or c>best[0]: best=(c,KEYS[i]+' '+mode)
    rms=librosa.feature.rms(y=y,hop_length=512)[0]
    t=librosa.frames_to_time(np.arange(len(rms)),sr=sr,hop_length=512)
    # per 2s energy dB
    secs=np.arange(0,len(y)/sr,2.0)
    e=[20*np.log10(np.sqrt(np.mean(rms[(t>=s)&(t<s+2)]**2))+1e-9) for s in secs]
    cent=np.median(librosa.feature.spectral_centroid(y=y,sr=sr)[0])
    onset=librosa.onset.onset_strength(y=y,sr=sr)
    res[name]=dict(br=br,tempo=round(tempo,1),key=best[1],centroid=int(cent),energy2s=[round(v,1) for v in e],dur=round(len(y)/sr,1))
    print(f"{name:28s} br/dur={br:22s} tempo={tempo:6.1f} key={best[1]:7s} cent={cent:5.0f}")
    print('   E:',' '.join(f"{v:.0f}" for v in e))
json.dump(res,open(OUT / 'music_analysis.json','w'),indent=1)
