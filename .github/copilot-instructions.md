# Grid-Map Copilot Instructions

## Architecture Overview
This is a Progressive Web App (PWA) for generating and displaying grid-based terrain maps using Perlin noise. The app uses Web Components architecture with TypeScript and Vite.

- **Main App** (`app/`): Web Components-based UI for map generation, editing, and display
- **Tile Builder** (`tile-builder/`): Node.js utility for processing SVG tiles from PenPot exports
- **Data Flow**: `GridMapData` is the central state manager, firing custom events that other components listen to

## Component Structure
Each UI component lives in its own folder under `src/` with three files:
- `{component}.ts`: Custom element class extending `GridBase`
- `{component}.html`: Template markup (imported as raw string)
- `{component}.css`: Styles (imported as raw string)

Example: `src/app-main/app-main.ts`, `app-main.html`, `app-main.css`

Components use Shadow DOM and communicate via custom events (e.g., `GridMapData.EventLayerUpdated`).

## Key Patterns
- **Base Class**: All components extend `GridBase` from `src/shared/grid-base.ts`, which sets up Shadow DOM
- **Event Communication**: Use `this.dispatchEvent(new CustomEvent(...))` for cross-component messaging
- **Imports**: HTML/CSS imported with `?raw` suffix: `import html from './component.html?raw'`
- **Naming**: Kebab-case for element names (e.g., `<app-main>`), matching folder names

## Development Workflow
- **Dev Server**: `npm run dev` (Vite dev server)
- **Build**: `npm run build` (TypeScript compilation + Vite build + postbuild script)
- **Preview**: `npm run preview` (serve built app)
- **PWA**: Configured with `vite-plugin-pwa`, assets generated via `@vite-pwa/assets-generator`

## External Dependencies
- `@lion/ui`: UI components (tabs, buttons)
- `vite-plugin-pwa`: PWA functionality
- `workbox-window`: Service worker management

## Tile Builder
Separate Node.js project in `tile-builder/`:
- Processes SVG files from PenPot into tile assets
- Run with `npm start` (executes `main.js`)
- Uses `xml-js` for SVG manipulation

## Key Files
- `src/app.ts`: Registers all custom elements
- `src/grid-map-data/grid-map-data.ts`: Central data management
- `src/types.ts`: TypeScript interfaces (MapData, TileLayer, etc.)
- `app/vite.config.ts`: Vite config with PWA settings