# Informe de Auditoría — Plataforma de Evaluación ISO 18091 (FIDEGOB)

**Fecha:** 2026-07-04
**Alcance:** Backend de la plataforma (rama `refactor`, commit base `a86d2fa`), incluyendo el
sistema legado (v1) y el sistema nuevo (v2), la metodología de calificación, la migración de
datos v1→v2 y los datos reales del GAD de Loja, período 2023.
**Equipo auditor:** líder experto en ISO 18091 y en la plataforma FIDEGOB, más cuatro
especialistas: metodología de evaluación (hallazgos M-xx), arquitectura de sistema (A-xx),
calidad de código (C-xx) y optimización/rendimiento (O-xx).
**Verificación automática:** compilación (`tsc`), análisis estático (`eslint`) y verificación de
tipos pasan sin errores. La suite de pruebas del proyecto (472 pruebas) está en verde.

---

# SECCIÓN 1 — INFORME PARA EL MUNICIPIO (lenguaje claro)

## 1.1 Qué hace la plataforma y cómo califica

La plataforma implementa el diagnóstico de la norma **ISO 18091** (directrices para gobiernos
locales confiables). El territorio del municipio se evalúa en **4 cuadrantes** (Desarrollo
Institucional, Económico, Social y Ambiental), cada cuadrante contiene **indicadores**
(por ejemplo, *1.10 Seguridad pública*), cada indicador se desglosa en **subindicadores**
(por ejemplo, *Instancia responsable*, *Diagnóstico*, *Mecanismo, Normativa y Reglamentación*)
y cada subindicador se demuestra con **evidencias**: documentos oficiales (ordenanzas, POA,
informes) que el municipio sube a la plataforma.

El resultado se muestra como un **semáforo**:

| Color | Significado |
|---|---|
| 🟢 Verde | La práctica existe, está documentada y verificada |
| 🟡 Amarillo | Existe parcialmente |
| 🔴 Rojo | No se demuestra o es insuficiente |
| ⚪ Sin evaluar | No hay evidencia **verificada** para calificar |

**La regla más importante del sistema nuevo (v2):** *solo cuenta la evidencia que un evaluador
autorizado revisó y marcó como verificada*. Subir un documento no cambia el semáforo; el
color solo cambia cuando alguien —distinto de quien lo subió— lo verifica y califica contra
una **rúbrica** (una lista de criterios con pesos definidos en el catálogo, no manipulable
por quien sube el documento).

## 1.2 Conclusión general de la auditoría

**El sistema nuevo (v2) es metodológicamente correcto, trazable y auditable a mano** — la
fórmula de calificación es determinista, la separación de funciones (quien sube ≠ quien
califica ≠ quien publica) está implementada, los pesos de la rúbrica los fija el servidor, y
existe un registro de auditoría de cada acción. Esto lo confirmaron los cuatro especialistas.

**Sin embargo, el sistema NO debe presentarse como oficial al municipio todavía.** La auditoría
encontró condiciones que deben resolverse primero:

1. **El sistema antiguo (v1) sigue activo en paralelo y califica distinto.** v1 usa umbrales
   fijos que ignoran el catálogo, cuenta evidencias sin verificar y permite atribuir una
   calificación a otra persona. Mientras ambos convivan, el mismo subindicador puede mostrar
   un color u otro según qué sistema hizo el último cálculo. **El corte a v2 (y la
   congelación de v1) es prerrequisito de cualquier informe oficial.**
2. **Existen puertas abiertas de seguridad** que permitirían a un tercero alterar catálogos,
   rúbricas y roles sin usuario ni contraseña, y consultar datos de otro municipio. Están
   identificadas con precisión y su corrección es directa (ver Sección 2).
3. **Hay datos de prueba mezclados con datos reales** del GAD de Loja: los subindicadores
   "Prueba 1" (indicador 1.1) y "Proyecto camaras" (indicador 1.10) no pertenecen al estándar
   ISO 18091 y aparecen en los resultados. Deben eliminarse o desactivarse antes de publicar.

