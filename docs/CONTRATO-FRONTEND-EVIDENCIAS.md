# Contrato real Frontend ↔ Backend: evidencias, rúbrica y semáforo

> Respuestas del **equipo de frontend** a las preguntas del backend para el rediseño.
> Cada respuesta está anclada al código real (archivo:línea). Resumen ejecutivo al
> final. Base URL: `${API_URL}/api`. La cabecera **`tenant` se envía SIEMPRE** en
> toda petición (ver §5).

---

## 1. Payload de calificar — `PUT /api/evidences/qualify/:id`

**Campos exactos del body** (`core/services/evidence.service.ts:35-42`):

```jsonc
{
  "qualification": 3,            // number — calculado por el FE (ver §2)
  "verified": true,             // boolean — "publicar" (switch isPublic)
  "rubric": [                    // una entrada POR criterio (ver abajo)
    { "valuation": "<valuationId>", "qualification": 1 },
    { "valuation": "<valuationId>", "qualification": 0 }
  ],
  "commit": "comentario libre",  // string — comentario del evaluador
  "user": "<userId>"            // string — id del evaluador (del token decodificado)
}
```

- **`user` SÍ se envía** desde el frontend: es `userService.session()?.id` (`components/dialog-check-evidence.ts`, método `qualify()`). Confirmado: `qualificationBy` del backend puede tomarse de `body.user`.
- **`rubric`** es `[{ valuation, qualification }]` y se envía **una entrada por cada criterio de la característica cuyo `maxValue === 1`** (filtro en `dialog-check-evidence.ts:109`). **Se envían TODOS esos criterios**, marcados (`qualification: 1`) y no marcados (`qualification: 0`) — no solo los que tocó el evaluador. ⚠️ **Los criterios con `maxValue !== 1` NO se envían ni se muestran** (la UI los ignora).
- **Re-calificación:** SÍ ocurre. En el historial el botón **Revisar** reabre el diálogo sobre una evidencia ya calificada (`components/history.ts`, `afterClose` recarga). Al abrir, el FE **precarga la rúbrica existente** (`checked = current.some(r => r.valuation === v.id && r.qualification === 1)`) y **reenvía el conjunto completo** de criterios. → Desde el FE **no se pierden criterios** en una re-calificación; el conjunto siempre va completo. Si el backend pierde el enlace de la rúbrica en la 2ª pasada, es un bug del lado servidor, no por payload incompleto.

---

## 2. Relación rúbrica ↔ nota de la evidencia (lo más importante)

- **De dónde sale `qualification`:** lo **calcula el frontend** a partir de la rúbrica:
  `qualification = 1 + (número de criterios marcados)` (`dialog-check-evidence.ts`, `const qualify = 1 + items.filter(i => i.checked).length`). Es decir, **base 1 + Σ(rubric.qualification)**. **No** es un valor que el evaluador escriba aparte.
  → ⚠️ Por tanto la nota y la rúbrica **no son independientes**: la nota ES función de la rúbrica. Si el backend hoy usa `evidence.qualification` e ignora las notas de la rúbrica, el resultado coincide **solo** mientras el FE siga mandando `1 + Σ`. Recomendación de rediseño: **que el backend derive la nota desde la rúbrica** (fuente única) en vez de confiar en un número que manda el cliente.
- **`Valuation.maxValue`:** la UI lo usa **únicamente para filtrar** qué valoraciones se vuelven checkbox (`maxValue === 1`, `dialog-check-evidence.ts:109`). **No** topa ni normaliza la nota por `maxValue`; cada criterio es binario (1/0). Criterios con `maxValue` distinto de 1 quedan fuera de la UI.
- **`totalRubric`:** **no se usa en el frontend** (no aparece en ningún archivo). El FE no lo lee ni lo espera; puedes calcularlo en backend sin romper nada, pero hoy nadie lo consume.

---

## 3. Escalas y semántica

- **Rango de `Rubric.qualification`:** **binario 0 ó 1** por criterio (lo pone el FE según el checkbox).
- **Rango de `evidence.qualification`:** **1 .. (1 + N)**, donde N = nº de criterios con `maxValue===1` de esa característica (por la fórmula `1 + marcados`). **No es 0–3 ni 0–100.**
- **⚠️ Hay DOS escalas distintas, no las mezclen:**
  1. **Nota de evidencia** (la de arriba, base 1).
  2. **Estado/color del subindicador e indicador = 0–3** → `0` gris (no evaluado), `1` rojo, `2` amarillo, `3` verde (`shared/semaphore/semaphore.ts` COLORS; `general-user/components/summary.ts:99-103`). **Esta escala 0–3 la produce el backend**; el FE solo la lee.
  El mapeo de notas de evidencia → color 0–3 hoy vive en el backend; el FE no lo hace.
- **`verified` vs `qualification`:** son **dos acciones distintas** en la UI. `verified` es el switch "Publicado/No publicado" (`isPublic` en el diálogo) y **controla la visibilidad pública**: la vista ciudadana solo muestra evidencias con `verified === true` (`general-user/components/section-evidence.ts`, filtra `.verified`). `qualification` es la nota. El FE confirma que **`verified` no interviene en el cálculo de la nota**; son ortogonales. Si en el backend "una evidencia sin verificar ya puntúa", desde el FE es esperable porque son cosas separadas — habría que decidir en el rediseño si **solo deben puntuar las verificadas**.
- **Nota inicial al subir:** el FE **NO envía `qualification` al crear** la evidencia. El objeto que arma `shared/input-evidence/input-evidence1.ts` es `{ characteristicID, name, link, note, subIndicatorID, verified:false }` (sin `qualification`). → El "por defecto entra como 1 y ya cuenta" es un **default del backend**, no algo que mande el FE. Decisión de rediseño: que una evidencia recién subida y **no verificada/no calificada no puntúe**.

