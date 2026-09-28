import numpy as np, soundfile as sf, subprocess, io
from numba import njit
from cues import *
from paths import OUT
SR=48000
def load(path):
    raw=subprocess.run(['ffmpeg','-v','error','-i',path,'-f','f32le','-ac','2','-ar',str(SR),'-'],capture_output=True).stdout
    return np.frombuffer(raw,np.float32).reshape(-1,2).copy()
x=load(MUSIC_SRC)
N=int(DURATION*SR)
out=np.zeros((N,2),np.float32)
# Segment A: t in [0, JUMP) from SEG_A_SRC ; transient-aligned: bar 56 transient at 105.127
a0=int(SEG_A_SRC*SR)
jump_i=int(JUMP*SR)
xf=int(0.012*SR)  # 12 ms crossfade
segA=x[a0:a0+jump_i+xf]
# Segment B: from SEG_B_SRC - small preroll so its transient lands exactly at JUMP
pre=0.0
b0=int((SEG_B_SRC-pre)*SR)-xf
segB=x[b0:b0+(N-jump_i)+xf]
out[:jump_i]=segA[:jump_i]
# equal-power crossfade across [jump_i-xf, jump_i)
t=np.linspace(0,1,xf,dtype=np.float32)
gA=np.cos(t*np.pi/2)[:,None]; gB=np.sin(t*np.pi/2)[:,None]
out[jump_i-xf:jump_i]=segA[jump_i-xf:jump_i]*gA+segB[:xf]*gB
out[jump_i:]=segB[xf:xf+(N-jump_i)]
# ---- Act 1 muffle: time-varying lowpass (TPT state-variable), cutoff automation
@njit(cache=True)
def svf_lp(x, fc, sr, q):
    y=np.zeros_like(x)
    for ch in range(x.shape[1]):
        ic1=0.0; ic2=0.0
        for n in range(x.shape[0]):
            g=np.tan(np.pi*fc[n]/sr); k=1.0/q
            a1=1.0/(1.0+g*(g+k)); a2=g*a1; a3=g*a2
            v3=x[n,ch]-ic2
            v1=a1*ic1+a2*v3
            v2=ic2+a2*ic1+a3*v3
            ic1=2*v1-ic1; ic2=2*v2-ic2
            y[n,ch]=v2
    return y
tt=np.arange(N)/SR
fc=np.full(N,20000.0)
lo=650.0
start_sweep=DROP-1.10
m=tt<start_sweep; fc[m]=lo
m2=(tt>=start_sweep)&(tt<DROP)
p=(tt[m2]-start_sweep)/(DROP-start_sweep)
fc[m2]=lo*(18000/lo)**(p**2.2)
seg_end=int((DROP+0.05)*SR)
filt=svf_lp(out[:seg_end].astype(np.float64),fc[:seg_end],SR,0.9).astype(np.float32)
# gain automation during act1 (muffled & lower), resonance-free
g=np.ones(seg_end,np.float32)*0.62
g[int(start_sweep*SR):int(DROP*SR)]=np.linspace(0.62,1.0,int(DROP*SR)-int(start_sweep*SR))
g[int(DROP*SR):]=1.0
# blend: after DROP use unfiltered
blend=np.zeros(seg_end,np.float32); blend[int(DROP*SR):]=1.0
k=int(0.004*SR); d0=int(DROP*SR)
blend[d0-k:d0]=np.linspace(0,1,k)
out[:seg_end]=(filt*(1-blend[:,None])+out[:seg_end]*blend[:,None])*g[:,None]
# fade in first 30ms, fade out at end
fi=int(0.03*SR); out[:fi]*=np.linspace(0,1,fi)[:,None]
fo_start=29.05; fo=int((DURATION-fo_start)*SR)
out[-fo:]*=(np.cos(np.linspace(0,np.pi/2,fo))**1.5)[:,None]
sf.write(str(OUT / 'music_edit.wav'),out,SR,subtype='FLOAT')
print('ok', out.shape, 'peak', np.abs(out).max())
