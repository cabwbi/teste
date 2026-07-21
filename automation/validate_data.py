#!/usr/bin/env python3
"""Valida schemas, totais, RP, classificações, espelhos e allowlist."""
from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

PREFIXES = {
    "contracts-data.js": "window.CABW_CONTRACTS_DATA = ",
    "credit-data.js": "window.CABW_CREDIT_DATA = ",
    "rp-data.js": "window.CABW_RP_DATA = ",
    "suprimento-data.js": "window.CABW_SUPRIMENTO_DATA = ",
}
MIRRORS = {
    "contracts-data.js": "assets/js/contracts-data.js", "credit-data.js": "assets/js/credit-data.js",
    "rp-data.js": "assets/js/rp-data.js", "suprimento-data.js": "assets/js/suprimento-data.js",
    "contracts-summary.json": "assets/data/contracts-summary.json", "credit-current.json": "assets/data/credit-current.json",
    "credit-10062026.json": "assets/data/credit-10062026.json", "credit-11062026.json": "assets/data/credit-11062026.json",
}
PANEL_SCRIPTS = (
    "contracts-panel.js", "assets/js/contracts-panel.js",
    "credit-panel.js", "assets/js/credit-panel.js",
    "rp-panel.js", "assets/js/rp-panel.js", "suprimento-fundos.js",
)
HTML_SCRIPT_CHAINS = {
    "contratos.html": ("contracts-data.js", "contracts-panel.js"),
    "contratos-administrativos.html": ("contracts-data.js", "contracts-panel.js"),
    "contratos-finalisticos.html": ("contracts-data.js", "contracts-panel.js"),
    "fms.html": ("contracts-data.js", "contracts-panel.js"),
    "credito.html": ("credit-data.js", "credit-panel.js"),
    "action.html": ("credit-data.js", "credit-panel.js"),
    "consistency.html": ("credit-data.js", "credit-panel.js"),
    "detail.html": ("credit-data.js", "credit-panel.js"),
    "ug.html": ("credit-data.js", "credit-panel.js"),
    "governanca-rp.html": ("rp-data.js", "rp-panel.js"),
    "suprimento-fundos.html": ("suprimento-data.js", "suprimento-fundos.js"),
}


def load_js(path: Path, prefix: str):
    raw = path.read_text(encoding="utf-8")
    if not raw.startswith(prefix):
        raise AssertionError(f"Prefixo JS inválido: {path}")
    return json.loads(raw[len(prefix):].strip().rstrip(";"))


