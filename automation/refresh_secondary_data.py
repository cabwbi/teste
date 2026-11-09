#!/usr/bin/env python3
"""Regenera dados secundarios do SISCABW a partir das fontes atuais.

Objetivos:
- eliminar home/processos/compatibilizacao congelados;
- manter os KPIs da entrada coerentes com os arquivos detalhados;
- reconstruir processos e compatibilizacao a cada mudanca das planilhas.
"""
from __future__ import annotations

import argparse
import json
import re
import unicodedata
from collections import Counter, defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path
from typing import Any

import xlrd
from openpyxl import load_workbook


def text(value: Any) -> str:
    if value is None:
        return ""
    value = str(value).strip().lstrip("'")
    return value[:-2] if re.fullmatch(r"-?\d+\.0", value) else value


def number(value: Any) -> float:
    if value in (None, ""):
        return 0.0
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)
    raw = str(value).strip().replace("$", "").replace("US$", "").replace(" ", "")
    if "," in raw and "." in raw:
        if raw.rfind(",") > raw.rfind("."):
            raw = raw.replace(".", "").replace(",", ".")
        else:
            raw = raw.replace(",", "")
    elif "," in raw:
        raw = raw.replace(",", ".")
    try:
        return float(raw)
    except ValueError:
        return 0.0


def money(value: Any) -> float:
    return round(number(value) + 0.0, 2)


def norm(value: Any) -> str:
    raw = unicodedata.normalize("NFKD", text(value)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^A-Z0-9]+", "_", raw.upper()).strip("_")


def code(value: Any) -> str:
    return text(value)


def iso(value: Any) -> str:
    if isinstance(value, datetime):
        return value.strftime("%Y-%m-%d")
    if isinstance(value, date):
        return value.isoformat()
    raw = text(value)
    if re.match(r"^\d{4}-\d{2}-\d{2}", raw):
        return raw[:10]
    return ""


def as_date(value: Any) -> date | None:
    if isinstance(value, datetime):
        return value.date()
    if isinstance(value, date):
        return value
    raw = iso(value)
    if raw:
        try:
            return datetime.strptime(raw, "%Y-%m-%d").date()
        except ValueError:
            pass
    return None


def normalized_rows(path: Path, header_row: int = 1) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    if path.suffix.lower() == ".xls":
        wb = xlrd.open_workbook(path, on_demand=True)
        ws = wb.sheet_by_index(0)
        headers = [norm(ws.cell_value(header_row - 1, col)) for col in range(ws.ncols)]
        for ri in range(header_row, ws.nrows):
            values: list[Any] = []
            for ci in range(ws.ncols):
                cell = ws.cell(ri, ci)
                value = cell.value
                if cell.ctype == xlrd.XL_CELL_DATE:
                    try:
                        value = xlrd.xldate.xldate_as_datetime(value, wb.datemode)
                    except (OverflowError, ValueError):
                        pass
                values.append(value)
            if any(v not in (None, "") for v in values):
                rows.append(dict(zip(headers, values)))
        wb.release_resources()
        return rows

    wb = load_workbook(path, read_only=True, data_only=True)
    ws = wb.active
    ws.reset_dimensions()
    iterator = ws.iter_rows(values_only=True)
    for _ in range(header_row - 1):
        next(iterator)
    headers = [norm(v) for v in next(iterator)]
    for values in iterator:
        if any(v is not None for v in values):
            rows.append(dict(zip(headers, values)))
    return rows


def locate(inputs: Path, stem: str) -> Path:
    target = norm(stem)
    for p in inputs.rglob("*"):
        if p.is_file() and p.suffix.lower() in {".xls", ".xlsx"} and norm(p.stem) == target:
            return p
    raise FileNotFoundError(stem)


def get(row: dict[str, Any], *names: str) -> Any:
    for name in names:
        key = norm(name)
        if key in row and row[key] not in (None, ""):
            return row[key]
    return ""


