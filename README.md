# Lumen

Frontend for the Grad-CAM vs Integrated Gradients project (React + Vite). The lab runs on mock data until the backend exists.

## Run it

Needs Node 18 or newer (`node -v`).

```bash
npm run setup     # first time only: installs frontend dependencies
npm run dev       # http://localhost:5173
```

Both commands work from this folder or from `frontend/`.

Production build:

```bash
npm run build
npm run preview   # http://localhost:4173
```

## If it won't load

- **`ENOENT package.json`**: you ran npm in the wrong folder. Use this folder, or `cd frontend`.
- **Blank page when double-clicking `dist/index.html`**: browsers block module scripts on `file://`. Use `npm run preview` instead.
- **`Cannot find module` or `vite is not recognized`**: dependencies aren't installed. Run `npm run setup`.
- **`EPERM`, `EBUSY` or a very slow install**: OneDrive is syncing `node_modules`. Move the project out of OneDrive (for example `C:\dev\MiniProject`) or pause syncing, then delete `frontend/node_modules` and run `npm run setup`.
- **Port in use**: Vite picks the next free port and prints it in the terminal.
- **Fonts look different offline**: they load from Google Fonts; the layout still works with fallbacks.
- **Mouse cursor missing on a touch device**: the custom cursor is disabled there by design.
