# Roadmap de escalado /api/v2 (consolidado)

> Une las 3 entradas del frontend: `CONTRATO-FRONTEND-EVIDENCIAS.md`,
> `RESPUESTAS-FRONTEND-ROLES-Y-EVIDENCIAS.md` y `HARDCODE-A-MIGRAR-AL-BACKEND.md`.
> Todo es trabajo de **/api/v2** (+ campos aditivos en modelos compartidos, que NO
> rompen v1: solo se AÑADEN campos opcionales a las respuestas). Cada tema indica
> entidades/migración, impacto en v1 y riesgo.

## Decisiones de dominio ya fijadas
- Solo evidencias **verificadas** puntúan en el semáforo oficial.
- Criterio **crítico** (`tier`) → topa el subindicador a **rojo**.
- El **backend** es la fuente de la nota (derivada de la rúbrica), no el cliente.
- **3 roles reales**: Administrador, Responsable, Ciudadano (segregación parcial:
  Responsable sube/crea; Administrador califica/publica/configura). No hay
  enforcement `author ≠ qualificationBy`. No existe rol "metodólogo".
- La rúbrica/catálogo es **global** (estándar ISO), no por GAD. El FE no crea
  catálogo (indicadores/instancias/características/rúbrica): es del backend.

---

## Tema 1 — Catálogo navegable + fin de hardcode P0  *(bajo riesgo, alto desbloqueo)*
Objetivo: que el FE deje de depender de ObjectIds y nombres cableados.
- **`slug`/`code` estable en `Type`** + endpoint v2 `GET /api/v2/types?mandatory=true`
  que devuelva los tipos generales ordenados, para que el FE arme las rutas desde
  ahí. Mata: ids cableados (HC#1) y acoplamiento nombre↔ruta + bug `replace(' ','-')`
  (HC#2).
- **`code` estable en `Rol`** (no depender de `name`). (HC#3 — ver Tema 3.)
- **Resolución de tenant** (HC#4): endpoint para resolver workspace (por login/
  subdominio) en vez de constante de build. Backend expone; infra/FE consumen.
- Entidades: +campos `slug`/`code` (aditivo). Impacto v1: nulo (campos nuevos).
  Riesgo: bajo.

## Tema 2 — Config de presentación/workflow (P1/P2)
- **`order`/`priority`** en `Type`, `Characteristic`, `Valuation` (y catálogo de
  cuadrantes) para no depender del orden de respuesta (HC#5).
- **Escala del semáforo como única fuente**: endpoint v2 de config
  (niveles 0–3, etiquetas, colores, umbrales `red/yellow/green` ya presentes en
  `Type`/`Indicator`). Mata 5 copias en el FE (HC#6).
- **Metadatos de característica**: `inputKind: 'file'|'link'` (reemplaza el mágico
  `type===2`, HC#7); respetar `allowed_formats` (HC#8); **portada** como flag/
  entidad real, no objeto inventado (HC#9).
- **Notificaciones**: enums `entityType`/`action` con etiqueta (HC#14).
- **Paginación real** en específicos (HC#11), **storage key por ids** (HC#12),
  **período desde backend** (HC#13).
- Entidades: +campos aditivos. Impacto v1: nulo. Riesgo: bajo.

## Tema 3 — Roles y permisos (modelo de capacidades + segregación)
Objetivo: gatear por **permiso**, no por nombre; soportar la tesis (segregación).
- **`Rol` con `code` + `permissions[]`** (capacidades: `indicator:create`,
  `evidence:upload`, `evidence:qualify`, `evidence:publish`, `gad:config`,
  `rubric:configure`, `user:manage`, …). El FE gatea por permiso.
- **Rol nuevo "Metodólogo"**: configura criterios/rúbrica, **pesos** y marca de
  **críticos** (hoy nadie lo hace desde UI).
- **Segregación de funciones**: opción de enforce `author ≠ qualificationBy`
  (y publicador distinto). `qualificationBy` desde el **token**, no del body.
- **`subindicator.responsible`** → relación a **usuario(s)** (hoy texto libre).
- (Diferible) **rol por tenant/workspace** (hoy es global; es cambio FE grande).
- Entidades: `Rol.permissions`, `User`↔responsable. Migración: backfill de
  permisos por rol existente. Impacto v1: aditivo. Riesgo: medio (auth).

## Tema 4 — Rediseño del scoring (dominio)  *(depende de Tema 5 para "por característica")*
- **Un solo algoritmo** de calificación (elimina la divergencia agregar vs borrar).
- **Rúbrica por característica** (no por evidencia): se valora el conjunto
  (POA+informe+fotos) y se marca el criterio una sola vez.
- Nota **derivada de la rúbrica**; **solo verificadas** puntúan; **`tier` crítico**
  topa a rojo; **pesos** vía `Valuation.maxValue` (no solo flag).
- Calcular **`totalRubric`**; arreglar bug de pérdida de rúbrica al re-calificar.
- Mantener **salida `qualification` 0–3** en subindicador/instancia (el FE solo la
  pinta; no romper forma de respuesta).
- Entidades: rúbrica re-anclada a característica (nueva colección/relación v2).
  Impacto v1: el cálculo v1 se deja **congelado** (compat); v2 usa el nuevo.
  Riesgo: medio-alto (lógica de negocio núcleo).

## Tema 5 — Modelo de evidencia fuente (la feature grande)  *(motivador del rediseño)*
- **Biblioteca de documentos fuente** a nivel **GAD/período**: el POA se sube
  **una vez** y se **referencia** desde múltiples características/subindicadores.
- **Evidencia con rol explícito**: `kind: 'principal'|'complementaria'` y
  `sourceId` cuando referencia un documento de la biblioteca; **`pages: "12-15"`**
  para apuntar al rango **sin recortar** el PDF (el visor abre la página).
- **Verificación propagable**: si el POA (fuente global) se verifica, propagar a
  las características que lo referencian (o verificar a nivel fuente).
- Entidades nuevas: `SourceDocument` (biblioteca), referencia en `Evidence`
  (`kind`, `sourceId`, `pages`). Impacto v1: v1 sigue con `Evidence.link` plano;
  esto vive en v2. Riesgo: alto (modelo nuevo + storage + migración de datos).

---

## Dependencias y secuencia sugerida
1. **Tema 1** (catálogo/slug) → desbloquea al FE ya, sin tocar dominio.
2. **Tema 2** (order/escala/metadatos) → barato y elimina hardcode.
3. **Tema 3** (roles/permisos) → base para auth de scoring y metodólogo.
4. **Tema 5** (evidencia fuente) → habilita "rúbrica por característica".
5. **Tema 4** (scoring) → al final, ya con rúbrica por característica y roles.

> Notas de compatibilidad: añadir campos a modelos compartidos es seguro para v1
> (respuestas ganan campos opcionales). El **cálculo v1 se congela**; toda la
> lógica nueva vive en v2. Cada tema mantiene el gate de tests verde y añade los
> suyos.
