import numpy as np
from scipy import signal
SR=48000
rng=np.random.default_rng(7)
def env_exp(n, decay_s, attack_s=0.002):
    t=np.arange(n)/SR
    a=np.minimum(1, t/max(attack_s,1e-6))
    return a*np.exp(-t/decay_s)
def pan(x, p):  # p in [-1,1]
    l=np.cos((p+1)*np.pi/4); r=np.sin((p+1)*np.pi/4)
    return np.stack([x*l, x*r],1)
def bp(x, lo, hi, order=2):
    sos=signal.butter(order,[lo,hi],btype='band',fs=SR,output='sos'); return signal.sosfilt(sos,x)
def hp(x, f, order=2):
    sos=signal.butter(order,f,btype='high',fs=SR,output='sos'); return signal.sosfilt(sos,x)
def lp(x, f, order=2):
    sos=signal.butter(order,f,btype='low',fs=SR,output='sos'); return signal.sosfilt(sos,x)
def tv_bandpass(noise, fcs, q=1.2):
    # time-varying bandpass via block processing with interpolated center
    out=np.zeros_like(noise); B=256
    zi=None
    for i in range(0,len(noise),B):
        fc=float(np.clip(fcs[min(i,len(fcs)-1)],60,SR/2.3))
        bw=fc/q; lo=max(20,fc-bw/2); hi=min(SR/2.1,fc+bw/2)
        b,a=signal.butter(2,[lo,hi],btype='band',fs=SR)
        if zi is None: zi=signal.lfilter_zi(b,a)*0
        seg,zi=signal.lfilter(b,a,noise[i:i+B],zi=zi)
        out[i:i+B]=seg
    return out
def reverb(x, decay=0.9, mix=0.25, pre=0.012, seed=3):
    r=np.random.default_rng(seed); n=int(decay*SR*1.5)
    ir=r.standard_normal((n,2))*np.exp(-np.arange(n)/SR/(decay/6.9))[:,None]
    ir=lp(ir.T,7000).T if False else ir
    ir[:int(pre*SR)]=0; ir/=np.sqrt((ir**2).sum(0))
    if x.ndim==1: x=np.stack([x,x],1)
    wet=np.stack([signal.fftconvolve(x[:,0],ir[:,0]),signal.fftconvolve(x[:,1],ir[:,1])],1)[:len(x)+n]
    dry=np.zeros_like(wet); dry[:len(x)]=x
    return dry*(1-mix)+wet*mix
def norm(x, peak=0.9):
    m=np.abs(x).max(); return x*(peak/m) if m>0 else x

def ping():
    n=int(0.6*SR); t=np.arange(n)/SR
    f1,f2=1661.2,2217.5  # G#6, C#7 (in B major)
    s=np.zeros(n)
    for f,d,dl,amp in ((f1,0.18,0.0,1.0),(f2,0.28,0.075,0.9)):
        k=int(dl*SR); tt=t[:n-k]
        tone=np.sin(2*np.pi*f*tt+0.6*np.sin(2*np.pi*f*2.0*tt)*np.exp(-tt/0.05))
        s[k:]+=amp*tone*env_exp(n-k,d,0.003)
    s=hp(s,300)
    return norm(reverb(pan(s,0.1),0.5,0.18),0.5)
def bubble(freq=900, pitch_up=1.5, dur=0.07):
    n=int(dur*SR); t=np.arange(n)/SR
    f=freq*(1+(pitch_up-1)*(t/dur))
    ph=2*np.pi*np.cumsum(f)/SR
    s=np.sin(ph)*env_exp(n,dur/3,0.002)
    return norm(pan(s,0),0.35)
def pop(freq=700, pan_p=0.0):
    n=int(0.09*SR); t=np.arange(n)/SR
    f=freq*np.exp(-t/0.02)+freq*0.35
    ph=2*np.pi*np.cumsum(f)/SR
    s=np.sin(ph)*env_exp(n,0.022,0.0008)
    click=rng.standard_normal(n)*env_exp(n,0.0025,0.0002)*0.6
    s=s+hp(click,2000)
    return norm(pan(s,pan_p),0.55)
def thwip():
    n=int(0.16*SR); nz=rng.standard_normal(n)
    s=bp(nz,1800,7000)*env_exp(n,0.03,0.004)
    t=np.arange(n)/SR; thump=np.sin(2*np.pi*(140*np.exp(-t/0.05)+60)*t)*env_exp(n,0.04,0.002)*0.8
    return norm(reverb(pan(s*0.8+thump,-0.05),0.35,0.12),0.6)