def load_js(path: Path, prefix: str) -> Any:
    raw = path.read_text(encoding="utf-8").strip()
    if not raw.startswith(prefix) or not raw.endswith(";"):
        raise ValueError(f"Formato inesperado em {path.name}")
    return json.loads(raw[len(prefix):-1].strip())


def write_js(path: Path, prefix: str, obj: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(prefix + json.dumps(obj, ensure_ascii=False, separators=(",", ":"), allow_nan=False) + ";\n", encoding="utf-8")


def split_codes(value: Any) -> list[str]:
    raw = text(value)
    if not raw:
        return []
    return [p for p in re.split(r"[,;/\s]+", raw) if p]


def unique_join(values: list[str], sep: str = " - ") -> str:
    return sep.join(dict.fromkeys(v for v in values if v))


def faixa(value: float) -> str:
    if value <= 10_000:
        return "Até US$ 10 mil"
    if value <= 50_000:
        return "US$ 10 mil a US$ 50 mil"
    if value <= 250_000:
        return "US$ 50 mil a US$ 250 mil"
    if value <= 1_000_000:
        return "US$ 250 mil a US$ 1 milhão"
    return "Acima de US$ 1 milhão"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--inputs", type=Path, required=True)
    parser.add_argument("--repo", type=Path, required=True)
    args = parser.parse_args()

    repo = args.repo
    credit = load_js(repo / "credit-data.js", "window.CABW_CREDIT_DATA = ")
    contracts = load_js(repo / "contracts-data.js", "window.CABW_CONTRACTS_DATA = ")
    rp = load_js(repo / "rp-data.js", "window.CABW_RP_DATA = ")
    sf = load_js(repo / "suprimento-data.js", "window.CABW_SUPRIMENTO_DATA = ")

    status = json.loads((repo / "data-update-status.json").read_text(encoding="utf-8"))
    generated_at = text(status.get("geradoEm")) or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_year = int(credit.get("meta", {}).get("geradoEm", generated_at)[:4] or date.today().year)
    today = date.today()

    req_rows = normalized_rows(locate(args.inputs, "requisicoes"), 1)
    order_rows = normalized_rows(locate(args.inputs, "ordem_de_compra"), 1)
    nl_rows = normalized_rows(locate(args.inputs, "NL_requisicao"), 1)

    try:
        hist_rows = normalized_rows(locate(args.inputs, "historico_obs"), 1)
    except FileNotFoundError:
        hist_rows = []

    om_lookup = dict(credit.get("lookups", {}).get("om", {}))
    project_lookup = dict(credit.get("lookups", {}).get("projetos", {}))
    project_label = lambda p: f"{p} - {project_lookup[p]}" if p in project_lookup else (p or "Não informado")

    # Dados auxiliares das POs e contratos.
    order_by_po: dict[str, dict[str, Any]] = {}
    for row in order_rows:
        po = code(get(row, "PO"))
        if po:
            order_by_po[po] = row
    contract_ids = {code(x.get("contrato")) for x in contracts.get("contracts", []) if code(x.get("contrato"))}

    digit_by_code = {code(x.get("digito")): x for x in credit.get("digits", []) if code(x.get("digito"))}

    # Preserva apenas campos enriquecidos que não existem nas exportações de requisições.
    old_process = {}
    process_path = repo / "processos-data.js"
    if process_path.exists():
        try:
            old = load_js(process_path, "window.CABW_PROCESSOS_DATA = ")
            for row in (old.get("materials", []) + old.get("repairs", []) + old.get("otherRepairs", [])):
                req = code(row.get("requisicao"))
                if req:
                    old_process[req] = row
        except Exception:
            old_process = {}

    history_by_req: dict[str, dict[str, Any]] = {}
    for row in hist_rows:
        req = code(get(row, "REQUISIÇÃO", "REQUISICAO", "PEDIDO"))
        if req:
            history_by_req[req] = row

    materials: list[dict[str, Any]] = []
    repairs: list[dict[str, Any]] = []
    other_repairs: list[dict[str, Any]] = []

    for raw in req_rows:
        pedido = code(get(raw, "PEDIDO"))
        if not pedido:
            continue
        cotacao = code(get(raw, "COTAÇÃO", "COTACAO"))
        certame = code(get(raw, "CERTAME", "CERTAME SILOMS", "CERTAME (COMPR AER)", "CERTAME (COMPRAER)"))
        status_text = text(get(raw, "STATUS"))
        is_repair = len(pedido) >= 4 and pedido[3].upper() == "R"
        main_scope = bool(cotacao and certame)
        status_upper = status_text.upper()
        other_scope = is_repair and not certame and status_upper.startswith("L-") and "REPAR" in status_upper
        if not main_scope and not other_scope:
            continue
        if main_scope and is_repair:
            target = repairs
        elif main_scope:
            target = materials
        else:
            target = other_repairs

        old = old_process.get(pedido, {})
        po = code(get(raw, "NUM OC", "NUM_OC", "PO"))
        po_row = order_by_po.get(po, {})
        om_code = pedido[:2]
        om_label = om_lookup.get(om_code, om_code)
        project = code(get(raw, "PRJ", "PROJETO"))
        digit = code(get(raw, "DÍGITO", "DIGITO"))
        digit_row = digit_by_code.get(digit, {})
        data_abertura = as_date(get(raw, "DT ABERTURA", "DATA ABERTURA"))
        dpe = as_date(get(raw, "DPE"))
        data_exp = as_date(get(raw, "DT REP EXP FORN", "DATA REP EXP FORN"))
        qtd = number(get(raw, "QTD", "QUANTIDADE"))
        qtd_rec = number(get(raw, "QTD REC", "QTD_REC", "QUANTIDADE RECEBIDA"))
        pending = max(0.0, qtd - qtd_rec)
        canceled = "CANCEL" in status_upper or status_upper.startswith("X-")
        atrasada = bool(dpe and dpe < today and pending > 0 and not canceled)

        valor_ref = money(get(raw, "VALOR TOTAL DE REFERENCIA", "VALOR TOTAL REFERENCIA"))
        valor = money(get(raw, "VALOR TOTAL", "VALOR EMPENHADO"))
        if not valor and old:
            valor = money(old.get("valorEmpenhadoUsd"))
        if not valor_ref:
            valor_ref = money(old.get("valorReferenciaUsd")) or valor

        supplier_code = code(get(po_row, "FORNECEDOR")) or code(old.get("empresaVencedoraCodigo"))
        supplier_name = text(get(po_row, "NOME FORNECEDOR")) or text(old.get("empresaVencedora"))
        supplier_label = unique_join([supplier_code, supplier_name])
        if not supplier_label:
            supplier_label = text(old.get("empresaVencedora"))

        pag = code(get(po_row, "PAG"))
        contract_origin = pag if pag in contract_ids else text(old.get("contratoOrigem")) or "Não localizado"
        po_value = money(get(po_row, "VAL TOT USD")) or money(old.get("valorOrdemCompraUsd"))
        po_balance = money(get(po_row, "SALDO USD")) or money(old.get("saldoPoUsd"))

        history = history_by_req.get(pedido, {})
        obs = text(get(history, "OBSERVAÇÃO", "OBSERVACAO", "OBS", "HISTÓRICO", "HISTORICO"))
        if not obs:
            obs = text(get(raw, "OBSERVAÇÃO", "OBSERVACAO", "OBS")) or text(old.get("observacaoRequisicao"))

        dispatched = is_repair and status_upper.startswith("L-") and "REPAR" in status_upper
        days_since = (today - data_exp).days if data_exp else None

        row = {
            "id": text(old.get("id")) or pedido,
            "requisicao": pedido,
            "cotacao": cotacao,
            "certame": certame,
            "dataAbertura": iso(data_abertura),
            "anoAbertura": str(data_abertura.year) if data_abertura else text(old.get("anoAbertura")),
            "omCodigo": om_code,
            "om": om_label,
            "projeto": project,
            "projetoLabel": project_label(project),
            "grandeComando": text(digit_row.get("gcDescricao")) or text(digit_row.get("gc")) or text(old.get("grandeComando")) or "Não informado",
            "digito": digit,
            "faixaValor": faixa(valor_ref or valor),
            "empresaVencedora": supplier_label,
            "empresaVencedoraCodigo": supplier_code,
            "empresaFabricante": code(get(raw, "FABRICANTE")) or text(old.get("empresaFabricante")),
            "descricao": text(get(raw, "NOMENCLATURA")) or text(get(raw, "DESCRIÇÃO DO MATERIAL", "DESCRICAO DO MATERIAL")),
            "descricaoCompleta": text(get(raw, "DESCRIÇÃO DO MATERIAL", "DESCRICAO DO MATERIAL")) or text(get(raw, "NOMENCLATURA")),
            "partNumber": text(get(raw, "PART NUMBER", "PN")),
            "status": status_text,
            "po": po or "Não informado",
            "contratoOrigem": contract_origin,
            "valorReferenciaUsd": valor_ref,
            "valorEmpenhadoUsd": valor,
            "economiaLicitacaoUsd": money(max(0.0, valor_ref - valor)) if valor_ref else 0.0,
            "economiaLicitacaoPercentual": round(max(0.0, valor_ref - valor) / valor_ref * 100, 2) if valor_ref else 0.0,
            "valorOrdemCompraUsd": po_value,
            "saldoPoUsd": po_balance,
            "quantidade": qtd,
            "quantidadeRecebida": qtd_rec,
            "quantidadePendente": pending,
            "dpe": iso(dpe),
            "itensAtrasados": pending if atrasada else 0.0,
            "atrasada": atrasada,
            "situacaoRetorno": text(old.get("situacaoRetorno")) or ("Reparável expedido ao fornecedor" if dispatched else "Em processo"),
            "situacaoReparavel": text(get(raw, "STS REPARO", "STATUS REPARO")) or text(old.get("situacaoReparavel")) or "Sem Status",
            "reparavelExpedidoAoFornecedor": dispatched,
            "dataExpedicaoReparavel": iso(data_exp),
            "diasDesdeExpedicao": days_since,
            "valorReparavelUsd": money(get(raw, "VALOR REPARAVEL", "VALOR DO REPARAVEL")) or money(old.get("valorReparavelUsd")),
            "dataTdr": iso(get(history, "DATA TDR", "DT TDR")) or text(old.get("dataTdr")),
            "dataAnaliseTdr": iso(get(history, "DATA ANALISE TDR", "DT ANALISE TDR")) or text(old.get("dataAnaliseTdr")),
            "observacaoRequisicao": obs,
            "reparoAprovado": text(get(history, "REPARO APROVADO", "APROVADO")) or text(old.get("reparoAprovado")),
            "tipoRequisicao": "Reparo" if is_repair else "Material",
            "tipoRequisicaoCodigo": "2" if is_repair else "1",
            "categoria": text(get(raw, "CATEGORIA", "CLASSE")) or text(old.get("categoria")),
            "condicao": text(get(raw, "CONDIÇÃO", "CONDICAO")) or text(old.get("condicao")),
        }
        target.append(row)

    def current_summary(rows: list[dict[str, Any]]) -> dict[str, Any]:
        selected = [x for x in rows if text(x.get("anoAbertura")) == str(current_year)]
        return {
            "ano": current_year,
            "requisicoes": len(selected),
            "valorEmpenhadoUsd": money(sum(number(x.get("valorEmpenhadoUsd")) for x in selected)),
        }

    process_data = {
        "meta": {
            "geradoEm": generated_at,
            "currentYear": current_year,
            "dataReferenciaPrazos": today.isoformat(),
            "fontePrincipal": "requisicoes.xlsx",
            "campoCotacao": "COTAÇÃO",
            "campoCertameSiloms": "CERTAME (ComprAer)",
            "escopo": "Painéis principais: COTAÇÃO e CERTAME SILOMS do ComprAer simultaneamente não brancos; todas as requisições de reparo exigem R no quarto caractere de PEDIDO. KPI Outros Reparos: STATUS L-Reparável expedido ao fornecedor sem CERTAME e com R no quarto caractere.",
        },
        "summary": {
            "materiais2026": current_summary(materials),
            "reparos2026": current_summary(repairs),
            "totalEscopo": len(materials) + len(repairs),
            "reparosCompraerExpedidos": sum(bool(x.get("reparavelExpedidoAoFornecedor")) for x in repairs),
            "outrosReparosExpedidos": len(other_repairs),
        },
        "materials": materials,
        "repairs": repairs,
        "otherRepairs": other_repairs,
    }
    write_js(repo / "processos-data.js", "window.CABW_PROCESSOS_DATA = ", process_data)
    write_js(repo / "assets/js/processos-data.js", "window.CABW_PROCESSOS_DATA = ", process_data)

    # Compatibilização.
    compat_credits = []
    for d in credit.get("digits", []):
        om_codes = split_codes(d.get("omUnid") or d.get("om"))
        if not om_codes and code(d.get("omUnid")):
            om_codes = [code(d.get("omUnid"))]
        projects = split_codes(d.get("projetos"))
        compat_credits.append({
            "digito": code(d.get("digito")),
            "saldo": money(d.get("saldo")),
            "acao": code(d.get("acao")),
            "planoInterno": code(d.get("planoInterno")),
            "natureza": code(d.get("natureza")),
            "fonte": code(d.get("fonte")),
            "objetivo": text(d.get("objetivo")),
            "indicador": code(d.get("indicador")),
            "omCodigos": om_codes,
            "omLabels": [om_lookup.get(x, x) for x in om_codes],
            "projetos": projects,
            "projetosLabels": [project_label(x) for x in projects],
        })

    compat_reqs = []
    eligible_initials = {"I", "P", "C", "G", "M"}
    for raw in req_rows:
        pedido = code(get(raw, "PEDIDO"))
        status_text = text(get(raw, "STATUS"))
        if not pedido or not status_text or status_text[:1].upper() not in eligible_initials:
            continue
        value = money(get(raw, "VALOR TOTAL"))
        if value <= 0:
            value = money(get(raw, "VALOR TOTAL DE REFERENCIA", "VALOR TOTAL REFERENCIA"))
        if value <= 0:
            continue
        om_code = pedido[:2]
        project = code(get(raw, "PRJ", "PROJETO"))
        digit = code(get(raw, "DÍGITO", "DIGITO"))
        drow = digit_by_code.get(digit, {})
        elem = code(get(raw, "ELEMENTO DESP", "ELEMENTO DESPESA"))
        sub = code(get(raw, "SUB ELEM", "SUBELEMENTO"))
        nature = elem or sub
        if elem and sub and not elem.endswith(sub):
            nature = elem
        compat_reqs.append({
            "requisicao": pedido,
            "omCodigo": om_code,
            "om": om_lookup.get(om_code, om_code),
            "projeto": project,
            "projetoLabel": project_label(project),
            "natureza": nature,
            "prioridade": code(get(raw, "PRIORIDADE")),
            "nomenclatura": text(get(raw, "NOMENCLATURA")),
            "descricao": text(get(raw, "DESCRIÇÃO DO MATERIAL", "DESCRICAO DO MATERIAL")),
            "status": status_text,
            "valorUsd": value,
            "dataAbertura": iso(get(raw, "DT ABERTURA", "DATA ABERTURA")),
            "digitoAssociado": digit,
            "acaoAssociada": code(drow.get("acao")),
            "planoInternoAssociado": code(drow.get("planoInterno")),
        })

    maps = [x for x in compat_reqs if text(x.get("status")).upper().startswith("M")]
    compat = {
        "meta": {
            "geradoEm": generated_at,
            "fonteCreditos": "digitos.xlsx",
            "fonteRequisicoes": "requisicoes.xlsx",
            "escopoRequisicoes": "Requisições com valor positivo nas situações I, P, C, G ou M, anteriores à aprovação do empenho.",
            "regraCompatibilidade": "Crédito virtualmente rateado entre as OM indicadas no dígito. Correspondência direta por OM, ação, natureza e projeto; cenários posteriores preservam OM, ação e natureza.",
        },
        "creditos": compat_credits,
        "requisicoes": compat_reqs,
        "lookups": {"om": om_lookup, "projetos": project_lookup},
        "summary": {
            "saldoDisponivel": money(sum(number(x.get("saldo")) for x in compat_credits)),
            "requisicoesElegiveis": len(compat_reqs),
            "valorRequisicoesElegiveis": money(sum(number(x.get("valorUsd")) for x in compat_reqs)),
            "mapasAprovados": len(maps),
            "valorMapasAprovados": money(sum(number(x.get("valorUsd")) for x in maps)),
        },
    }
    write_js(repo / "compatibilizacao-data.js", "window.CABW_COMPAT_DATA = ", compat)

    # Finanças da entrada, usando NL e a relação PO -> fornecedor.
    req_by_po: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in req_rows:
        po = code(get(row, "NUM OC", "PO"))
        if po:
            req_by_po[po].append(row)

    paid_rows = []
    for row in nl_rows:
        dt = as_date(get(row, "DATA"))
        value = money(get(row, "VALOR PAGO NO PEDIDO"))
        nl_pgto = code(get(row, "NL PGTO", "NL_PGTO", "NL"))
        if dt and dt.year == current_year and value > 0 and nl_pgto:
            paid_rows.append((row, dt, value))

    providers_all: set[str] = set()
    providers_eligible: set[str] = set()
    recent = []
    cutoff = today - timedelta(days=30)
    for row, dt, value in paid_rows:
        po = code(get(row, "PO"))
        order = order_by_po.get(po, {})
        supplier_code = code(get(order, "FORNECEDOR"))
        supplier_name = text(get(order, "NOME FORNECEDOR"))
        supplier = unique_join([supplier_code, supplier_name])
        if supplier:
            providers_all.add(supplier)
        pag = code(get(order, "PAG"))
        has_certame = any(code(get(req, "CERTAME", "CERTAME SILOMS", "CERTAME (COMPRAER)")) for req in req_by_po.get(po, []))
        if supplier and (pag in contract_ids or has_certame):
            providers_eligible.add(supplier)
        if dt >= cutoff:
            recent.append((value, dt, po, supplier, code(get(row, "NL PGTO", "NL")), row))

    largest = {}
    if recent:
        value, dt, po, supplier, nl, _ = max(recent, key=lambda x: x[0])
        largest = {"fornecedor": supplier or "Não informado", "valorUsd": money(value), "nl": nl, "data": dt.isoformat(), "po": po}

    # Home data: mesma regra da visão detalhada de crédito.
    credit_digits = credit.get("digits", [])
    valid_signing = [
        x for x in credit.get("signing", credit.get("signatureOrders", []))
        if not x.get("isAmend") and not re.match(r"^AMEND\\b", text(x.get("alteracao") or x.get("objetoResumo")), re.I)
    ]
    available_digits = money(sum(number(x.get("saldo")) for x in credit_digits))
    signing_available = money(sum(number(x.get("valorUsd")) for x in valid_signing))
    available = money(available_digits + signing_available)
    committed = money(sum(number(x.get("valorUsd")) for x in credit.get("pos", credit.get("purchaseOrders", [])))
    liquidated = money(sum(number(x.get("liquidadoNlUsd")) for x in credit.get("pos", credit.get("purchaseOrders", [])))
    committed_open = money(max(0.0, committed - liquidated))
    received = money(available + committed)
    by_action: dict[str, float] = defaultdict(float)
    for d in credit_digits:
        by_action[code(d.get("acao")) or "Não informado"] += number(d.get("dotacao"))
    for x in valid_signing:
        by_action[code(x.get("acao")) or "Não informado"] += number(x.get("valorUsd"))
    top_actions = [
        {"acao": k, "valorRecebidoUsd": money(v), "percentual": round(v / received * 100, 2) if received else 0.0}
        for k, v in sorted(by_action.items(), key=lambda kv: kv[1], reverse=True)[:3]
    ]

    rp_years = rp.get("rpEvolution", {}).get("resumoPorAno", {})
    contract_summary = contracts.get("summary", {})
    sf_orders_current = [x for x in sf.get("orders", []) if int(number(x.get("ano"))) == current_year]
    sf_available = money(sum(number(x.get("saldo")) for x in sf.get("digits", [])))
    sf_committed = money(sum(number(x.get("valorTotalUsd")) for x in sf_orders_current))
    sf_liquidated = money(sum(number(x.get("valorFaturadoUsd")) for x in sf_orders_current))
    sf_people = len({code(x.get("empresaCodigo")) for x in sf_orders_current if code(x.get("empresaCodigo"))})

    home = {
        "meta": {"geradoEm": generated_at, "ano": current_year, "fonte": "SISCAB"},
        "gestaoCredito": {
            "creditoRecebidoUsd": received,
            "creditoDisponivelUsd": available,
            "creditoNaoEmpenhadoUsd": available,
            "creditoEmpenhadoUsd": committed,
            "creditoLiquidadoUsd": liquidated,
            "creditoEmpenhadoNaoLiquidadoUsd": committed_open,
            "percentualEmpenhado": round(committed / received * 100, 2) if received else 0.0,
            "percentualNaoEmpenhado": round(available / received * 100, 2) if received else 0.0,
            "percentualLiquidado": round(liquidated / received * 100, 2) if received else 0.0,
            "principaisAcoes": top_actions,
        },
        "restosPagar": {"anos": rp_years},
        "contratos": {
            "valorContratadoUsd": money(contract_summary.get("totals", {}).get("valorContrato")),
            "valorEmpenhadoUsd": money(contract_summary.get("totals", {}).get("totalEmpenhadoUsd")),
            "valorFaturadoUsd": money(contract_summary.get("totals", {}).get("totalFaturadoUsd")),
            "quantidade": int(number(contract_summary.get("total"))),
            "categorias": dict(contract_summary.get("counts", {})),
        },
        "requisicoes": {
            "ano": current_year,
            "materiais": {
                "quantidade": process_data["summary"]["materiais2026"]["requisicoes"],
                "valorEmpenhadoUsd": process_data["summary"]["materiais2026"]["valorEmpenhadoUsd"],
            },
            "reparos": {
                "quantidade": process_data["summary"]["reparos2026"]["requisicoes"],
                "valorEmpenhadoUsd": process_data["summary"]["reparos2026"]["valorEmpenhadoUsd"],
            },
            "criterio": "COTAÇÃO e CERTAME SILOMS preenchidos; reparos identificados por R no quarto caractere do PEDIDO.",
        },
        "financas": {
            "ano": current_year,
            "quantidadeNlPagamento": len(paid_rows),
            "valorNlPagamentoUsd": money(sum(x[2] for x in paid_rows)),
            "empresasPagas": len(providers_all),
            "empresasPagasElegiveis": len(providers_eligible),
            "maiorPagamentoUltimos30Dias": largest,
            "fonte": "NL_requisicao.xlsx (NL PGTO preenchida) + última versão da PO em ordem_de_compra.xlsx",
            "criterioEmpresasElegiveis": "Fornecedor vinculado a contrato ou a requisição com CERTAME SILOMS preenchido.",
        },
        "suprimentoFundos": {
            "ano": current_year,
            "creditoDisponivelUsd": sf_available,
            "valorEmpenhadoUsd": sf_committed,
            "valorEmpenhadoNaoLiquidadoUsd": money(max(0.0, sf_committed - sf_liquidated)),
            "pessoasAtendidas": sf_people,
        },
    }
    # Atualizar o status de todas as visões conforme o contrato da produção.
    source_map = {}
    for entries in status.get("paineis", {}).values():
        for entry in entries:
            source_map[Path(entry.get("arquivo", "")).stem.lower()] = entry.get("atualizadoEm", generated_at)

    def source_entry(name: str) -> dict[str, str]:
        return {"arquivo": name, "atualizadoEm": source_map.get(Path(name).stem.lower(), generated_at)}

    status["processosResumo"] = process_data["summary"]
    status["pagamentosResumo"] = home["financas"]
    status["paineis"] = {
        "entrada": [source_entry(x) for x in (
            "NL_requisicao.XLS", "ordem_de_compra_em_assinatura.XLS", "controle_financeiro_contratos.XLS",
            "descricao_OM.XLS", "descricao_projetos.XLS", "digitos.XLS", "historico_obs.XLS",
            "ordem_de_compra.XLS", "requisicoes.XLS", "volumes.XLS"
        )],
        "contratos": [source_entry(x) for x in (
            "controle_financeiro_contratos.XLS", "historico_obs.XLS", "ordem_de_compra.XLS",
            "NL_requisicao.XLS", "requisicoes.XLS"
        )],
        "credito": [source_entry(x) for x in (
            "digitos.XLS", "ordem_de_compra.XLS", "ordem_de_compra_em_assinatura.XLS",
            "descricao_OM.XLS", "descricao_projetos.XLS", "requisicoes.XLS", "NL_requisicao.XLS"
        )],
        "compatibilizacao": [source_entry(x) for x in (
            "digitos.XLS", "requisicoes.XLS", "descricao_OM.XLS", "descricao_projetos.XLS"
        )],
        "processos": [source_entry(x) for x in (
            "requisicoes.XLS", "ordem_de_compra.XLS", "digitos.XLS", "descricao_OM.XLS",
            "descricao_projetos.XLS", "controle_financeiro_contratos.XLS", "historico_obs.XLS"
        )],
        "governanca": [source_entry(x) for x in (
            "digitos.XLS", "ordem_de_compra.XLS", "requisicoes.XLS", "descricao_OM.XLS",
            "descricao_projetos.XLS", "NL_requisicao.XLS", "controle_financeiro_contratos.XLS"
        )],
        "rp": [source_entry(x) for x in (
            "ordem_de_compra.XLS", "NL_requisicao.XLS", "requisicoes.XLS", "descricao_OM.XLS",
            "controle_financeiro_contratos.XLS"
        )],
        "suprimento": [source_entry(x) for x in (
            "ordem_de_compra.XLS", "digitos.XLS", "descricao_OM.XLS", "descricao_projetos.XLS"
        )],
    }
    status_text = json.dumps(status, ensure_ascii=False, indent=2) + "\n"
    for target in (repo / "data-update-status.json", repo / "assets" / "data" / "data-update-status.json"):
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(status_text, encoding="utf-8")

    if status.get("excelMaisRecente"):
        home["meta"]["excelMaisRecente"] = status["excelMaisRecente"]
    if status.get("geradoEmUTC"):
        home["meta"]["geradoEmUTC"] = status["geradoEmUTC"]
    write_js(repo / "home-data.js", "window.CABW_HOME_DATA = ", home)

    print(json.dumps({
        "geradoEm": generated_at,
        "homeCreditoDisponivelUsd": available,
        "processos": process_data["summary"],
        "compatibilizacao": compat["summary"],
        "financasNl": len(paid_rows),
    }, ensure_ascii=False))


if __name__ == "__main__":
    main()
