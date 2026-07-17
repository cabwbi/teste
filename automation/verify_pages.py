#!/usr/bin/env python3
"""Aguarda o GitHub Pages e compara os arquivos de dados publicados."""
from __future__ import annotations
import argparse, hashlib, time
from pathlib import Path
import requests

FILES = ("contracts-data.js", "credit-data.js", "rp-data.js", "suprimento-data.js", "contracts-summary.json", "credit-current.json")

def main():
    p=argparse.ArgumentParser(); p.add_argument("--repo",type=Path,required=True); p.add_argument("--url",required=True); p.add_argument("--attempts",type=int,default=36); a=p.parse_args()
    base=a.url.rstrip("/")
    expected={f:hashlib.sha256((a.repo/f).read_bytes()).hexdigest() for f in FILES}
    for attempt in range(1,a.attempts+1):
        try:
            ok=True
            for name,digest in expected.items():
                r=requests.get(f"{base}/{name}?verify={attempt}-{int(time.time())}",timeout=60); r.raise_for_status()
                ok &= hashlib.sha256(r.content).hexdigest()==digest
            if ok:
                print("GitHub Pages verificado com todos os arquivos de dados sincronizados."); return
        except requests.RequestException:
            pass
        time.sleep(10)
    raise SystemExit("GitHub Pages não refletiu os dados dentro do prazo de verificação.")
if __name__=="__main__": main()
