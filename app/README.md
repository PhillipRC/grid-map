# Grid-Map

An exercise in generating terrain using multiple octaves of Perlin noise.

- User Interface
  - Supports Mobile, Desktop in Portrait or Landscape
  - Terrain options: Generate, Edit, Save and Load
  - Terrain inputs: Size, Image, Color, Noise, Layers
  - Mini 2D renderer to preview inputs changes
- Full Screen 2D Renderer
  - Displays terrain imagery using a dual-grid autotile system
  - Colors terrain images to match a given input
  - Handles large terrains
  - Scales terrain imagery based on display size
- Architecture
  - Web Components, TypeScript, Vite
  - Mobile/Desktop installable
  - GitHub Actions pipeline to build and deploy the app
  - Freely hosted on GitHub at https://philliprc.github.io/grid-map/