## 1.3 Por qué cambian los colores con el sistema nuevo (105 cambios en Loja 2023)

Al recalcular el período 2023 del GAD de Loja con la metodología corregida, **105 de los
~450 semáforos cambian de color**. No es un error: es la consecuencia de aplicar las reglas
correctas. Los tres patrones, en lenguaje llano:

- **27 subieron de amarillo a verde** (típicamente *Instancia responsable*): el sistema
  antiguo penalizaba al subindicador por características sin evidencia; el nuevo solo
  promedia lo que sí fue verificado, y lo verificado estaba completo.
- **26 pasaron de "sin evaluar" a rojo** (casi todos *Mecanismo, Normativa y Reglamentación*):
  antes el sistema los dejaba en blanco; ahora reconoce que hay evidencia verificada pero los
  criterios de la rúbrica no se cumplen → rojo. Es información nueva, no una pérdida.
- **Todo el Cuadrante 2 (Desarrollo Económico) pasó a "sin evaluar" (28 casos)**: las
  evidencias de ese cuadrante **nunca fueron marcadas como verificadas** en el sistema
  antiguo, que las contaba de todos modos. El nuevo sistema, correctamente, no las cuenta.
  ⚠️ **Esto NO significa que el municipio no trabajó el cuadrante 2**: significa que falta el
  paso formal de verificación. Recomendamos una jornada de re-verificación de esas evidencias
  antes de publicar resultados, y comunicar el cambio de metodología al GAD por escrito.
- **16 indicadores bajaron de amarillo a rojo** por la regla "el indicador vale lo que su peor
  subindicador evaluado" (la regla estándar ISO: una cadena es tan fuerte como su eslabón más
  débil). El sistema antiguo usaba una regla aritmética arbitraria que además impedía que un
  indicador con menos de 5 subindicadores llegara a verde, aunque todos fueran verdes.

## 1.4 EJERCICIO AUDITABLE — validar un semáforo a mano, con papel y calculadora

Este ejercicio permite a cualquier funcionario del municipio (o a un auditor externo)
**recalcular un semáforo sin confiar en el software** y comprobar que coincide con lo que
muestra la plataforma. Usamos el caso real del diff: subindicador **"Instancia responsable"**
del indicador **1.10 Seguridad pública**, GAD de Loja, año **2023**, que pasó de amarillo
(sistema antiguo) a **verde** (sistema nuevo).

### Paso 0 — Obtener los datos (sin necesidad de clave, portal público)

Con cualquier navegador o herramienta HTTP, usando el identificador del GAD como `tenant`:

1. Períodos del GAD: `GET /api/v2/periods` (header `tenant: <id del GAD>`), anotar el período 2023.
2. Semáforo del indicador 1.10: `GET /api/v2/indicator-instances/summary?period=<id>` — anotar el color publicado.
3. Subindicadores del 1.10: `GET /api/v2/subindicators?...` — anotar la `qualification` (0–3) de "Instancia responsable".
4. Evidencias **publicadas**: `GET /api/v2/evidences` — el portal solo muestra las verificadas; cada una indica a qué característica corresponde.

Un funcionario con acceso de administrador puede además pedir el detalle de la rúbrica
(criterios y pesos) y el registro de auditoría (`GET /api/v2/audit-log`) que dice quién
subió, quién calificó y quién verificó cada evidencia, con fecha y hora.

### Paso 1 — Anotar la rúbrica de cada característica

El subindicador es de un **tipo** del catálogo; el tipo define sus **características** y cada
característica tiene **criterios con peso** (los pesos vienen del catálogo de valoraciones,
no los elige el evaluador). Formato de hoja de trabajo (valores de ejemplo del caso):

| Característica | Criterio | Peso | ¿Cumplido? | ¿Evidencia verificada? |
|---|---|---|---|---|
| A. ¿Existe unidad responsable? | Acto de creación | 1 | Sí | Sí |
| A. ¿Existe unidad responsable? | Personal asignado | 1 | Sí | Sí |
| B. ¿Está normada? | Ordenanza vigente | 1 | No | **No** |

