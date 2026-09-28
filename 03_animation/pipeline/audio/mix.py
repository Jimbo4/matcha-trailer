import numpy as np, soundfile as sf, librosa, json, pyloudnorm as pyln, sys
from scipy import signal
from cues import *
from paths import AUDIO_DIR, SFX_DIR, OUT, out_path
import sfx, subprocess
SR=48000; N=int(DURATION*SR)
def db(x): return 10**(x/20)
# ---------------- VO ----------------
vo_raw,vsr=sf.read(VO_SRC)
vo48=librosa.resample(vo_raw.astype(np.float64),orig_sr=vsr,target_sr=SR,res_type='soxr_hq')
def peq(x, f0, gain_db, q):
    A=10**(gain_db/40); w=2*np.pi*f0/SR; al=np.sin(w)/(2*q)
    b=[1+al*A,-2*np.cos(w),1-al*A]; a=[1+al/A,-2*np.cos(w),1-al/A]
    return signal.lfilter(np.array(b)/a[0],np.array(a)/a[0],x)
def shelf_low(x,f0,gain_db):
    A=10**(gain_db/40); w=2*np.pi*f0/SR; al=np.sin(w)/2*np.sqrt(2)
    cw=np.cos(w); sA=2*np.sqrt(A)*al
    b=[A*((A+1)-(A-1)*cw+sA),2*A*((A-1)-(A+1)*cw),A*((A+1)-(A-1)*cw-sA)]
    a=[(A+1)+(A-1)*cw+sA,-2*((A-1)+(A+1)*cw),(A+1)+(A-1)*cw-sA]
    return signal.lfilter(np.array(b)/a[0],np.array(a)/a[0],x)
def compress(x, thr_db=-22, ratio=3.0, att=0.004, rel=0.09, knee=6):
    env=np.abs(x); out=np.zeros_like(x); g=1.0; e=0.0
    aa=np.exp(-1/(att*SR)); ar=np.exp(-1/(rel*SR))
    lvl=np.zeros_like(x)
    for i in range(len(x)):
        v=env[i]; e = aa*e+(1-aa)*v if v>e else ar*e+(1-ar)*v; lvl[i]=e
    ldb=20*np.log10(lvl+1e-9); over=ldb-thr_db
    gr=np.where(over<=-knee/2,0,np.where(over>=knee/2,over*(1-1/ratio),(over+knee/2)**2/(2*knee)*(1-1/ratio)))
    return x*db(-gr)
vo=signal.sosfilt(signal.butter(2,85,'high',fs=SR,output='sos'),vo48)
vo=shelf_low(vo,220,-1.5)
vo=peq(vo,3800,2.5,0.9)
vo=peq(vo,6500,-1.5,2.5)   # tame sibilance a touch
vo=compress(vo,-24,2.6,0.005,0.12)
# split-band de-esser: sibilants from about +2 dB over the vowels to about 3 dB under
from deess import deess
vo,_=deess(vo,SR,thr_db=-4.0,ratio=4.0,max_gr=7.0)
vo_track=np.zeros(N)
vo_env=np.zeros(N)
for vid,text,s0,s1,t0 in VO:
    a=int(s0*SR); b=int(s1*SR); clip=vo[a:b].copy()
    fi=int(0.012*SR); fo=int(0.05*SR)
    clip[:fi]*=np.linspace(0,1,fi); clip[-fo:]*=np.linspace(1,0,fo)
    i=int(t0*SR); vo_track[i:i+len(clip)]+=clip
    vo_env[i:i+len(clip)]=1
# normalise VO to target loudness
meter=pyln.Meter(SR)
vo_l=meter.integrated_loudness(vo_track)
vo_track*=db(-17.0-vo_l)
# ---------------- MUSIC ----------------
mus,_=sf.read(str(OUT / 'music_edit.wav'))
mus=mus[:N]
# sidechain duck from VO envelope (smoothed)
def smooth_env(e, att, rel):
    out=np.zeros_like(e); y=0.0; aa=np.exp(-1/(att*SR)); ar=np.exp(-1/(rel*SR))
    for i in range(len(e)):
        v=e[i]; y = aa*y+(1-aa)*v if v>y else ar*y+(1-ar)*v; out[i]=y
    return out
# fast approx: downsample envelope
ds=48; e_ds=vo_env[::ds]
sm=np.zeros_like(e_ds); y=0.0; aa=np.exp(-1/(0.06*SR/ds)); ar=np.exp(-1/(0.45*SR/ds))
for i,v in enumerate(e_ds):
    y = aa*y+(1-aa)*v if v>y else ar*y+(1-ar)*v; sm[i]=y
duck=np.interp(np.arange(N),np.arange(0,N,ds),sm)
duck_db=-6.5*duck
# slightly less ducking during act1 (music already quiet)
tt=np.arange(N)/SR
duck_db=np.where(tt<DROP-0.1, -2.0*duck, duck_db)
mus=mus*db(duck_db)[:,None]
# music loudness target
mus_l=meter.integrated_loudness(mus)
mus*=db(-19.5-mus_l)
# ---------------- SFX ----------------
SFX_CUES=json.load(open(AUDIO_DIR / 'sfx_cues.json'))
sfx_track=np.zeros((N,2))
cache={}
def load_file(name, src0=None, src1=None):
    # effetto Mixkit: decodifica dell'mp3 originale a 48 kHz stereo float (stesso risultato della vecchia cache lib/*.wav)
    raw=subprocess.run(['ffmpeg','-v','error','-i',str(SFX_DIR / (name+'.mp3')),'-f','f32le','-ac','2','-ar',str(SR),'-'],capture_output=True,check=True).stdout
    x=np.frombuffer(raw,np.float32).reshape(-1,2).astype(np.float64)
    if src0 is not None:
        x=x[int(src0*SR):int((src1 or len(x)/SR)*SR)]
    return x
