# Puls Icons

Figma plugin for searching and inserting icons from **Material Symbols** and **Puls** (DIPS design system) in one unified interface.

## Features

- Search across both Material Symbols (~2500+ icons) and custom Puls icons
- Filter by source: All / Material / Puls
- Material Symbols settings (style: outlined/rounded/sharp, fill: on/off) tucked in a config menu
- Lazy-loaded SVG previews with infinite scroll
- Click or double-click to insert icons onto the canvas
- Always up to date — fetches latest icons from CDN

## Adding Puls Icons

Drop SVG files into `icons/` and add entries to `icons.json`:

```json
[
  {
    "name": "my-icon",
    "keywords": ["custom", "example"],
    "file": "icons/my-icon.svg"
  }
]
```

Icons become available in the plugin within 24 hours of pushing to `main`.

## Development

```bash
npm install
npm run build    # Build plugin
npm run watch    # Watch mode
```

Load in Figma: **Plugins → Development → Import plugin from manifest** → select `manifest.json`.
