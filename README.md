# CAD Tutor

A Vite + React app for building and playing step-by-step 3D tutorials with synchronized Verge3D viewports.

What’s inside:
- Dual Verge3D viewports (Primary + Detail) that stay camera-locked
- Tutorial authoring (tutorials, steps, required tools)
- Tools library with optional set designators and per-step assignment
- Zero-backend local persistence (localStorage) and lightweight uploader

Run
- npm install
- npm run dev
- Open the URL printed by Vite (e.g., http://localhost:5173)

Build
- npm run build

Notes
- Data is stored in your browser’s localStorage (tutorials, steps, tools)
- Images uploaded via the Tools library are stored as data URLs locally
- Verge3D runtime assets are served from public/

Repository hygiene
- Git is clean by default via .gitignore (node_modules, caches, large Verge3D exports)
- Only the minimal Verge3D runtime files are intended to be tracked