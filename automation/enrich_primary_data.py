#!/usr/bin/env python3
"""Enriquece credit-data e contracts-data para manter o esquema funcional da producao."""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path
from typing import Any

import xlrd
from openpyxl import load_workbook


def text(v: Any) -> str:
    if v is None:
        return ""
    s = str(v).strip().lstrip("'")
    return s[:-2] if re.fullmatch(r"-?\d+\.0", s) else s


def number(v: Any) -> float:
    try:
        return float(v or 0)
    except (TypeError, ValueError):
        return 0.0


def money(v: Any) -> float:
    return round(number(v) + 0.0, 2)


def norm(v: Any) -> str:
    raw = unicodedata.normalize("NFKD", text(v)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^A-Z0-9]+", "_", raw.upper()).strip("_")


def iso(v: Any) -> str:
    if isinstance(v, datetime):
        return v.strftime("%Y-%m-%d")
    if isinstance(v, date):
        return v.isoformat()
    s = text(v)
    return s[:10] if re.match(r"^\d{4}-\d{2}-\d{2}", s) else ""


def rows(path: Path, header_row: int = 1) -> list[dict[str, Any]]:
    if path.suffix.lower() == ".xls":
        wb = xlrd.open_workbook(path, on_demand=True)
        ws = wb.sheet_by_index(0)
        headers = [norm(ws.cell_value(header_row - 1, c)) for c in range(ws.ncols)]
        out = []
        for r in range(header_row, ws.nrows):
            vals = []
            for c in range(ws.ncols):
                cell = ws.cell(r, c)
                value = cell.value
                if cell.ctype == xlrd.XL_CELL_DATE:
                    try:
                        value = xlrd.xldate.xldate_as_datetime(value, wb.datemode)
                    except (OverflowError, ValueError):
                        pass
                vals.append(value)
            if any(v not in (None, "") for v in vals):
                out.append(dict(zip(headers, vals)))
        wb.release_resources()
        return out
    wb = load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    ws.reset_dimensions()
    it = ws.iter_rows(values_only=True)
    for _ in range(header_row - 1):
        next(it)
    headers = [norm(v) for v in next(it)]
    out = [dict(zip(headers, r)) for r in it if any(v is not None for v in r)]
    wb.close()
    return out


def locate(root: Path, stem: str) -> Path:
    target = norm(stem)
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in {".xls", ".xlsx"} and norm(p.stem) == target:
            return p
    raise FileNotFoundError(stem)


def get(row: dict[str, Any], *names: str) -> Any:
    for name in names:
        k = norm(name)
        if k in row and row[k] not in (None, ""):
            return row[k]
    return ""


def load_js(path: Path, prefix: str) -> Any:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw.startswith(prefix) or not raw.endswith(";"):
        raise ValueError(f"Formato inesperado em {path}")
    return json.loads(raw[len(prefix):-1].strip())