def whoosh(dur=0.5, f0=350, fpeak=2600, f1=700, p0=-0.7, p1=0.7, level=0.55, seed=0):
    r=np.random.default_rng(seed); n=int(dur*SR); t=np.linspace(0,1,n)
    nz=r.standard_normal(n)
    fcs=np.where(t<0.55, f0*(fpeak/f0)**(t/0.55), fpeak*(f1/fpeak)**((t-0.55)/0.45))
    s=tv_bandpass(nz,fcs,q=0.9)
    envl=np.sin(np.pi*np.clip(t,0,1))**1.6
    s=s*envl
    L=s*np.cos((np.interp(t,[0,1],[p0,p1])+1)*np.pi/4); R=s*np.sin((np.interp(t,[0,1],[p0,p1])+1)*np.pi/4)
    x=np.stack([L,R],1)
    return norm(reverb(x,0.6,0.15),level)
def riser(dur=1.1):
    n=int(dur*SR); t=np.linspace(0,1,n); nz=rng.standard_normal(n)
    fcs=500*(9000/500)**(t**1.6)
    s=tv_bandpass(nz,fcs,q=2.0)*(t**2.2)
    ph=2*np.pi*np.cumsum(220*(4.0**(t**1.5)))/SR
    tone=(np.sin(ph)+0.35*np.sin(2*ph))*(t**2.6)*0.25
    x=np.stack([s*0.9+tone, s*0.9+tone*0.9],1)
    # widen with slight delay on R
    d=int(0.004*SR); x[d:,1]=x[:-d,1]
    x[-int(0.01*SR):]*=np.linspace(1,0,int(0.01*SR))[:,None]
    return norm(x,0.6)
def impact(sub=52, dur=1.4, level=0.9):
    n=int(dur*SR); t=np.arange(n)/SR
    f=sub*1.8*np.exp(-t/0.03)+sub
    ph=2*np.pi*np.cumsum(f)/SR
    boom=np.sin(ph)*env_exp(n,0.35,0.001)
    crack=hp(rng.standard_normal(n),1500)*env_exp(n,0.03,0.0005)*0.5
    body=bp(rng.standard_normal(n),120,900)*env_exp(n,0.12,0.001)*0.4
    s=boom+crack+body
    return norm(reverb(pan(s,0),1.4,0.22),level)
def clink():
    n=int(1.6*SR); t=np.arange(n)/SR
    parts=[(2231,1.0,0.9),(2238,0.8,0.9),(3587,0.55,0.55),(5163,0.35,0.35),(6711,0.25,0.25),(8412,0.15,0.18),(4455,0.3,0.4)]
    def strike(amp):
        s=np.zeros(n)
        for f,a,d in parts:
            s+=a*np.sin(2*np.pi*f*t+rng.uniform(0,6.28))*env_exp(n,d,0.0005)
        s+=hp(rng.standard_normal(n),3000)*env_exp(n,0.004,0.0002)*0.8
        return s*amp
    s=strike(1.0); k=int(0.011*SR); s2=np.zeros(n); s2[k:]=strike(0.6)[:n-k]
    x=np.stack([s*0.9+s2*0.6, s*0.7+s2*0.9],1)
    x=hp(x.T,900).T
    return norm(reverb(x,0.9,0.2),0.5)
def sparkle(notes=(1975.5,2489.0,2960.0,3951.1), gap=0.055, level=0.4):
    n=int(1.6*SR); t=np.arange(n)/SR; x=np.zeros((n,2))
    for i,f in enumerate(notes):
        k=int(i*gap*SR); tt=t[:n-k]
        tone=(np.sin(2*np.pi*f*tt)+0.3*np.sin(2*np.pi*f*2.01*tt))*env_exp(n-k,0.35,0.002)
        p=-0.5+i/(len(notes)-1)
        x[k:]+=pan(tone,p)
    return norm(reverb(x,1.2,0.35),level)
def tap():
    n=int(0.05*SR); s=bp(rng.standard_normal(n),1800,5000)*env_exp(n,0.004,0.0003)
    t=np.arange(n)/SR; s+=np.sin(2*np.pi*180*t)*env_exp(n,0.008,0.0005)*0.5
    return norm(pan(s,0.05),0.35)
def lock():
    a=tap()*1.0; b=tap()*0.8
    n=len(a)+int(0.045*SR); x=np.zeros((n,2)); x[:len(a)]+=a; x[int(0.045*SR):int(0.045*SR)+len(b)]+=b
    t=np.arange(n)/SR; body=np.sin(2*np.pi*95*t)*env_exp(n,0.03,0.001)*0.3
    x+=np.stack([body,body],1)
    return norm(x,0.45)
def soft_swell(dur=0.9):
    n=int(dur*SR); t=np.linspace(0,1,n); nz=rng.standard_normal(n)
    s=bp(nz,300,5000)*(t**2)
    x=np.stack([s,np.roll(s,200)],1); x[-400:]*=np.linspace(1,0,400)[:,None]
    return norm(x,0.35)
