#!/usr/bin/env python3
"""Compacts Alderaan's executed render tables (decompile/alis/render-tables, box-only) into
src/lib/ishar/outdoor-tables.json. Only numbers (draw coordinates, sprite indices); no game assets.
Usage: python3 scripts/gen-outdoor-tables.py <render-tables> [<extra tables dir from gen_generic.py>]
Overlay scripts per scene type come from scenes.json (MAIN 0x018c4/0x01c96, known); only scripts with a
cell table are kept (decor renderers; NPC/creature modules are entities, not tabulated)."""
import json, sys, os
src = sys.argv[1]; extra = sys.argv[2:]
find = lambda n: next(p for p in [os.path.join(d, f"cells_{n}.json") for d in [src, *extra]] if os.path.exists(p))
KEYB = {"VDEC1", "VDEC2", "VDEC3", "VPASSAGE"}
out = {"_source": "render-tables (executed original scripts, tools/gen_generic.py); known", "scripts": {}}
NAMES = ["PLAINE1", "ARBO", "FORET1", "MONTAGNE", "VILLE", "VHOUSE2", "VDEC1", "VDEC2", "VDEC3",
         "VILLAGE1", "VARCHE", "VARCADE", "VHOUSE1", "VPONT", "VBIBLI", "VJAIL", "VMAIRIE", "VNIGHT", "VPASSAGE", "VPORT", "VTEMPLE"]
for name in NAMES:
    d = json.load(open(find(name)))
    trav = {f: [s["cell_offset_xy"] for s in d["traversal"][f]["sequence"]] for f in d["traversal"]}
    codes = {}
    for c, v in d["codes"].items():
        e = {}
        for k, dv in v["by_facing_index"].items():
            dr = [[x["x"], x["z"], x["y"], x["sprite"], 1 if x["mirror"] else 0] for x in dv.get("draws", [])]
            if dr: e[k] = dr
        if e: codes[c] = e
    out["scripts"][name] = {"layer": "B" if name in KEYB else "A", "cellRoutine": d["cell_routine"], "trav": trav, "codes": codes}
sc = json.load(open(os.path.join(src, "scenes.json")))["overlay_by_type"]["types"]
out["overlays"] = {t: [n for n in (x.split(".")[0].upper() for x in v["loads"]) if n in NAMES] for t, v in sc.items()}
out["overlays"] = {t: v for t, v in out["overlays"].items() if v}
h = json.load(open(os.path.join(src, "montagne_height.json")))
out["montagneHeight"] = {dl: {z: v[0] for z, v in zs.items()} for dl, zs in h["dy_by_z"].items()}
json.dump(out, open(os.path.join(os.path.dirname(__file__), "..", "src/lib/ishar/outdoor-tables.json"), "w"), separators=(",", ":"))
