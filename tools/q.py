#!/usr/bin/env python3
"""Helper per la coda del runner: submit / wait / status."""
import json, os, sys, time, uuid
TOOLS = os.path.dirname(os.path.abspath(__file__))
Q = os.path.join(TOOLS, 'queue'); D = os.path.join(TOOLS, 'done')

def submit(job, name=None):
    jid = (name or job.get('type', 'job')) + '_' + time.strftime('%H%M%S') + '_' + uuid.uuid4().hex[:4]
    tmp = os.path.join(Q, jid + '.json.tmp')
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(job, f, ensure_ascii=False)
    os.rename(tmp, os.path.join(Q, jid + '.json'))
    return jid

def result(jid):
    p = os.path.join(D, jid + '.result.json')
    if os.path.exists(p):
        try:
            with open(p, encoding='utf-8-sig') as f:
                return json.load(f)
        except Exception:
            return None
    return None

def wait(ids, timeout=165):
    t0 = time.time(); out = {}
    while time.time() - t0 < timeout:
        for i in ids:
            if i not in out:
                r = result(i)
                if r is not None: out[i] = r
        if len(out) == len(ids): break
        time.sleep(1)
    return out

if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'submit':
        jobs = json.loads(sys.stdin.read())
        if isinstance(jobs, dict): jobs = [jobs]
        ids = [submit(j, j.pop('_name', None)) for j in jobs]
        print(json.dumps(ids))
    elif cmd == 'wait':
        ids = sys.argv[2:]
        timeout = 165
        res = wait(ids, timeout)
        for i in ids:
            r = res.get(i)
            if r is None: print(i, 'PENDING')
            else:
                r2 = {k: v for k, v in r.items() if k not in ('started', 'finished')}
                if isinstance(r2.get('error'), str): r2['error'] = r2['error'][:1500]
                print(json.dumps(r2, ensure_ascii=False))
