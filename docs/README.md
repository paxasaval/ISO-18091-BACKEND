# Documentación — Backend ISO 18091

La carpeta está organizada según **si el documento sigue vigente para el sistema
actual** o **fue material de trabajo del refactor** (histórico).

## `guias/` — Referencia viva del sistema

Documentación de consulta del sistema actual. Se mantiene al día.

- [Guia_Api.md](guias/Guia_Api.md) — Guía de la API v2 (referencia rápida de endpoints).
- [GUIA_USUARIO.md](guias/GUIA_USUARIO.md) — Manual de usuario de la plataforma.
- [MAPA_NAVEGACION.md](guias/MAPA_NAVEGACION.md) — Mapa de navegación por roles.

## `frontend/` — Contratos vigentes para el Frontend

Contratos que el equipo de frontend consume **hoy**. Se actualizan al cambiar la API.

- [CONTEXTO-FRONTEND-METODOLOGO.md](frontend/CONTEXTO-FRONTEND-METODOLOGO.md) — Contexto de la vista del rol Metodólogo (endpoints, permisos, semáforo).

## `informes/` — Salidas / reportes del sistema actual

Informes vigentes, incluidos los **generados por la migración** (se regeneran por
ejecución; los generados están en `.gitignore`).

- [INFORME-AUDITORIA-ISO18091.md](informes/INFORME-AUDITORIA-ISO18091.md) — Auditoría ISO 18091 (sección municipio + ejercicio auditable + sección técnica).
- `diff-puntajes-legible.md` — Diff de puntajes v1→v2 legible para el GAD *(generado por `npm run migrate:v2 -- --diff-only`)*.
- `migracion-v2-informe.md` — Informe de la migración v1→v2 *(generado por `npm run migrate:v2`)*.

## `refactor/` — Material histórico del refactor

Documentos que sirvieron **como insumo del refactor a TypeScript / `/api/v2`**. Ya
cumplieron su función; se conservan como registro. No reflejan necesariamente el
estado actual del código.

- [PLAN-ESCALADO-V2.md](refactor/PLAN-ESCALADO-V2.md) — Plan de escalado de `/api/v2`.
- [baseline-endpoints.md](refactor/baseline-endpoints.md) — Contrato/baseline de los endpoints v1 (compatibilidad estricta).
- [HARDCODE-A-MIGRAR-AL-BACKEND.md](refactor/HARDCODE-A-MIGRAR-AL-BACKEND.md) — Auditoría del FE: valores hardcodeados a migrar al backend.
- [CONTRATO-FRONTEND-EVIDENCIAS.md](refactor/CONTRATO-FRONTEND-EVIDENCIAS.md) — Contrato FE↔backend de evidencias usado para el rediseño (snapshot).
- [PREGUNTAS-FRONTEND-ROLES-Y-EVIDENCIAS.md](refactor/PREGUNTAS-FRONTEND-ROLES-Y-EVIDENCIAS.md) — Preguntas al FE (ronda 2): roles y evidencias.
- [RESPUESTAS-FRONTEND-ROLES-Y-EVIDENCIAS.md](refactor/RESPUESTAS-FRONTEND-ROLES-Y-EVIDENCIAS.md) — Respuestas del FE (ronda 2).
