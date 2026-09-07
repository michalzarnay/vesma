#!/usr/bin/env python3
"""Zloží PPTX prezentáciu VESMA z textov v docs/prezentacia-snimky.md.

Jednorazový nástroj pre prezentácie v subregiónoch (docs/prezentacia-scenar.md,
kap. 7). Nie je súčasťou aplikácie a nespúšťa sa v CI.

Zásada: **nové snímky sa vkladajú do súboru šablóny**, nie do prázdnej
prezentácie. Vďaka tomu dedia rozloženia, fonty, farby aj pozadia a firemné
snímky, ktoré v súbore už sú, ostávajú nedotknuté.

Príklad:

    pip install python-pptx
    # 1) najprv sa pozri, aké rozloženia šablóna má
    python3 scripts/prezentacia-pptx.py --sablona INOVIA_sablona.pptx --iba-zoznam
    # 2) potom zlož prezentáciu
    python3 scripts/prezentacia-pptx.py \
        --sablona INOVIA_sablona.pptx \
        --vystup VESMA_prezentacia.pptx \
        --vlozit-po 1 --zmazat 2,3,4,5

`--zmazat` odstráni ukážkové snímky šablóny („NADPIS / Text Text"), `--vlozit-po`
povie, za ktorú snímku (číslovanie od 1, po zmazaní) sa naše snímky vložia.
Firemné snímky teda stačí nechať v súbore na začiatku a na konci.
"""
from __future__ import annotations

import argparse
import copy
import json
import re
import sys
from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.util import Emu, Pt

KLUCE_TEXT = ("id", "rozlozenie", "nadpis", "podnadpis", "vizual", "poznamky")

# Podľa akých slov v názve rozloženia sa hádajú predvolené rozloženia šablóny.
HEURISTIKA = {
    "titulna": ("titul", "title", "úvod", "uvod", "cover"),
    "obsah": ("nadpis a obsah", "title and content", "obsah", "content", "text"),
    "obsah_obrazok": ("obrázok", "obrazok", "picture", "image", "dve", "two"),
    "zaver": ("záver", "zaver", "ďakuj", "dakuj", "koniec", "end", "closing"),
}


def nacitaj_snimky(cesta: Path) -> list[dict]:
    """Rozparsuje docs/prezentacia-snimky.md na zoznam snímok."""
    text = cesta.read_text(encoding="utf-8")
    bloky = text.split("\n---\n")[1:]
    snimky: list[dict] = []
    for blok in bloky:
        s: dict = {"odrazky": []}
        kluc = None
        for riadok in blok.splitlines():
            if riadok.startswith("- "):
                s["odrazky"].append(odstran_uvodzovky(riadok[2:].strip()))
                continue
            m = re.match(r"^([a-z_]+):\s*(.*)$", riadok)
            if m and m.group(1) in KLUCE_TEXT + ("odrazky",):
                kluc = m.group(1)
                if kluc != "odrazky":
                    s[kluc] = odstran_uvodzovky(m.group(2).strip())
                continue
            if kluc in KLUCE_TEXT and riadok.strip():
                s[kluc] = (s.get(kluc, "") + " " + riadok.strip()).strip()
        if s.get("id"):
            snimky.append(s)
    return snimky


def odstran_uvodzovky(hodnota: str) -> str:
    if len(hodnota) >= 2 and hodnota[0] == hodnota[-1] == '"':
        return hodnota[1:-1]
    return hodnota


def vyber_rozlozenia(prez, rucne: dict[str, int] | None) -> dict[str, int]:
    """Priradí našim typom snímok indexy rozložení šablóny."""
    nazvy = [l.name.lower() for l in prez.slide_layouts]
    vysledok: dict[str, int] = {}
    for typ, slova in HEURISTIKA.items():
        if rucne and typ in rucne:
            vysledok[typ] = rucne[typ]
            continue
        najdene = next(
            (i for i, n in enumerate(nazvy) if any(s in n for s in slova)), None
        )
        vysledok[typ] = najdene if najdene is not None else min(1, len(nazvy) - 1)
    return vysledok


def zmaz_snimky(prez, cisla: list[int]) -> None:
    """Zmaže snímky podľa čísel od 1; maže od konca, aby čísla sedeli."""
    sld_id_lst = prez.slides._sldIdLst
    ids = list(sld_id_lst)
    for cislo in sorted(cisla, reverse=True):
        if not 1 <= cislo <= len(ids):
            sys.exit(f"Snímka {cislo} v šablóne nie je (má {len(ids)} snímok).")
        prvok = ids[cislo - 1]
        prez.part.drop_rel(prvok.rId)
        sld_id_lst.remove(prvok)


