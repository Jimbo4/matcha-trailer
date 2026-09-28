import numpy as np
from scipy import signal
def lr4(x, fc, sr, kind):
    sos = signal.butter(2, fc, kind, fs=sr, output='sos')
    return signal.sosfilt(sos, signal.sosfilt(sos, x))
def deess(x, sr, fc=4800, thr_db=-4.0, ratio=4.0, max_gr=8.0, att=0.0006, rel=0.055):
    """Split-band relative de-esser: turns down only the band above fc when its level
    rises above the level of the body of the voice (sibilants), leaving vowels untouched."""
    lo = lr4(x, fc, sr, 'low'); hi = lr4(x, fc, sr, 'high')
    # detectors: 3 ms RMS of the sibilant band (5-11 kHz) vs the voice body (150 Hz-4 kHz)
    sos_h = signal.butter(4, [5000, 11500], 'band', fs=sr, output='sos')
    sos_b = signal.butter(4, [150, 4000], 'band', fs=sr, output='sos')
    a = np.exp(-1 / (0.003 * sr))
    eh = signal.lfilter([1 - a], [1, -a], signal.sosfilt(sos_h, x) ** 2)
    eb = signal.lfilter([1 - a], [1, -a], signal.sosfilt(sos_b, x) ** 2)
    s_db = 10 * np.log10(eh + 1e-12) - 10 * np.log10(eb + 1e-12)
    # ignore near-silence (breaths/noise floor)
    lvl = 10 * np.log10(eh + eb + 1e-12)
    over = np.maximum(0.0, s_db - thr_db) * (1 - 1 / ratio)
    over = np.where(lvl < -55, 0.0, np.minimum(over, max_gr))
    # attack/release smoothing on a decimated control signal
    D = 8; o = over[::D]; y = np.zeros_like(o); v = 0.0
    aa = np.exp(-1 / (att * sr / D)); ar = np.exp(-1 / (rel * sr / D))
    for i in range(len(o)):
        t = o[i]; v = aa * v + (1 - aa) * t if t > v else ar * v + (1 - ar) * t; y[i] = v
    gr = np.interp(np.arange(len(x)), np.arange(0, len(x), D), y)
    return lo + hi * 10 ** (-gr / 20), gr