### Paso 2 — Calcular el porcentaje de cada característica

`porcentaje = (suma de pesos de criterios cumplidos) ÷ (suma de pesos de todos los criterios)`

- Característica A: (1 + 1) ÷ (1 + 1) = **1.00 (100 %)**
- Característica B: **se descarta** — no tiene evidencia verificada (regla de oro: sin
  verificación no puntúa; queda como "sin evaluar" individual).

### Paso 3 — Promediar solo las características verificadas

`nota del subindicador = suma de porcentajes verificados ÷ cantidad de características verificadas`

- Nota = 1.00 ÷ 1 = **1.00 (100 %)**

**Regla de control (característica crítica):** si el tipo marca alguna característica como
*crítica* y esa característica no tiene evidencia verificada o su porcentaje es 0, el
subindicador se fuerza a **rojo** aunque el promedio sea alto. En este caso no hay críticas.

### Paso 4 — Convertir el porcentaje a color

Los umbrales vienen del catálogo del tipo (si no están definidos, se usan 50 % y 75 %):

| Condición | Color |
|---|---|
| Sin ninguna característica verificada | ⚪ Sin evaluar (0) |
| porcentaje < 50 % | 🔴 Rojo (1) |
| 50 % ≤ porcentaje < 75 % | 🟡 Amarillo (2) |
| porcentaje ≥ 75 % | 🟢 Verde (3) |

- 1.00 ≥ 0.75 → **🟢 VERDE (3)** ✔ coincide con lo que publica la plataforma v2.

### Paso 5 — Verificar el indicador completo

`color del indicador 1.10 = el MÍNIMO de los colores de sus subindicadores evaluados (>0)`

Si "Instancia responsable" = verde (3), "Mecanismo, Normativa y Reglamentación" = rojo (1) y
"Diagnóstico" = amarillo (2) → indicador 1.10 = **mín(3, 1, 2) = 1 → 🔴 Rojo**. Los
subindicadores "sin evaluar" (0) no cuentan en el mínimo; si todos están en 0, el indicador
queda "sin evaluar".

### Criterio de aceptación del ejercicio

El ejercicio **pasa** si: (a) el color calculado a mano coincide con el del portal; (b) toda
evidencia que puntuó aparece como verificada, con verificador distinto del autor en el
registro de auditoría; y (c) los pesos usados coinciden con el catálogo. Si algo no coincide,
repórtelo al equipo técnico citando el subindicador, el año y esta hoja de cálculo.

> **Nota de transparencia:** este mismo ejercicio ejecutado sobre el sistema **antiguo** (v1)
> no es reproducible: v1 usa umbrales distintos a los del catálogo, cuenta evidencia sin
> verificar y su fórmula del indicador no corresponde a la norma. Esa es precisamente la razón
> del cambio al sistema v2.

---

# SECCIÓN 2 — INFORME TÉCNICO (equipo de desarrollo)

## 2.1 Veredicto consolidado

| Área | Especialista | Veredicto |
|---|---|---|
| Metodología de evaluación | M-01…M-21 | **Cambios requeridos** (7 bloqueantes) |
| Arquitectura | A-01…A-20 | **Cambios requeridos** (5 bloqueantes) |
| Clean code | C-01…C-12 | **Aprobado** (deuda de mantenibilidad, sin bloqueantes) |
| Optimización | O-01…O-18 | Sin bloqueantes funcionales; 1 bug silencioso (O-12) y 6 hallazgos ALTOS |

El scoring v2 (`src/v2/services/scoring.service.ts`) es la **fuente única de verdad válida**:
determinista, idempotente, documentado y con tests de dominio. Los bloqueantes están en el
perímetro: seguridad de endpoints, convivencia v1/v2 y operación.

## 2.2 Bloqueantes (resolver ANTES de presentar resultados o del freeze de v1)

