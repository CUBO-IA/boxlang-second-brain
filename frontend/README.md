# Frontend — Second Brain

Generado con `pnpm create next-app@latest frontend --yes`: Next.js, TypeScript, Tailwind CSS, ESLint y App Router. Conserva la página de conexión con BoxLang, sin lógica de negocio.

Desde la raíz del repositorio, con `.env` configurado:

```bash
docker compose up -d --build --wait
docker compose exec frontend pnpm lint
docker compose exec frontend pnpm exec tsc --noEmit
docker compose exec frontend pnpm build
docker compose exec -T frontend node --input-type=module < tests/http.mjs
```

Abre http://localhost:3000 y edita `app/page.tsx`. Las dependencias se fijan en `pnpm-lock.yaml`; Docker las instala con `--frozen-lockfile`.

Cache Components está desactivado para conservar la comprobación dinámica de BoxLang en cada petición. Consulta el [README del proyecto](../README.md) para configurar los servicios.
