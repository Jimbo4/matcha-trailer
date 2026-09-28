"""Scontorno dei ritagli halftone su sfondo uniforme (vedi fondo del file per l'uso)."""
import numpy as np, sys, os
from PIL import Image
from scipy import ndimage as ndi
def key(path, out, t1=42, min_area=300):
    im=Image.open(path).convert('RGB'); a=np.asarray(im).astype(np.float32)
    h,w,_=a.shape
    border=np.concatenate([a[0],a[-1],a[:,0],a[:,-1]])
    B=np.median(border,axis=0)
    d=np.sqrt(((a-B)**2).sum(-1))
    cand=d<t1
    lab,n=ndi.label(cand)
    sizes=ndi.sum(np.ones_like(d),lab,index=np.arange(1,n+1))
    bg=np.zeros_like(cand)
    border_labels=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    for i,s in enumerate(sizes,1):
        if s>=min_area or i in border_labels: bg|=(lab==i)
    # edge band: pixels within 3px of bg that are not bg
    dist=ndi.distance_transform_edt(~bg)
    band=(~bg)&(dist<=3)
    W=np.array([255,255,255],np.float32)
    v=W-B; vv=(v*v).sum()
    alpha=np.ones((h,w),np.float32); alpha[bg]=0
    proj=((a-B)*v).sum(-1)/vv
    alpha[band]=np.clip(proj[band],0,1)
    rgb=a.copy()
    # decontaminate band: un-premultiply toward white
    m=band&(alpha>0.02)
    rgb[m]=np.clip((a[m]-(1-alpha[m,None])*B)/alpha[m,None],0,255)
    # slight feather
    alpha=ndi.gaussian_filter(alpha,0.6)*(1-bg)+0*bg
    rgba=np.dstack([rgb,alpha*255]).astype(np.uint8)
    ys,xs=np.where(alpha>0.05)
    y0,y1,x0,x1=max(0,ys.min()-6),min(h,ys.max()+7),max(0,xs.min()-6),min(w,xs.max()+7)
    Image.fromarray(rgba[y0:y1,x0:x1],'RGBA').save(out)
    print(os.path.basename(out), 'bg',B.astype(int), 'size',(x1-x0,y1-y0), 'bg frac',bg.mean().round(3))

# ---------------------------------------------------------------------------
# Scontorno dei ritagli halftone (sfondo giallo o chiaro uniforme, contorno bianco).
# Uso singolo:   python3 keyer.py <immagine> <uscita.png> [soglia]
# Rigenerare i ritagli del trailer (sorgenti in 202606_matcha/materials, accanto alla cartella trailer):
#                python3 keyer.py --all
# I risultati vanno in images/out/ e si copiano a mano in 03_animation/assets/img dopo averli controllati.
from pathlib import Path
HERE = Path(__file__).resolve().parent
MATERIALS = HERE.parents[3] / "materials"   # 202606_matcha/materials
JOBS = {
    "women_laugh": "3d7311d8-384f-4883-b3af-5ee1d110dff4.png",
    "men_dance": "b4b09845-bf6c-4df6-92d1-bd81abed1a2b.png",
    "woman_phone_cringe": "1b.png",
    "woman_laugh_wine": "ChatGPT Image 20 lug 2026, 16_24_08.png",
    "couple_toast": "watermark-removed-Gemini_Generated_Image_fg0vupfg0vupfg0v.jpg",
    "woman_phone_smile": "1a.png",
    "woman_phone_cringe2": "1c.png",
    "man_sunglasses": "111befad-d830-4913-b259-51a8a33905d9.png",
}
if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] != "--all":
        key(sys.argv[1], sys.argv[2], t1=float(sys.argv[3]) if len(sys.argv) > 3 else 42)
    elif len(sys.argv) == 2 and sys.argv[1] == "--all":
        (HERE / "out").mkdir(exist_ok=True)
        for k, v in JOBS.items():
            key(str(MATERIALS / v), str(HERE / "out" / f"{k}.png"))
    else:
        print(__doc__ or "uso: python3 keyer.py <immagine> <uscita.png> [soglia] | --all")