def close(a: float, b: float, tolerance: float = 0.05) -> bool:
    return abs(a - b) <= tolerance


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--allowlist", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    allowed = {line.strip() for line in args.allowlist.read_text().splitlines() if line.strip()}
    for path in allowed:
        if not (args.repo / path).is_file():
            raise AssertionError(f"Arquivo obrigatório ausente: {path}")
    changed = subprocess.check_output(["git", "diff", "--name-only"], cwd=args.repo, text=True).splitlines()
    unauthorized = sorted(set(changed) - allowed)
    if unauthorized:
        raise AssertionError(f"Arquivos fora da allowlist alterados: {unauthorized}")
    for root, mirror in MIRRORS.items():
        if (args.repo / root).read_bytes() != (args.repo / mirror).read_bytes():
            raise AssertionError(f"Espelhos divergentes: {root} e {mirror}")
    data = {name: load_js(args.repo / name, prefix) for name, prefix in PREFIXES.items()}
    contracts = data["contracts-data.js"]
    credit = data["credit-data.js"]
    rp = data["rp-data.js"]
    sf = data["suprimento-data.js"]
    assert contracts["contracts"] and credit["digits"] and credit["pos"] and rp["records"] and sf["orders"]
    assert contracts.get("records") == contracts["contracts"], "Alias records incompatível com contracts"
    assert contracts.get("data") == contracts["contracts"], "Alias data incompatível com contracts"
    assert contracts["summary"]["total"] == len(contracts["contracts"])
    assert sum(contracts["summary"]["counts"].values()) == len(contracts["contracts"])
    for record in contracts["contracts"]:
        expected = "fms" if record["cage"] == "W2525" else ("administrativos" if record["grandeComando"] == "CW" else "finalisticos")
        assert record["categoria"] == expected, f"Classificação inválida: {record['contrato']}"
    assert credit["meta"]["purchaseOrders2026"] == len(credit["pos"])
    assert credit["purchaseOrders"] == credit["pos"] and credit["signatureOrders"] == credit["signing"]
    assert sf["summary"]["totalOrders"] == len(sf["orders"])
    assert close(sf["summary"]["totalSaldoUsd"], sum(x["saldoUsd"] for x in sf["orders"]))
    assert rp["summary"]["totalRegistros"] == len(rp["records"])
    assert close(rp["summary"]["totalSaldoUsd"], sum(x["saldoAtualUsd"] for x in rp["records"]))
    evolution = rp["rpEvolution"]
    liquidated = sum(sum(x["liquidacoes2026"]) for x in evolution["items"])
    assert close(liquidated, evolution["totalLiquidacoes2026Usd"])
    assert close(evolution["resumoGeral"]["inscrito"], evolution["resumoGeral"]["atual"] + evolution["resumoGeral"]["liquidado"])
    dpe_monthly = [0.0] * 12
    for item in evolution["items"]:
        projection = item.get("projecaoDpe2026")
        assert isinstance(projection, list) and len(projection) == 12, f"Projeção DPE inválida: {item['po']}"
        expected = item["saldoAtualUsd"] + sum(item["liquidacoes2026"])
        assert close(sum(projection), expected), f"Total da projeção DPE divergente: {item['po']}"
        for month, value in enumerate(projection):
            dpe_monthly[month] += value
    assert any(value > 0.005 for value in dpe_monthly), "Projeção DPE sem valores"
    projected_balance = evolution["resumoGeral"]["inscrito"]
    dpe_balances = [projected_balance]
    for value in dpe_monthly:
        projected_balance = max(0.0, projected_balance - value)
        dpe_balances.append(projected_balance)
    assert len({round(value, 2) for value in dpe_balances}) > 1, "Projeção DPE constante"
    for name in PREFIXES:
        subprocess.run(["node", "--check", str(args.repo / name)], check=True, capture_output=True)
    for name in PANEL_SCRIPTS:
        subprocess.run(["node", "--check", str(args.repo / name)], check=True, capture_output=True)
    panel_source = (args.repo / "contracts-panel.js").read_text(encoding="utf-8")
    assert "root.records,root.contracts,root.data" in panel_source, "Painel sem fallback compatível da coleção de contratos"
    for html_name, scripts in HTML_SCRIPT_CHAINS.items():
        html = (args.repo / html_name).read_text(encoding="utf-8")
        positions = []
        for script in scripts:
            marker = f'src="{script}"'
            assert marker in html, f"Script obrigatório ausente em {html_name}: {script}"
            positions.append(html.index(marker))
        assert positions == sorted(positions), f"Ordem de scripts inválida em {html_name}: dados devem preceder o painel"
    for name in ("contracts-summary.json", "credit-current.json", "credit-10062026.json", "credit-11062026.json"):
        json.loads((args.repo / name).read_text(encoding="utf-8"))
    status = "sem alteração de dados" if not changed else f"{len(changed)} arquivo(s) de dados alterado(s)"
    report = [
        "# Relatório da atualização automática do SISCABW", "",
        f"- Resultado: validação aprovada; {status}.",
        f"- Contratos: {len(contracts['contracts'])}.",
        f"- Ordens de compra do ano: {len(credit['pos'])}.",
        f"- Registros de RP: {len(rp['records'])}; saldo: US$ {rp['summary']['totalSaldoUsd']:,.2f}.",
        f"- Suprimentos de fundos: {len(sf['orders'])}.",
        "- Integridade: schemas, totais, reconstrução e projeção DPE de RP, classificações, JSON/JavaScript, espelhos e allowlist aprovados.",
    ]
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text("\n".join(report) + "\n", encoding="utf-8")
    print("Validação concluída com sucesso.")


if __name__ == "__main__":
    main()
