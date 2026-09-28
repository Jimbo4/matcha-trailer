# Cue sheet principale (secondi). Gli stessi tempi sono in js/core.js (oggetto T): se cambi DROP/JUMP/HIT, aggiorna entrambi.
from paths import ASSETS
BAR = 1.875
BEAT = BAR/4
DROP = 5.625
JUMP = 20.625
FINAL_HIT = 28.125
DURATION = 30.0
VO_SRC = str(ASSETS / 'voice/takes/vo_Leda.wav')
# (id, text, src_start, src_end, timeline_start)
VO = [
 ("L1a","Tre settimane di chat.",            0.10, 1.50,  0.30),
 ("L1b","Zero appuntamenti.",                2.03, 3.42,  1.95),
 ("L2", "Romantico, eh?",                    4.01, 6.22,  3.50),
 ("L3", "Le cose belle non succedono in chat.",6.87, 8.73, 5.80),
 ("L4", "Succedono al primo brindisi.",      9.50, 11.13, 7.80),
 ("L5", "In una risata che non ti aspettavi.",11.92,13.59, 9.62),
 ("L6a","In uno sguardo che dice:",          13.74,15.58, 11.50),
 ("L6b","restiamo ancora un po'.",           15.86,16.94, 13.55),
 ("L7a","Da un match a un tavolo vero.",     17.87,19.68, 15.55),
 ("L7b","Devi solo presentarti.",            20.27,21.60, 18.95),
 ("L8a","Matcha.",                           22.72,23.30, 20.85),
 ("L8b","Per te che vuoi uscire davvero.",   24.05,25.62, 21.80),
]
MUSIC_SRC = str(ASSETS / 'music/candidates/me_and_you_851.mp3')
# music edit segments: (src_start, timeline_start, timeline_end)
SEG_A_SRC = 84.500   # bar 45 -> t=0 ; drop (bar 48) at 90.125 -> t=5.625
SEG_B_SRC = 142.627  # bar 76 transient -> t=JUMP
