# CLAUDE.md

Guía para agentes que trabajan en este repositorio.

## Qué es

Backend de la plataforma **ISO 18091** (evaluación de gobiernos abiertos /
transformación digital). API REST en **Node + Express + Mongoose (MongoDB)**.
Consumido por frontends en Firebase y Azure; desplegado en **Railway (nixpacks)**.

## Estado: refactorización en curso (rama `refactor`)

Se está migrando a **TypeScript con arquitectura por capas**
(routes → services → repositories). Reglas vigentes:

- **Compatibilidad ESTRICTA de v1**: las rutas `/api/...` y la forma de sus
  respuestas JSON NO cambian. Contrato en `docs/refactor-reports/baseline-endpoints.md`.
- Las mejoras y la reescritura REST van en **`/api/v2`** (capa nueva sobre los
  mismos services).
- Código nuevo en **TypeScript** dentro de `src/`, compila a `dist/`.
- Migración incremental: `allowJs: true` en `tsconfig.json`; la app sigue
  ejecutable en cada paso.
- Sin `console.log` en código nuevo (usar el logger). `async/await` consistente.

El plan completo y el flujo orquestado por subagentes
(`refactor-engineer` + `code-reviewer`, bucle máx. 3 iteraciones) está en
`C:\Users\DELL\.claude\plans\refactored-fluttering-moth.md` y los informes en
`docs/refactor-reports/`.

## Estructura actual

- `index.js` → arranca el server HTTP. `app.js` → monta middleware y routers.
- `controllers/*` → routers Express (hoy mezclan ruteo + lógica + acceso a Mongo).
- `models/*` → esquemas Mongoose.
- `utils/middleware.js` → middleware real (logger, errorHandler) **y** lógica de
  dominio mal ubicada a extraer (`qualifySubindicator`, `updateIndicator`,
  `updateSubindicator[2]`, `notify`).
- `utils/config.js` → variables de entorno. `test/*` → Jest + supertest.

## Comandos

```bash
npm run dev        # desarrollo con recarga (tsx watch)
npm run build      # compila TS → dist/  (tsc)
npm run typecheck  # tsc --noEmit
npm start          # producción: node dist/index.js  (requiere build previo)
npm test           # jest
npm run lint       # eslint
npm run lint:fix   # eslint --fix
```

## Deploy (Railway / nixpacks)

nixpacks ejecuta `npm run build` (si existe) y luego `npm start`. `start` ya
apunta a `dist/index.js`, así que **el build debe correr antes** de arrancar.
La rama `refactor` no es la rama de deploy.

## Convenciones

- ESLint del repo: indent 2, comillas simples, sin punto y coma, `eqeqeq`, LF.
- Entorno Windows; el shell es Git Bash. Detrás de proxy: `git`/`npm` pueden
  fallar por SSL — usar `GIT_SSL_NO_VERIFY=true` o `npm ... --strict-ssl=false`
  por comando (no cambiar config global).
- No tocar respaldos untracked: `backup_*`, `query_loja.js`.