def presun_snimku(prez, z_indexu: int, na_index: int) -> None:
    sld_id_lst = prez.slides._sldIdLst
    prvok = list(sld_id_lst)[z_indexu]
    sld_id_lst.remove(prvok)
    sld_id_lst.insert(na_index, prvok)


def najdi_placeholder(snimka, typy: tuple[str, ...], mimo: set[int]):
    """Nájde placeholder podľa typu; vráti (shape, idx) alebo (None, None)."""
    for tvar in snimka.placeholders:
        if tvar.placeholder_format.idx in mimo:
            continue
        nazov = str(tvar.placeholder_format.type).lower()
        if any(t in nazov for t in typy):
            return tvar, tvar.placeholder_format.idx
    return None, None


def zapis_odrazky(tvar, riadky: list[str]) -> None:
    ramec = tvar.text_frame
    ramec.clear()
    for i, riadok in enumerate(riadky):
        odsek = ramec.paragraphs[0] if i == 0 else ramec.add_paragraph()
        odsek.text = riadok
        odsek.level = 0


def doplna_odrazky(tvar, riadky: list[str]) -> None:
    """Pripíše odrážky do existujúceho rámca pod už zapísaný text."""
    for riadok in riadky:
        odsek = tvar.text_frame.add_paragraph()
        odsek.text = riadok
        odsek.level = 0


def pridaj_ramcek_na_obrazok(snimka, popis: str, sirka_emu: int, vyska_emu: int) -> None:
    """Prázdny rámček s popisom, čo na miesto patrí. Ručne sa nahradí obrázkom."""
    lavo = int(sirka_emu * 0.55)
    hore = int(vyska_emu * 0.32)
    tvar = snimka.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE,
        Emu(lavo), Emu(hore), Emu(int(sirka_emu * 0.38)), Emu(int(vyska_emu * 0.5)),
    )
    tvar.fill.solid()
    tvar.fill.fore_color.rgb = RGBColor(0xF2, 0xF4, 0xF6)
    tvar.line.color.rgb = RGBColor(0xB0, 0xB8, 0xC0)
    ramec = tvar.text_frame
    ramec.word_wrap = True
    odsek = ramec.paragraphs[0]
    odsek.text = f"MIESTO NA OBRÁZOK\n{popis}"
    for beh in odsek.runs:
        beh.font.size = Pt(11)
        beh.font.color.rgb = RGBColor(0x50, 0x58, 0x60)