| # | ID | Hallazgo | Evidencia |
|---|---|---|---|
| 1 | A-01 / M-11 | **Mutaciones sin autenticación en /api/v2**: `indicators`, `ods`, `rubric`, `rol` (¡define permisos!), `sponsors`, `news`, `valuation` exponen POST/PUT/DELETE sin `authenticate` ni `requirePermission`. | `src/api/v2/resources/{indicators,ods,rubric,rol,sponsors,news,valuation}.routes.ts` |
| 2 | A-02 | **Tenant no validado contra el token**: cualquier autenticado accede a datos de otro GAD cambiando el header `tenant` (el JWT no lleva `gadId` y nadie lo cruza). | `users.routes.ts:62-68`, `period.routes.ts:52-59`, `indicatorInstance.routes.ts:58-64` |
| 3 | A-04 | **Credenciales de MongoDB en logs**: `logger.info('conecting to', config.MONGODB_URI)` imprime usuario:contraseña en Railway. La credencial actual ya se expuso en logs/conversaciones → **rotar en Atlas**. | `index.js:9` |
| 4 | M-01/02/03/04 | **Tres algoritmos de scoring conviven**: v1 (`qualifySubindicator` y `autoQualifySubindicator`) usa umbrales hardcodeados (0.9/0.5/0.2), puntúa evidencia sin verificar y toma `qualificationBy` del body (suplantable). Mientras v1 escriba, el semáforo depende de qué ruta disparó el último cálculo. | `src/services/qualification.service.ts:64-187`, `controllers/evidence.ts:144,210` |
| 5 | A-05 / O-06 | **`subindicator.save()` sin `await`** en el clonado de período: pérdida silenciosa de datos, instancias apuntando a subindicadores nunca persistidos, sin transacción. | `src/v2/repositories/period.repository.ts:65` |
| 6 | O-12 | **Bug silencioso en `$lookup`**: los aggregates de summary hacen join contra `v2_gad` pero la colección es `v2_gads` → `gadId: []` siempre en las respuestas de summary v2. | `src/v2/repositories/indicator-instance.repository.ts:82,133` |
| 7 | A-03 | **El server escucha antes de conectar a Mongo** y sigue vivo si la conexión falla (solo loguea). | `index.js:7-22` |
| 8 | M-08 | **Datos de prueba en producción**: subindicadores "Prueba 1" (1.1) y "Proyecto camaras" (1.10) con evidencias que puntúan en el informe oficial de Loja 2023. | `docs/refactor-reports/diff-puntajes-legible.md:31,35` |

## 2.3 Hallazgos ALTOS (siguiente sprint)

**Seguridad / integridad**
- **M-06** Audit log "append-only" solo por convención: `AuditLogRepository` hereda
  `updateById`/`deleteById` de `BaseRepository`; sin índice `{timestamp:-1}`. Sobrescribir
  ambos métodos para lanzar error + añadir índices.
- **M-05** v1 no exige autor ≠ calificador (v2 sí). Parche mínimo en v1 o cierre de la ruta.
- **A-06 / C-06** `require-admin.ts:32` lee `process.env.ROL_ADMIN` en vez de `env.ROL_ADMIN`
  (config divergente puede bloquear a todos con 403 o aceptar roles incorrectos).
- **A-07** `GET /api/v2/indicator-instances` sin tenant devuelve TODOS los GADs con populate
  profundo, sin auth. Exigir tenant o autenticación.
- **A-12** `evidence:qualify` y `evidence:publish` no están asignados a ningún rol fuera de
  Administrador; definir el rol Metodólogo en `PERMISSIONS_BY_ROLE`.
- **M-17** Propagación de verificación del source document (POA) sin transacción: fallo
  parcial deja subindicadores inconsistentes. Usar `session.withTransaction` (Atlas lo soporta).
- **A-10** Sin `helmet` ni rate limiting (fuerza bruta libre sobre `/api/login`).
- **A-09** Sin graceful shutdown (`SIGTERM`) — Railway mata el proceso con requests en vuelo.

**Rendimiento (request-path)**
- **O-01** `Rol.findById` en cada request autenticado (2–3 queries/req): cache en memoria con
  TTL ~5 min (catálogo de <10 docs).
