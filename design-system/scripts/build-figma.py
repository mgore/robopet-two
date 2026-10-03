#!/usr/bin/env python3
"""Generate Figma-ready token files from design-system/tokens.json.

Outputs (design-system/figma/):
  classic.dtcg.json, cyberpunk.dtcg.json  W3C DTCG, one file per mode (Figma Variables import plugins)
  tokens-studio.json                      Single Tokens Studio file with sets + $themes
Run: python3 design-system/scripts/build-figma.py
"""
import json, os
root = os.path.join(os.path.dirname(__file__), "..")
t = json.load(open(os.path.join(root, "tokens.json")))
out = os.path.join(root, "figma"); os.makedirs(out, exist_ok=True)
themes = [x["id"] for x in t["color"]["themes"]]

def px(v): return v if isinstance(v, str) else f"{v}px"
def theme_val(tok, th): return tok["value"][th] if isinstance(tok["value"], dict) else tok["value"]

def shared():
    d = {"spacing": {}, "radius": {}, "font": {}}
    for k in t["spacing"]["tokens"]:
        d["spacing"][k["name"]] = {"$type": "dimension", "$value": k["value"], "$description": k["usage"]}
    for k in t["radius"]["tokens"]:
        d["radius"][k["name"]] = {"$type": "dimension", "$value": k["value"], "$description": k["usage"]}
    for k, v in t["type"]["families"].items():
        d["font"][k] = {"$type": "fontFamily", "$value": [s.strip().strip('"') for s in v.split(",")]}
    return d

def mode(th):
    d = {"color": {}, "shadow": {}}
    for k in t["color"]["tokens"]:
        d["color"][k["name"]] = {"$type": "color", "$value": theme_val(k, th), "$description": k["usage"]}
    for k in t["shadow"]["tokens"]:
        d["shadow"][k["name"]] = {"$type": "shadow", "$value": theme_val(k, th), "$description": k["usage"]}
    d.update(shared())
    return d

for th in themes:
    json.dump(mode(th), open(os.path.join(out, f"{th}.dtcg.json"), "w"), indent=2)

# Tokens Studio: Tokens Studio uses type/value/description keys
def ts(d):
    if isinstance(d, dict) and "$value" in d:
        r = {"value": d["$value"], "type": d["$type"]}
        if "$description" in d: r["description"] = d["$description"]
        if d["$type"] == "fontFamily": r["type"] = "fontFamilies"; r["value"] = ", ".join(d["$value"])
        if d["$type"] == "dimension": r["type"] = "spacing" if False else "dimension"
        if d["$type"] == "shadow": r["type"] = "boxShadow"
        return r
    return {k: ts(v) for k, v in d.items()}
studio = {"global": ts(shared())}
for th in themes:
    m = mode(th); m.pop("spacing"); m.pop("radius"); m.pop("font")
    studio[th] = ts(m)
studio["$themes"] = [
    {"id": th, "name": n["name"], "selectedTokenSets": {"global": "source", th: "enabled"}}
    for th, n in zip(themes, t["color"]["themes"])
]
studio["$metadata"] = {"tokenSetOrder": ["global"] + themes}
json.dump(studio, open(os.path.join(out, "tokens-studio.json"), "w"), indent=2)
print("wrote", os.listdir(out))