def peak_time(x):
    hop=480; m=np.abs(x).max(axis=1)
    fr=len(m)//hop; r=[np.sqrt(np.mean(m[i*hop:(i+1)*hop]**2)) for i in range(fr)]
    return (int(np.argmax(r))*hop+hop//2)/SR
for c in SFX_CUES:
    name=c['s']; t=c.get('t',0); g=c.get('db',0 if c.get('lufs') is not None else -12); kw=c.get('kw',{})
    key=name+json.dumps(kw,sort_keys=True)+json.dumps(c.get('src',[]))
    if key not in cache:
        if name.startswith('file:'):
            x=load_file(name[5:], *(c.get('src') or [None,None]))
            fi=c.get('fade_in',0.004); fo=c.get('fade_out',0.03)
            x=x.copy()
            if fi>0: n=int(fi*SR); x[:n]*=np.linspace(0,1,n)[:,None]
            if fo>0: n=int(fo*SR); x[-n:]*=np.linspace(1,0,n)[:,None]
            if c.get('hp'): x=signal.sosfilt(signal.butter(2,c['hp'],'high',fs=SR,output='sos'),x,axis=0)
            if c.get('lp'): x=signal.sosfilt(signal.butter(2,c['lp'],'low',fs=SR,output='sos'),x,axis=0)
            if c.get('lufs') is not None:
                try:
                    L=pyln.Meter(SR).integrated_loudness(x)
                    x=x*db(c['lufs']-L)
                except Exception: pass
            cache[key]=x
        else:
            cache[key]=getattr(sfx,name)(**kw)
    x=cache[key]
    if c.get('peak_at') is not None:
        c=dict(c); c['t']=c['peak_at']-peak_time(x); t=c['t']
    if x.ndim==1: x=np.stack([x,x],1)
    i=int(t*SR)
    if c.get('end_at'):  # align END of sound to time
        i=int(c['end_at']*SR)-len(x)
    i=max(0,i); j=min(N,i+len(x))
    sfx_track[i:j]+=x[:j-i]*db(g)
# ---------------- BUS ----------------
vo_st=np.stack([vo_track,vo_track],1)
import os
if os.environ.get('NO_MUSIC'): mus=mus*0
mix=mus+vo_st+sfx_track
# gentle bus glue + limiter
def limiter(x, ceiling_db=-1.2, look=0.002, rel=0.08):
    c=db(ceiling_db); n=len(x); la=int(look*SR)
    peak=np.max(np.abs(x),axis=1)
    # lookahead max
    from scipy.ndimage import maximum_filter1d
    pk=maximum_filter1d(peak,size=2*la+1)
    g=np.minimum(1,c/np.maximum(pk,1e-9))
    # release smoothing
    out=np.zeros(n); y=1.0; ar=np.exp(-1/(rel*SR))
    for i in range(n):
        v=g[i]; y = v if v<y else ar*y+(1-ar)*v; out[i]=y
    return x*out[:,None]
# normalise integrated loudness to -14 LUFS then limit
L=meter.integrated_loudness(mix)
g_norm=db(float(os.environ.get('TARGET','-14.0'))-L)
mix*=g_norm
# oversampled true-peak-ish limiting: upsample x4, limit, downsample
up=signal.resample_poly(mix,4,1,axis=0)
SRu=SR*4
def limiter_up(x, ceiling_db=-1.3, rel=0.06):
    c=db(ceiling_db); n=len(x); la=int(0.0015*SRu)
    from scipy.ndimage import maximum_filter1d
    pk=maximum_filter1d(np.max(np.abs(x),axis=1),size=2*la+1)
    g=np.minimum(1,c/np.maximum(pk,1e-9))
    # smooth: min filter then one-pole release (vectorised via scipy lfilter on 1-g)
    from scipy.ndimage import minimum_filter1d
    g=minimum_filter1d(g,size=la)
    a=np.exp(-1/(rel*SRu))
    # release: y[n]=max(g[n], a*y[n-1]+(1-a)*g[n]) approx via lfilter on reduction amount
    red=1-g
    y=np.zeros_like(red); prev=0.0
    # vectorised peak-hold with decay
    y=signal.lfilter([1-a],[1,-a],red)
    y=np.maximum(red,y)
    return x*(1-y)[:,None]
up=limiter_up(up)
mix2=signal.resample_poly(up,1,4,axis=0)[:N]
L2=meter.integrated_loudness(mix2)
tp=20*np.log10(np.abs(signal.resample_poly(mix2,4,1,axis=0)).max())
print(f'VO {vo_l:.1f}->-17 | music {mus_l:.1f}->-19.5 | mix LUFS {L2:.2f} | true peak {tp:.2f} dBTP')
OUTN=out_path(os.environ.get('OUT'),'mix.wav')
sf.write(str(OUTN),mix2,SR,subtype='PCM_24')
# stems balanced exactly as in the final mix, with a common 4.5 dB of headroom
# (their sum raised by 4.5 dB = the mix before the master limiter)
if not os.environ.get('NO_MUSIC'):
    for nm,st in [('vo',vo_st),('music',mus),('sfx',sfx_track)]:
        st=st*g_norm*db(-4.5)
        sub='PCM_24' if np.abs(st).max()<0.999 else 'FLOAT'
        sf.write(str(OUT / f'stem_{nm}.wav'),st,SR,subtype=sub)
        print(f'stem {nm}: peak {20*np.log10(np.abs(st).max()):.2f} dBFS ({sub})')