- **O-02** `PUT /evidences/:id/qualify` dispara ~15 queries secuenciales; consolidar
  `recomputeSubindicator` (devolver `indicatorInstanceId`, `Promise.all` en lecturas
  independientes, fusionar `syncAssessmentVerified`).
- **O-05** `PATCH /source-documents/:id/verify`: ~145 queries para un POA con 20 evidencias.
  Pre-cargar assessments con `$in` + `updateMany` + `insertMany` de audits.
- **O-07 / A-11** Índices faltantes (COLLSCAN hoy): `v2_evidences{subindicatorId,characteristicId}` y `{sourceId}`,
  `v2_subindicators{indicatorInstanceId}`, `v2_indicator_instances{gadId,year}` y `{period,gadId}`,
  `v2_periods{gad}`, `v2_source_documents{gadId,periodId}`, `v2_notifications{sendTo,date}`,
  `v2_audit_log{timestamp}` y `{entityType,action}`.
- **O-03/O-04** Migración: reemplazar upserts doc-a-doc por `bulkWrite` (batches de 500) y
  eliminar las ~2 120 queries del recompute masivo (cargar assessments una vez, procesar en memoria).
- **O-08…O-10** `summary` hace 4 aggregates secuenciales (unificar pipeline o `Promise.all`);
  listados sin paginación por defecto con populate en cascada (forzar tamaño máximo).

**Metodología (decisiones de dominio, requieren al Metodólogo/GAD)**
- **M-07** Cuadrante 2 → "sin evaluar": comunicar el cambio metodológico y re-verificar
  evidencias de Q2 antes de publicar (no es bug, es la regla nueva).
- **M-10** Regla de característica crítica laxa (`percent > 0` la satisface) y sin UI para
  marcar `tier > 1` → hoy es letra muerta. Decidir umbral y exponer en UI.
- **M-12** Cambio de fórmula del indicador (mín vs conteo `>4` de v1): documentar como
  corrección metodológica y notificar al GAD (explica 16 amarillo→rojo).
- **M-13/M-14** Anexo A (niveles de madurez) y PDCA (planes de mejora): modelos reservados,
  flujo sin implementar — el diagnóstico está incompleto respecto a la norma (roadmap).
- **M-09** Audit log sin before/after del assessment: añadir diff de criterios en `meta` y
  evento `subindicator.qualification.changed {before, after}`.
- **M-16** Participación ciudadana solo lectura; la norma promueve retroalimentación
  (mecanismo de reporte de discrepancias — roadmap).

## 2.4 Deuda de mantenibilidad (clean code — no bloquea)

- **C-01** `BaseRepository` duplicado byte a byte (`src/repositories` vs `src/v2/repositories`,
  41 repos concretos) → unificar en módulo compartido.
- **C-02** >60 usos de `as unknown as` (scoring.service, evidence.routes, notification.service):
  exportar las interfaces de documento v2 (`IEvidenceV2`, …) y usar `.lean<T>()`; hoy el
  compilador no protege contra renombres de campos.
- **C-03** `resolveTenant` copiado en 3 routers (+5 accesos directos al header) → helper único
  (encaja con el fix de A-02).