def write_js(path: Path, prefix: str, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(prefix + json.dumps(obj, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + ";\n", encoding="utf-8")


def split_codes(v: Any) -> list[str]:
    s = text(v)
    return [x for x in re.split(r"[,;/\s]+", s) if x] if s else []


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--inputs", type=Path, required=True)
    ap.add_argument("--repo", type=Path, required=True)
    args = ap.parse_args()

    repo = args.repo
    credit_path = repo / "credit-data.js"
    contracts_path = repo / "contracts-data.js"
    credit = load_js(credit_path, "window.CABW_CREDIT_DATA = ")
    contracts = load_js(contracts_path, "window.CABW_CONTRACTS_DATA = ")

    reqs = rows(locate(args.inputs, "requisicoes"), 1)
    orders = rows(locate(args.inputs, "ordem_de_compra"), 1)
    signing_rows = rows(locate(args.inputs, "ordem_de_compra_em_assinatura"), 3)
    nl = rows(locate(args.inputs, "NL_requisicao"), 1)
    try:
        hist = rows(locate(args.inputs, "historico_obs"), 1)
    except FileNotFoundError:
        hist = []

    om_lookup = dict(credit.get("lookups", {}).get("om", {}))
    project_lookup = dict(credit.get("lookups", {}).get("projetos", {}))
    digits = credit.get("digits", [])
    digit_by_code = {text(x.get("digito")): x for x in digits if text(x.get("digito"))}

    req_by_po: dict[str, list[dict[str, Any]]] = defaultdict(list)
    req_by_id: dict[str, dict[str, Any]] = {}
    for r in reqs:
        pedido = text(get(r, "PEDIDO"))
        if pedido:
            req_by_id[pedido] = r
        po = text(get(r, "NUM OC", "NUM_OC", "PO"))
        if po:
            req_by_po[po].append(r)

    order_by_po = {text(get(r, "PO")): r for r in orders if text(get(r, "PO"))}

    def req_codes(po: str) -> list[str]:
        codes = []
        for r in req_by_po.get(po, []):
            pedido = text(get(r, "PEDIDO"))
            if len(pedido) >= 2 and pedido[:2] not in codes:
                codes.append(pedido[:2])
        return codes

    def req_ids(po: str) -> list[str]:
        return [text(get(r, "PEDIDO")) for r in req_by_po.get(po, []) if text(get(r, "PEDIDO"))]

    def req_description(po: str) -> str:
        vals = []
        for r in req_by_po.get(po, []):
            v = text(get(r, "NOMENCLATURA", "DESCRIÇÃO DO MATERIAL", "DESCRICAO DO MATERIAL"))
            if v and v not in vals:
                vals.append(v)
        return "; ".join(vals)

    # Liquidacoes por PO
    paid_by_po: dict[str, float] = defaultdict(float)
    nl_by_po: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for r in nl:
        po = text(get(r, "PO"))
        if not po:
            continue
        value = money(get(r, "VALOR PAGO NO PEDIDO"))
        if value:
            paid_by_po[po] += value
        nl_by_po[po].append(r)

    # Enriquecer POs correntes
    current_pos = []
    for item in credit.get("pos", credit.get("purchaseOrders", [])):
        x = dict(item)
        po = text(x.get("po"))
        codes = req_codes(po)
        if not codes:
            direct = text(get(order_by_po.get(po, {}), "UNIDADE REQUISITANTE"))
            if direct:
                codes = [direct]
        labels = [om_lookup.get(c, c) for c in codes]
        x["omCodigo"] = codes[0] if len(codes) == 1 else ""
        x["omCodigos"] = codes
        x["omLabels"] = labels
        if labels:
            x["om"] = " / ".join(labels)
            x["omLabel"] = x["om"]
            x["omSigla"] = labels[0].split(" - ", 1)[0]
            x["sigla"] = x["omSigla"]
        ids = req_ids(po)
        x["requisicoes"] = ids
        x["requisicaoPrincipal"] = ids[0] if ids else ""
        x["descricaoRequisicao"] = req_description(po)
        liq = money(min(max(0.0, paid_by_po.get(po, 0.0)), max(0.0, number(x.get("valorUsd")))))
        x["liquidadoNlUsd"] = liq
        x["empenhadoNaoLiquidadoUsd"] = money(max(0.0, number(x.get("valorUsd")) - liq))
        current_pos.append(x)

    # Enriquecer POs em assinatura via digito
    signing = []
    for base, raw in zip(credit.get("signing", credit.get("signatureOrders", [])), signing_rows):
        x = dict(base)
        dig = text(x.get("digito") or get(raw, "DIGITO", "DÍGITO"))
        d = digit_by_code.get(dig, {})
        om_codes = split_codes(d.get("omUnid") or d.get("omCodigo"))
        if not om_codes:
            om_codes = split_codes(get(raw, "OM"))
        labels = [om_lookup.get(c, c) for c in om_codes]
        x["omCodigo"] = om_codes[0] if len(om_codes) == 1 else ""
        x["omCodigos"] = om_codes
        x["omLabels"] = labels
        x["om"] = " / ".join(labels) if labels else text(get(raw, "OM"))
        x["omLabel"] = x["om"]
        x["omSigla"] = labels[0].split(" - ", 1)[0] if labels else ""
        x["sigla"] = x["omSigla"]
        x["acao"] = text(d.get("acao"))
        x["natureza"] = text(d.get("natureza"))
        projects = split_codes(d.get("projetos"))
        x["projeto"] = projects[0] if projects else ""
        x["projetoLabel"] = (f"{projects[0]} - {project_lookup[projects[0]]}" if projects and projects[0] in project_lookup else (projects[0] if projects else ""))
        x["projetosLabels"] = [f"{p} - {project_lookup[p]}" if p in project_lookup else p for p in projects]
        alteration = text(get(raw, "ALTERAÇÃO", "ALTERACAO")) or text(x.get("objetoResumo"))
        x["alteracao"] = alteration
        x["isAmend"] = bool(re.match(r"^AMEND\b", alteration, re.I))
        x["objetoResumo"] = alteration
        signing.append(x)

    credit["pos"] = current_pos
    credit["purchaseOrders"] = current_pos
    credit["signing"] = signing
    credit["signatureOrders"] = signing
    meta = credit.setdefault("meta", {})
    meta["fonteLiquidacoes"] = "NL_requisicao.xlsx - VALOR PAGO NO PEDIDO das POs do exercício"
    meta["eligibleSignatureOrders"] = sum(not x.get("isAmend") for x in signing)
    meta["liquidatedPurchaseOrders2026Usd"] = money(sum(number(x.get("liquidadoNlUsd")) for x in current_pos))
    write_js(credit_path, "window.CABW_CREDIT_DATA = ", credit)
    write_js(repo / "assets/js/credit-data.js", "window.CABW_CREDIT_DATA = ", credit)
    for name in ("credit-current.json", "credit-10062026.json", "credit-11062026.json"):
        content = json.dumps(credit, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + "\n"
        (repo / name).write_text(content, encoding="utf-8")
        target = repo / "assets/data" / name
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8")

    # Contratos: mapear POs por PAG ou cotacao da requisicao.
    contract_list = contracts.get("contracts", contracts.get("records", []))
    contract_ids = {text(c.get("contrato")): c for c in contract_list if text(c.get("contrato"))}
    by_number = defaultdict(list)
    for c in contract_list:
        for key in {text(c.get("contrato")), text(c.get("numero"))}:
            if key:
                by_number[key].append(text(c.get("contrato")))

    po_contract: dict[str, tuple[str, str]] = {}
    for r in orders:
        po = text(get(r, "PO"))
        if not po:
            continue
        pag = text(get(r, "PAG"))
        if pag in contract_ids:
            po_contract[po] = (pag, "PAG")
            continue
        candidates = []
        for req in req_by_po.get(po, []):
            quote = text(get(req, "COTAÇÃO", "COTACAO"))
            if quote and quote in by_number:
                candidates.extend(by_number[quote])
        candidates = list(dict.fromkeys(candidates))
        if len(candidates) == 1:
            po_contract[po] = (candidates[0], "COTAÇÃO")

    po_details: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for po, (contract_id, origin) in po_contract.items():
        r = order_by_po.get(po, {})
        codes = req_codes(po)
        if not codes:
            direct = text(get(r, "UNIDADE REQUISITANTE"))
            if direct:
                codes = [direct]
        labels = [om_lookup.get(c, c) for c in codes]
        po_details[contract_id].append({
            "po": po,
            "data": iso(get(r, "DATA")),
            "fornecedor": " - ".join(v for v in [text(get(r, "FORNECEDOR")), text(get(r, "NOME FORNECEDOR"))] if v),
            "objetoResumo": req_description(po),
            "projeto": text(get(r, "PROJETO")),
            "valorTotalUsd": money(get(r, "VAL TOT USD")),
            "valorFaturadoUsd": money(get(r, "TOT FATUR USD")),
            "saldoUsd": money(get(r, "SALDO USD")),
            "requisicoes": req_ids(po),
            "omCodigo": codes[0] if len(codes) == 1 else "",
            "om": " / ".join(labels),
            "omCodigos": codes,
            "omLabels": labels,
            "origemVinculoContrato": origin,
        })

    liquidation: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for po, (contract_id, _) in po_contract.items():
        for r in nl_by_po.get(po, []):
            dt = get(r, "DATA")
            val = money(get(r, "VALOR PAGO NO PEDIDO"))
            if not val:
                continue
            req = text(get(r, "REQUISIÇÃO", "REQUISICAO"))
            om_code = req[:2] if len(req) >= 2 else (req_codes(po)[0] if req_codes(po) else "")
            liquidation[contract_id].append({
                "po": po,
                "fatura": text(get(r, "FATURA")),
                "valor": val,
                "data": iso(dt),
                "requisicao": req,
                "omCodigo": om_code,
                "om": om_lookup.get(om_code, om_code),
            })

    current_year = int(credit.get("meta", {}).get("geradoEm", str(datetime.now().year))[:4])
    monthly = {}
    monthly_details = {}
    for cid in contract_ids:
        monthly[cid] = {"current": [0.0] * 12, "previous": [0.0] * 12}
        monthly_details[cid] = {"current": [[] for _ in range(12)], "previous": [[] for _ in range(12)]}
        for item in liquidation.get(cid, []):
            ds = item.get("data", "")
            if not re.match(r"^\d{4}-\d{2}-\d{2}$", ds):
                continue
            y, m = int(ds[:4]), int(ds[5:7])
            if y == current_year:
                period = "current"
            elif y == current_year - 1:
                period = "previous"
            else:
                continue
            monthly[cid][period][m - 1] = money(monthly[cid][period][m - 1] + item["valor"])
            monthly_details[cid][period][m - 1].append({
                "po": item["po"], "fatura": item["fatura"], "valor": item["valor"], "data": item["data"], "requisicao": item["requisicao"]
            })

    # Historico de ocorrencias: primeira coluna e' o contrato.
    occurrences: dict[str, list[dict[str, Any]]] = defaultdict(list)
    valid_hist = 0
    linked_hist = 0
    for r in hist:
        if not r:
            continue
        first_key = next(iter(r))
        cid = text(r.get(first_key))
        if not cid:
            continue
        valid_hist += 1
        if cid not in contract_ids:
            continue
        linked_hist += 1
        observation = text(get(r, "OBSERVAÇÃO", "OBSERVACAO", "OCORRÊNCIA", "OCORRENCIA", "HISTÓRICO", "HISTORICO"))
        if not observation:
            # primeiro texto descritivo diferente do contrato
            for k, v in r.items():
                val = text(v)
                if k != first_key and val and not re.fullmatch(r"\d+(?:\.0)?", val):
                    observation = val
                    break
        occurrences[cid].append({
            "data": iso(get(r, "DATA", "DATA OCORRENCIA", "DT OCORRENCIA")),
            "observacao": observation,
            "numero": text(get(r, "NÚMERO", "NUMERO", "NR")),
            "local": text(get(r, "LOCAL", "CAMINHO")),
            "usuario": text(get(r, "USUÁRIO", "USUARIO")),
            "registradoEm": iso(get(r, "REGISTRADO EM", "DATA REGISTRO", "DT REGISTRO")),
        })

    contracts["poDetails"] = dict(po_details)
    contracts["purchaseOrdersByContract"] = dict(po_details)
    contracts["liquidationDetailsByContract"] = dict(liquidation)
    contracts["invoiceMonthlyByContract"] = monthly
    contracts["invoiceMonthlyMeta"] = {"currentYear": current_year, "previousYear": current_year - 1}
    contracts["invoiceMonthlyDetailsByContract"] = monthly_details
    contracts["occurrencesByContract"] = dict(occurrences)
    contracts["occurrencesMeta"] = {
        "totalRegistrosValidos": valid_hist,
        "registrosVinculados": linked_hist,
        "registrosSemContratoAtual": max(0, valid_hist - linked_hist),
        "contratosComOcorrencias": len(occurrences),
        "fonte": "historico_obs.xlsx",
        "criterioVinculo": "Primeira coluna CONTRATO correlacionada com a primeira coluna de controle_financeiro_contratos.xlsx.",
    }
    cmeta = contracts.setdefault("meta", {})
    cmeta["fonteOcorrencias"] = "historico_obs.xlsx"
    cmeta["faturasDetalheTotal"] = sum(len(v) for v in liquidation.values())
    cmeta["faturasDetalhePreenchidas"] = cmeta["faturasDetalheTotal"]
    cmeta["correcao"] = "Categorias por Grande Comando/CAGE; POs vinculadas por PAG ou cotação; liquidações históricas por NL_requisicao; ocorrências por historico_obs."
    write_js(contracts_path, "window.CABW_CONTRACTS_DATA = ", contracts)
    write_js(repo / "assets/js/contracts-data.js", "window.CABW_CONTRACTS_DATA = ", contracts)

    print(json.dumps({
        "creditLiquidated": meta["liquidatedPurchaseOrders2026Usd"],
        "eligibleSignatureOrders": meta["eligibleSignatureOrders"],
        "contractPoLinks": sum(len(v) for v in po_details.values()),
        "contractLiquidations": sum(len(v) for v in liquidation.values()),
        "occurrencesLinked": linked_hist,
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
