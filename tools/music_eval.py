import json, base64, subprocess, sys, os, glob, time
names=sys.argv[1:]
prompt=("Sei un music supervisor per spot pubblicitari. Ascolta questo brano strumentale di libreria e rispondi SOLO in JSON con i campi: "
"genere, mood (3-5 aggettivi), strumenti, voce (none/vocal chops/cantato), bpm_stimato, tonalita_maggiore_o_minore, "
"qualita_produzione (1-10), moderno_vs_datato (1=datato,10=moderno), cheesy (1=per nulla,10=molto), energia (1-10), "
"adatto_spot (1-10) per il trailer di 30 secondi di un'app di appuntamenti dal vivo: tono caldo, ironico, emozionante, aperitivo a Milano, target 25-40, "
"sezioni: lista di {inizio_s, fine_s, descrizione} (intro, strofa, drop/ritornello, break, finale), "
"miglior_drop_s (istante in secondi del momento piu esplosivo/liberatorio), finale_pulito (true/false, se il brano chiude con un accordo/colpo finale netto), "
"commento (max 25 parole, in italiano).")
jobs=[]
for n in names:
    p=glob.glob(f'02_assets/music/candidates/{n}*.mp3')[0]
    b=base64.b64encode(open(p,'rb').read()).decode()
    body={"contents":[{"parts":[{"inlineData":{"mimeType":"audio/mpeg","data":b}},{"text":prompt}]}],"generationConfig":{"temperature":0.2,"responseMimeType":"application/json"}}
    bp=f'02_assets/_raw/req/music_eval_{n}.json'; json.dump(body,open(bp,'w'))
    jobs.append({"_name":f"meval_{n}","type":"http","method":"POST","url":"https://generativelanguage.googleapis.com/v1beta/models/"+os.environ.get("MODEL","gemini-2.5-flash")+":generateContent","headers":{"x-goog-api-key":"{{GEMINI_API_KEY}}"},"body_file":bp,"out":f"02_assets/_raw/music_eval_{n}.json","timeout":180})
r=subprocess.run(["python3","tools/q.py","submit"],input=json.dumps(jobs),capture_output=True,text=True); print(r.stdout.strip())
