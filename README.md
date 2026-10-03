# robopet-two
redesign with figma for ai-robopet

# RoboPet Two

Parallel copy of [RoboPet](https://github.com/Psychemulation-Enterprises/RoboPet) with the **Cyberpunk Retro** theme applied (`src/cyberpunk.css`, imported from `src/index.css`). Compare against the original to review the redraft.

- `design-system/`: tokens (Classic + Cyberpunk Retro), generated CSS, and Figma exports in `design-system/figma/` (see its README).
- Run: `npm install && npm run dev`.

## Docker

```bash
# build and run (http://localhost:3000)
docker build -t robopet-two .
docker run --rm -p 3000:3000 -e GEMINI_API_KEY=your-key robopet-two

# or with compose (reads GEMINI_API_KEY, APP_URL, PORT from your shell or a .env file)
docker compose up --build
```

- Multi-stage image on `node:22-alpine`: Vite client and the Express server are built in the first stage; the runtime stage installs production dependencies only and runs as the non-root `node` user.
- `GEMINI_API_KEY` is read at runtime. `VITE_FIREBASE_API_KEY` is optional and baked in at build time (`--build-arg`).
- `PORT` overrides the listen port (default 3000). A healthcheck pings `/`.
