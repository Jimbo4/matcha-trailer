# Griglia delle battute e energia per battuta di un brano: python3 bars.py me_and_you
import numpy as np, librosa, sys, warnings
from paths import ASSETS
warnings.filterwarnings('ignore')
names=sys.argv[1:]
for n in names:
    import glob
    p=glob.glob(str(ASSETS / 'music/candidates' / f'{n}*.mp3'))[0]
    y,sr=librosa.load(p,sr=22050,mono=True)
    tempo,beats=librosa.beat.beat_track(y=y,sr=sr,units='time',tightness=200)
    tempo=float(np.atleast_1d(tempo)[0])
    # choose downbeat phase: max low-freq onset energy at beat index mod 4
    S=np.abs(librosa.stft(y,n_fft=2048,hop_length=512))
    low=S[:40].sum(axis=0); tt=librosa.frames_to_time(np.arange(S.shape[1]),sr=sr,hop_length=512)
    def e_at(t): i=np.searchsorted(tt,t); return low[max(0,i-2):i+3].max() if i<len(low) else 0
    phase_scores=[np.mean([e_at(b) for b in beats[k::4]]) for k in range(4)]
    ph=int(np.argmax(phase_scores))
    downs=beats[ph::4]
    rms=librosa.feature.rms(y=y,hop_length=512)[0]
    bars=[]
    for i in range(len(downs)-1):
        a,b=downs[i],downs[i+1]
        m=(tt>=a)&(tt<b)
        bars.append(20*np.log10(np.sqrt(np.mean(rms[m]**2))+1e-9))
    print(f"== {n}: tempo {tempo:.1f}  beats {len(beats)} first_down {downs[0]:.2f}s bar_len {np.median(np.diff(downs)):.3f}s")
    line=''
    for i,(d,e) in enumerate(zip(downs,bars)):
        line+=f"{d:5.1f}:{e:4.0f} "
        if (i+1)%8==0: print('  ',line); line=''
    if line: print('  ',line)