def poskladaj(args) -> None:
    prez = Presentation(args.sablona)

    if args.iba_zoznam:
        print(f"Šablóna: {args.sablona}")
        print(f"Snímky v súbore: {len(prez.slides._sldIdLst)}")
        for i, snimka in enumerate(prez.slides, start=1):
            nadpis = ""
            if snimka.shapes.title is not None:
                nadpis = snimka.shapes.title.text.strip().replace("\n", " ")[:60]
            print(f"  snímka {i}: rozloženie {snimka.slide_layout.name!r} {nadpis}")
        print("\nRozloženia:")
        for i, rozlozenie in enumerate(prez.slide_layouts):
            mena = ", ".join(
                str(p.placeholder_format.type).split(" ")[0].lower()
                for p in rozlozenie.placeholders
            )
            print(f"  [{i}] {rozlozenie.name} — placeholdery: {mena or 'žiadne'}")
        return

    if args.zmazat:
        zmaz_snimky(prez, [int(c) for c in args.zmazat.split(",") if c.strip()])

    rucne = json.loads(args.rozlozenia) if args.rozlozenia else None
    mapovanie = vyber_rozlozenia(prez, rucne)
    print("Použité rozloženia:")
    for typ, idx in mapovanie.items():
        print(f"  {typ:14s} → [{idx}] {prez.slide_layouts[idx].name}")

    snimky = nacitaj_snimky(Path(args.obsah))
    if not snimky:
        sys.exit(f"V {args.obsah} som nenašiel ani jednu snímku.")

    pocet_pred = len(prez.slides._sldIdLst)
    sirka, vyska = prez.slide_width, prez.slide_height

    for s in snimky:
        rozlozenie = prez.slide_layouts[mapovanie.get(s["rozlozenie"], 1)]
        snimka = prez.slides.add_slide(rozlozenie)
        pouzite: set[int] = set()

        nadpis_tvar = snimka.shapes.title
        if nadpis_tvar is not None and s.get("nadpis"):
            nadpis_tvar.text = s["nadpis"]
            pouzite.add(nadpis_tvar.placeholder_format.idx)

        podnadpis_tvar = None
        if s.get("podnadpis"):
            tvar, idx = najdi_placeholder(snimka, ("subtitle",), pouzite)
            if tvar is None:
                tvar, idx = najdi_placeholder(snimka, ("body", "object", "text"), pouzite)
            if tvar is not None:
                tvar.text = s["podnadpis"]
                podnadpis_tvar = tvar
                pouzite.add(idx)

        if s.get("odrazky"):
            tvar, idx = najdi_placeholder(snimka, ("body", "object", "text", "subtitle"), pouzite)
            if tvar is not None:
                zapis_odrazky(tvar, s["odrazky"])
                pouzite.add(idx)
            elif podnadpis_tvar is not None:
                # Titulná snímka: odrážky idú pod podnadpis do toho istého rámca,
                # aby sa nevytváralo textové pole mimo rozloženia šablóny.
                doplna_odrazky(podnadpis_tvar, s["odrazky"])
            else:
                print(f"  ! {s['id']}: rozloženie nemá miesto na odrážky, pridávam textové pole")
                pole = snimka.shapes.add_textbox(
                    Emu(int(sirka * 0.08)), Emu(int(vyska * 0.35)),
                    Emu(int(sirka * 0.84)), Emu(int(vyska * 0.5)),
                )
                zapis_odrazky(pole, s["odrazky"])

        poznamky = s.get("poznamky", "")
        if s.get("vizual"):
            obrazok, idx = najdi_placeholder(snimka, ("picture", "media"), pouzite)
            if obrazok is not None:
                # Rozloženie šablóny má vlastné miesto na obrázok — necháme ho
                # prázdne, používateľ doň klikne a vloží fotku. Popis ide do poznámok.
                pouzite.add(idx)
                poznamky = f"OBRÁZOK: {s['vizual']}\n\n{poznamky}".strip()
            else:
                volny, idx = najdi_placeholder(snimka, ("object", "body", "text"), pouzite)
                if volny is not None and volny.has_text_frame:
                    volny.text_frame.text = f"MIESTO NA OBRÁZOK\n{s['vizual']}"
                    pouzite.add(idx)
                else:
                    pridaj_ramcek_na_obrazok(snimka, s["vizual"], sirka, vyska)

        if poznamky:
            snimka.notes_slide.notes_text_frame.text = poznamky

        # Prázdne placeholdery, ktoré ostali, by sa v PowerPointe ukázali ako
        # „Kliknutím pridáte text" — nechávame ich, používateľ ich vymaže alebo
        # využije. Vypíšeme ich, nech o nich vie.
        zvysne = [
            str(p.placeholder_format.type).split(" ")[0].lower()
            for p in snimka.placeholders
            if p.placeholder_format.idx not in pouzite and not p.has_text_frame or
            (p.placeholder_format.idx not in pouzite and p.has_text_frame and not p.text_frame.text)
        ]
        if zvysne:
            print(f"  · {s['id']}: nevyplnené placeholdery: {', '.join(zvysne)}")

    # Presun na správne miesto: naše snímky idú za snímku --vlozit-po.
    if args.vlozit_po is not None:
        ciel = args.vlozit_po
        for posun in range(len(snimky)):
            presun_snimku(prez, pocet_pred + posun, ciel + posun)

    prez.save(args.vystup)
    print(f"\nHotovo: {args.vystup} ({len(prez.slides._sldIdLst)} snímok)")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--sablona", required=True, help="PPTX/POTX šablóna INOVIA (aj s firemnými snímkami)")
    p.add_argument("--vystup", default="VESMA_prezentacia.pptx")
    p.add_argument("--obsah", default="docs/prezentacia-snimky.md")
    p.add_argument("--vlozit-po", type=int, default=None,
                   help="za ktorú snímku šablóny vložiť naše snímky (číslovanie od 1, po --zmazat)")
    p.add_argument("--zmazat", default="", help="čísla snímok šablóny na zmazanie, napr. 2,3,4")
    p.add_argument("--rozlozenia", default="",
                   help='ručné priradenie, napr. \'{"titulna":0,"obsah":2}\'')
    p.add_argument("--iba-zoznam", action="store_true", help="len vypíše snímky a rozloženia šablóny")
    poskladaj(p.parse_args())


if __name__ == "__main__":
    main()