- **C-05 / A-14** Docstrings obsoletos en `evidence.routes.ts` ("NO recalcula score, TODO
  Tema 4") que contradicen el código ya implementado → actualizar.
- **C-08** Slug `'metodlogo'` (typo) en la migración del rol Metodólogo; **C-07** typo
  "Indicadaor" visible al usuario en notificaciones.
- **C-10** `elevatedAuth`/`baseUserAuth` duplicados en 7+ archivos de test → mover a
  `test/helpers/seed-v2.js`.
- **C-11** Umbrales legacy (0.9/0.5/0.2, `count3 > 4`) sin constantes nombradas; exportar
  `DEFAULT_RED`/`DEFAULT_YELLOW` de v2 desde `src/constants/qualification.ts`.
- **A-13** Dos loggers con interfaces distintas (`utils/logger.js` vs `src/utils/logger.ts`),
  el legacy loguea también en tests.
- **A-15** `migrate.ts` importa `utils/config.js` con `require()` dinámico → usar `src/config/env.ts`.
- **M-18** `indicatorInstanceId` en `IndicatorInstanceV2` referencia al **catálogo**
  `IndicatorV2` (nombre engañoso) → renombrar a `indicatorId` o documentar.

## 2.5 Fortalezas verificadas

- **Segregación de funciones en v2** (M-19): autor ≠ calificador forzado con 403; permisos
  atómicos `evidence:upload/qualify/publish` separados por rol.
- **Pesos inmutables server-side** (M-20): qualify ignora `weight` del cliente y usa
  `ValuationV2.maxValue` de BD, validando pertenencia de las valuations a la característica.
- **Scoring idempotente y documentado** (M-21, C-F1): recalcular N veces da el mismo
  resultado; el encabezado de `scoring.service.ts` documenta fórmula, casos borde y defaults.
- **Tests de dominio reales** (A-19, C-F2): 472 tests con mongodb-memory-server; scoring
  testeado por valores (`qualification`, `score`), no solo por status codes.
- **Error handling v2 consistente** (A-18): envelope `{data,meta}`/`{error:{code,message}}`,
  `asyncHandler`, ZodError/CastError mapeados; aislado del handler legacy.
- **Modelo de permisos extensible** (A-20) y **migración con Maps en memoria** en la etapa de
  assessments (O-16), `findPage` con `Promise.all` (O-18), deduplicación con `Set` en la
  propagación (O-17). Sin `console.log` en código nuevo (C-F4).

## 2.6 Plan de acción priorizado

| Prioridad | Acción | Hallazgos que cierra |
|---|---|---|
| **P0 — hoy** | Rotar credencial de Atlas + sanear log de URI (`index.js:9`) | A-04 |
| **P0 — hoy** | `authenticate` + `requirePermission` en los 7 routers v2 sin auth | A-01, M-11 |
| **P0 — hoy** | Corregir `$lookup` `v2_gad`→`v2_gads` (2 pipelines) + test | O-12 |
| **P0 — hoy** | `await`/`insertMany` en `period.repository.ts:65` | A-05, O-06 |
| **P1 — esta semana** | Validación tenant↔token (cargar `gadId` del usuario o claim en JWT) | A-02, C-03 |
| **P1 — esta semana** | v1: `qualificationBy` desde token + desactivar scoring v1 (o freeze anticipado de escrituras de calificación) | M-01…M-05 |
| **P1 — esta semana** | Audit log inmutable (override repos) + índices declarados en modelos v2 | M-06, O-07, A-11 |
| **P1 — esta semana** | `listen` tras `connect` + SIGTERM + helmet + rate-limit en login | A-03, A-09, A-10 |
| **P2 — antes del corte** | Limpieza de datos de prueba + re-verificación Q2 + acta de cambio metodológico firmada por el GAD | M-07, M-08, M-12 |
| **P2 — antes del corte** | Cache de roles, optimización de qualify/verify, transacción en propagación, `bulkWrite` en migración | O-01…O-05, M-17 |
| **P3 — roadmap** | Anexo A (madurez), PDCA, participación ciudadana, unificación BaseRepository, tipado sin casts | M-13, M-14, M-16, C-01, C-02 |

## 2.7 Condición de cierre

La plataforma puede declararse **apta para informe oficial ISO 18091** cuando: (1) P0 y P1
estén cerrados y verificados con tests; (2) la migración definitiva se ejecute con respaldo y
el diff de puntajes esté **validado y firmado por el GAD**; (3) v1 quede congelado en modo
lectura; y (4) el ejercicio auditable de la Sección 1.4 sea reproducido con éxito por una
persona ajena al equipo de desarrollo sobre datos reales.

---

*Informe elaborado por el equipo auditor (líder ISO 18091 + 4 especialistas). Los hallazgos
citan archivo y línea del commit auditado; toda afirmación fue verificada en el código, no
inferida. Detalle completo de cada hallazgo disponible en los anexos de trabajo del equipo.*