---

## 4. Cálculo del semáforo (subindicador / indicador)

- **Fuente de verdad = backend.** El FE **lee** `subindicator.qualification` e `indicatorInstance.qualification` (0–3) y pinta el color; **no recalcula** a partir de evidencias (`general-user/components/summary.ts:80,99-103`; `shared/semaphore/semaphore.ts:127`). Quien manda es el backend.
- **Endpoints que consume el FE** (no romper su forma de respuesta):
  - Semáforo del cuadrante (ciudadano): `GET /api/indicatorsInstance/byQuadrantAndPeriod?period=&quadrant=` → `IndicatorInstance[]` con `.qualification` (`core/services/indicator-instance.service.ts:33`).
  - Resumen del dashboard admin: `GET /api/indicatorsInstance/summary?period=` y `GET /api/indicatorsInstance/summarySubindicators?period=` (`indicator-instance.service.ts:51-57`; `admin-home/pages/home.ts:233-234`).
  - Subindicadores de un indicador: `GET /api/subIndicators/indicator/:id/all`, `/generalSubindicators`, `/subindicatorsSpecific?page=&size=` (`core/services/subindicator.service.ts`).
  - Evidencias de un subindicador: `GET /api/evidences/subindicatorID/:id` (`evidence.service.ts:44`).
  - El resumen ciudadano (`summary.ts`) **arma el conteo en el cliente** iterando subindicadores + evidencias, pero **leyendo `sub.qualification` 0–3** ya calculado por el backend (no lo deriva).
- **Diferencia agregar vs borrar:** el FE **no implementa recálculo**; tras **agregar, calificar o borrar** simplemente **vuelve a pedir** los datos al backend (`history.ts` recarga; finish-evidence recarga). Por eso cualquier diferencia entre los dos algoritmos del backend la mostraría el FE tal cual; no hay lógica de cálculo en el cliente que lo enmascare.

---

## 5. Reglas de negocio que el código asume

- **Varias evidencias por característica:** SÍ se permiten cuando `characteristic.unique === false`. La UI ofrece "Añadir otra evidencia" (`input-evidence1.ts`) y lista/muestra múltiples por característica (`history.ts`, `section-evidence.ts`). El FE **no opina** sobre promedio/última/mejor: las muestra todas; **la agregación es del backend**. (Hoy el backend promedia → una evidencia mala baja la nota; conviene decidir la política explícitamente.)
- **`tier` (criterios críticos):** en el FE `tier` **solo** se setea al crear características de un subindicador (`add-subindicator.ts:33`, `tier: 1`) y existe en el modelo (`models/characteristic.ts:14`); **no participa en ningún cálculo del FE**. La lógica de "obligatorio/crítico" no está en el cliente — debe vivir en el backend.
- **Header `tenant`:** **se envía SIEMPRE**, en todas las peticiones (subir, calificar, borrar, leer). El interceptor lo añade incondicionalmente: `setHeaders = { tenant: environment.TENATID }` (`core/auth/auth-token.interceptor.ts:10`). El `Authorization: Bearer` solo se añade si hay token. → El recálculo que lee `req.get('tenant')` no debería quedarse sin valor desde este FE.
- **`content: [{ part, key }]` / `parts`:** **el FE NO los usa**. El modelo de evidencia del FE (`models/evidence.ts`) ni siquiera tiene `content`; usa `link`, `name`, `note`, `extras`, `rubric`, `verified`, `qualification`. (El único `content` del código es un campo de notificaciones, sin relación.) → Si esos campos existen en el backend, hoy **no tienen consumidor en este frontend**.

---

## Resumen ejecutivo para el rediseño

1. **El FE calcula la nota** (`qualification = 1 + criterios_marcados`) y la manda; la rúbrica es binaria (0/1) y se envía completa. **Recomendación:** mover la verdad de la nota al **backend, derivándola de la rúbrica**, y dejar de confiar en el número del cliente.
2. **Dos escalas:** nota de evidencia (1..1+N) vs. color 0–3 del subindicador/indicador (lo calcula el backend; el FE solo lo pinta).
3. **`verified` ≠ nota:** `verified` = publicar al ciudadano (gate de visibilidad); decidir si **solo lo verificado puntúa**.
4. **Al crear no se envía nota** → evitar el default que hace puntuar evidencias sin calificar.
5. **`tenant` siempre presente; `user` siempre presente** en qualify.
6. **`maxValue !== 1`, `tier`, `totalRubric`, `content/parts` no se usan en el FE** → libertad para rediseñarlos, pero hay que definir su rol (sobre todo `maxValue>1` y `tier` para criterios ponderados/críticos).
7. **No romper la forma de respuesta** de los endpoints de §4 (semáforo, summary, subIndicators, evidences): el FE depende de `qualification` 0–3 en subindicadores/instancias.
