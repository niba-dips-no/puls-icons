# Puls Icons Figma Plugin

A Figma plugin for searching and inserting icons from **Material Symbols** and the **Puls** design system.

## Project Structure

```text
├── build-ui.js         # Custom build script to generate the final UI HTML
├── icons.json          # Metadata registry for custom Puls icons
├── icons/              # SVG files for the Puls design system
├── manifest.json       # Figma plugin manifest (permissions, entry points)
├── src/
│   ├── code.ts         # Sandbox: Main Figma logic (canvas manipulation)
│   ├── ui.ts           # UI: Browser logic (fetching, searching, state)
│   ├── ui.css          # UI: Styling
│   └── types.ts        # Shared TypeScript definitions
└── dist/               # Compiled output (git-ignored)
```

## Technical Architecture

The plugin operates in two distinct environments as required by Figma:

### 1. The Sandbox (`src/code.ts`)
This code runs inside Figma's main thread with access to the document tree. It is responsible for:
- Showing the plugin UI.
- Listening for messages from the UI (e.g., `insert-icon`).
- Converting SVG strings into Figma nodes using `figma.createNodeFromSvg()`.
- Positioning nodes in the center of the user's viewport.

### 2. The UI (`src/ui.ts`)
This code runs inside an `<iframe>` (a standard browser environment). It handles:
- **State Management:** Manages the search query, selected style (outlined/rounded/sharp), and fill state.
- **Data Fetching:**
    - **Material Symbols:** Fetches metadata directly from Google's official JSON API and SVGs from the `fonts.gstatic.com` CDN. This ensures the plugin has access to new icons the day they are released.
    - **Puls Icons:** Fetched from this repository's GitHub main branch via `jsDelivr` CDN.
- **Lazy Loading:** Implements an `IntersectionObserver` to only load SVGs for icons currently visible in the grid, ensuring high performance even with 3000+ icons.
- **Infinite Scroll:** Loads icon cards in chunks of 60 to keep the DOM light.

## Build Process

Figma plugins require a single HTML file for the UI that contains all CSS and JS inline. Our build pipeline automates this:

1.  **Compile JS:** `esbuild` bundles and transpiles `src/code.ts` and `src/ui.ts` into `dist/`.
2.  **Generate HTML:** `node build-ui.js` reads `dist/ui.js` and `src/ui.css` and injects them into a template literal, saving the final result to `dist/ui.html`.

### Commands
- `npm run build`: Runs the full pipeline once.
- `npm run watch`: Watches for changes in `src/` and automatically rebuilds.

## Icon Sources

### Material Symbols
- **Metadata API:** `https://fonts.google.com/metadata/icons?key=material_symbols`
- **CDN:** `https://fonts.gstatic.com/s/i/short-term/release/`
- **Updates:** Automatic.

### Puls Icons
- **Source:** `icons/` folder in this repo.
- **Registry:** `icons.json`.
- **Updates:** New icons added to the repo become available in the plugin within 24 hours (due to CDN caching).

## Developer Quality Check
- **Performance:** Previews are lazy-loaded and the grid is virtualized via infinite scroll logic.
- **Type Safety:** TypeScript is used across both Sandbox and UI contexts.
- **Network:** Only official Google and project-specific GitHub domains are whitelisted in `manifest.json`.