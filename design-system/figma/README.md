# Figma handoff

Generated from `../tokens.json` by `python3 design-system/scripts/build-figma.py`. Do not edit by hand.

| File | Use |
| --- | --- |
| `tokens-studio.json` | Import with the [Tokens Studio](https://tokens.studio) plugin (Load from file/JSON). Contains a `global` set (spacing, radius, fonts) and one set per theme, plus two `$themes` (Classic, Cyberpunk Retro). Then "Create variables" to get Figma Variables with two modes. |
| `classic.dtcg.json`, `cyberpunk.dtcg.json` | W3C Design Tokens (DTCG) format, one file per mode, for any Variables-import plugin. Import each into the same collection as a separate mode. |

## Steps
1. Install Tokens Studio for Figma and open your file.
2. Settings > Load from file > choose `tokens-studio.json`.
3. Themes: select Classic or Cyberpunk Retro; "Export to Figma" > Variables.
4. Fonts: install Inter, Space Grotesk, JetBrains Mono (Classic) and Orbitron, Chakra Petch, Share Tech Mono (Cyberpunk) from Google Fonts.

Notes: Figma has no native box-shadow variable; shadow tokens come through as Tokens Studio styles/effects. Color alpha in shadows is kept as `rgba()`.
