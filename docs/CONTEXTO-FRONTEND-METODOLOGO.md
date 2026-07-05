# Contexto para el Frontend — Vista del rol **Metodólogo** (API v2)

**Fecha:** 2026-07-04 · **Fuente:** código de la rama `refactor` (todo lo descrito aquí
existe y está implementado hoy; verificado archivo por archivo).

---

## 1. Qué es el Metodólogo en el sistema

El Metodólogo es el rol que **define el estándar de evaluación** (el catálogo ISO): tipos,
características, criterios de la rúbrica y sus pesos. **No opera datos de campo**: no sube
evidencias, no califica, no publica, no gestiona usuarios ni GADs. La rúbrica y el catálogo
son **globales** (los mismos para todos los GADs); por eso sus endpoints **no requieren el
header `tenant`**.

### Permisos exactos del rol (fuente: `src/v2/constants/permissions.ts`)

```
Metodólogo = ['rubric:configure', 'catalog:manage', 'public:read']
```

Los guards de v2 gatean **por permiso, no por nombre de rol** (`requirePermission(...)`).
Si el rol no tiene el permiso → `403 FORBIDDEN` con `error.code: 'FORBIDDEN'`,
`message: 'missing permission'`.

### El rol en la base de datos (colección `v2_rols`, creado por la migración)

| Campo | Valor |
|---|---|
| `name` | `Metodólogo` |
| `slug` | `metodlogo` ⚠️ (sic — el slug actual está sin la "o"; usar el **id** o `name` como referencia, no el slug) |
| `permissions` | `['rubric:configure', 'catalog:manage', 'public:read']` |

La migración crea el rol **sin usuarios asignados**. Para probar la vista, un Administrador
debe asignar este rol a un usuario (`PUT /api/v2/users/:id`, permiso `user:manage`).

---

## 2. Autenticación y sesión

- **Login:** `POST /api/login` (el único login; compartido v1/v2). Devuelve el JWT.
- Enviar en cada request: `Authorization: Bearer <token>`.
- El token lleva `{ id, rol, mail, name }`. La capa v2 resuelve `rol` contra `v2_rols`;
  funciona porque la migración **conserva los mismos `_id`** de v1 en v2.
- **`GET /api/v2/me`** (autenticado) → el usuario v2 sin password, con `rol` y `gadId`
  **poblados**. Aquí el FE lee `user.rol.permissions` para decidir qué mostrar/ocultar en la
  vista (mismo criterio que usa el backend).
- Errores de auth: sin token o inválido → `401 { error: { code: 'UNAUTHORIZED' } }`;
  con token pero sin permiso → `403 { error: { code: 'FORBIDDEN', message: 'missing permission' } }`.

**Envelope v2 (todas las respuestas):** éxito `{ data, meta? }` · error
`{ error: { code, message, details? } }` · validación fallida → `400 VALIDATION_ERROR`.
Contrato navegable: **`GET /api/v2/docs`** (Swagger UI) y `GET /api/v2/openapi.json`.

---

## 3. El modelo de datos que edita el Metodólogo

Jerarquía del catálogo (colecciones `v2_types`, `v2_characteristics`, `v2_valuations`):

```
Type (tipo de subindicador)
 ├── red / yellow / green   ← DESCRIPTORES CUALITATIVOS ISO (texto largo), NO umbrales.
 │                             p.ej. red = "No cuenta con un diagnóstico de…",
 │                             verde = "Cuenta con un diagnóstico actualizado…".
 │                             Editar como TEXTO. ⚠️ Ver la nota de abajo.
 ├── mandatory              ← true = tipo general (aplica a todos los subindicadores)
 ├── slug, order            ← presentación/navegación estable
 └── characteristics[]      ← refs a CharacteristicV2
       Characteristic
        ├── name, group, groupName, help
        ├── tier             ← Number; tier > 1 = característica CRÍTICA (ver §5)
        ├── inputKind        ← 'file' | 'link' (qué widget muestra el FE)
        ├── allowedFormats[] ← formatos de archivo aceptados
        ├── isCover          ← flag de portada
        ├── slug, order
        └── valuations[]     ← refs a ValuationV2 (los criterios de la rúbrica)
              Valuation
               ├── name, category
               ├── maxValue  ← EL PESO del criterio en el scoring (lo fija el servidor)
               └── slug, order
```

Notas importantes para la vista:
- ⚠️ **CORRECCIÓN (versión previa de este doc era errónea).** `Type.red/yellow/green`
  son **strings** que contienen los **descriptores cualitativos de la norma ISO** (las
  frases del cuadro COLOR/PARÁMETROS de FIDEGOC: qué significa que un subindicador esté
  en rojo/amarillo/verde). **NO son umbrales numéricos.** La vista debe editarlos como
  **texto libre (frase larga)**. Si el diálogo los guarda como número (`"0.5"`)
  **sobrescribe y destruye el descriptor ISO** → pérdida de datos. No hacerlo.
- Los **umbrales numéricos del semáforo son GLOBALES y viven en el backend**
  (rojo < 0.50 ≤ amarillo < 0.75 ≤ verde). No se editan por tipo desde esta vista.
  Ver §5 para el detalle de cómo se calcula el color.
- Los listados de catálogo salen **ordenados por `order` asc, desempate por `name`**.
- Todo `_id` sale serializado como `id` en el JSON (el toJSON elimina `_id`/`__v`).

---

## 4. Endpoints disponibles para la vista

### Lectura (públicos, sin token — sirven para pintar el catálogo)

| Endpoint | Devuelve |
|---|---|
| `GET /api/v2/types?mandatory=true\|false&page=&size=` | Tipos ordenados, con `characteristics` **pobladas** |
| `GET /api/v2/types/:id` | Un tipo con `characteristics` pobladas |
| `GET /api/v2/characteristics/:id` | Una característica con sus `valuations` **pobladas** |
| `GET /api/v2/characteristics` | Todas las características (⚠️ el filtro `?type=` no es confiable hoy; para "características de un tipo" usar `GET /types/:id`) |
| `GET /api/v2/valuation?page=&size=` · `GET /api/v2/valuation/:id` | Catálogo de criterios/pesos |
| `GET /api/v2/config/semaphore` | Escala canónica 0–3: `{ value, key, label, color }` × 4 niveles + nota. Los colores son placeholders. Los **umbrales numéricos son globales** (0.50/0.75, fijados en el backend); `Type.red/yellow/green` son descriptores de texto, no umbrales |
| `GET /api/v2/subindicators/:subindicatorId/assessments` (y `/:characteristicId`) | Rúbrica aplicada (assessment) por característica: criterios `met`, `score`, `totalRubric`, `verified`, `qualifiedBy` poblado — útil para que el Metodólogo vea cómo se está usando su rúbrica en campo |

La paginación es opcional en todos los listados: sin `?page=&size=` devuelve todo; con
ellos, `meta.pagination = { page, size, total, totalPages }`.

### Escritura (requieren token con los permisos del Metodólogo)

**Con `catalog:manage`:**

| Endpoint | Body (Zod) |
|---|---|
| `POST /api/v2/types` | `{ name, red, yellow, green, mandatory, extraInfo?, characteristics?[ids], slug?, order? }` → 201 |
| `PUT /api/v2/types/:id` | mismo body (reemplazo completo) → 200 \| 404 |
| `DELETE /api/v2/types/:id` | → 204 \| 404 |
| `POST /api/v2/characteristics` | `{ name, group, groupName, tier, valuations[ids], allowedFormats[], score?, help?, isRequired?, required?, unique?, parts?[], inputKind?('file'\|'link'), isCover?, slug?, order? }` → 201 |
| `PUT /api/v2/characteristics/:id` | `{ name, group, groupName, required, tier, isRequired, unique, score?, inputKind?, isCover?, slug?, order? }` (no toca valuations) → 200 \| 404 |
| `DELETE /api/v2/characteristics/:id` | → 204 \| 404 |
| `PATCH /api/v2/characteristics/:id/inputKind` | `{ inputKind: 'file' \| 'link' }` |
| `PATCH /api/v2/characteristics/:id/format` | `{ format: string }` |
| `PATCH /api/v2/characteristics/:id/extras` | `{ extras: <libre> }` |

**Con `rubric:configure` (el permiso distintivo del Metodólogo):**

| Endpoint | Body |
|---|---|
| `PATCH /api/v2/characteristics/:id/valuation` | `{ valuations: [ids de ValuationV2] }` — reasigna los criterios de la rúbrica de esa característica |

**Valuations (criterios/pesos):** existen `POST /api/v2/valuation`,
`PUT /api/v2/valuation/:id` y `DELETE /api/v2/valuation/:id` con body
`{ name, category, maxValue, slug?, order? }`. ⚠️ Estado actual: estas tres mutaciones
**aún no exigen token** (hallazgo abierto de la auditoría interna). El FE debe enviar
igualmente el Bearer del Metodólogo en ellas: es el comportamiento correcto y evitará
romperse cuando el guard se aplique.

**Auditoría:** las mutaciones de types y characteristics **registran en `v2_audit_log`**
(actor, acción, entidad). El endpoint de consulta `GET /api/v2/audit-log` requiere
`user:manage`, así que el **Metodólogo NO puede leer el audit log** (le dará 403); esa
consulta es de la vista de Administrador.

### Lo que el Metodólogo NO puede hacer (el FE debe ocultar/deshabilitar)

403 garantizado por falta de permiso: subir/editar evidencias (`evidence:upload`),
calificar (`evidence:qualify`), publicar/verificar (`evidence:publish`), crear
subindicadores (`subindicator:create`), editar instancias de indicador
(`indicator:create`), gestionar GADs (`gad:config`), usuarios y audit-log (`user:manage`),
y crear/borrar períodos (guard de rol elevado en `/api/v2/periods` — el guard actual
`requireElevatedRole` sí deja pasar a cualquier rol ≠ Ciudadano, incluido Metodólogo, pero
funcionalmente los períodos son del flujo Administrador; no incluirlo en esta vista).

---

## 5. Cómo impacta lo que edita el Metodólogo en el scoring (clave para la UX)

El scoring v2 (`src/v2/services/scoring.service.ts`) consume directamente el catálogo:

1. **`Valuation.maxValue` = peso del criterio.** Al calificar una evidencia, el servidor
   **ignora cualquier peso enviado por el cliente** y usa el `maxValue` de BD. La nota de
   una característica = (Σ pesos de criterios cumplidos) ÷ (Σ pesos de todos los criterios).
2. **Umbrales del semáforo = GLOBALES (0.50 / 0.75), NO por tipo.** El backend mapea el
   porcentaje a color así: < 0.50 → rojo (1); < 0.75 → amarillo (2); ≥ 0.75 → verde (3).
   ⚠️ El código intenta leer estos umbrales de `Type.red`/`Type.yellow` con `parseFloat`,
   pero como esos campos contienen **texto descriptivo** (no números), el `parseFloat` da
   `NaN` y **siempre cae a los defaults globales 0.50 / 0.75**. En la práctica, HOY el
   umbral es único para todos los tipos. Editar los descriptores `red/yellow/green` (texto)
   **no cambia el punto de corte del semáforo**; solo cambia el rótulo cualitativo que
   describe cada color. (Ver la nota de la §3: no enviar números en esos campos.)
3. **`Characteristic.tier > 1` = característica crítica.** Si una característica crítica no
   tiene evidencia verificada (o su porcentaje es 0), el subindicador se **fuerza a rojo**
   sin importar el promedio. Con `tier = 1` la regla no aplica.
4. **Solo evidencia verificada puntúa**: un assessment cuenta únicamente si `verified: true`
   (derivado de las evidencias verificadas del par subindicador+característica).
5. **Indicador = mínimo** de las calificaciones (>0) de sus subindicadores.

⚠️ **Editar el catálogo NO recalcula retroactivamente** los semáforos existentes: el
recálculo se dispara al calificar/publicar/verificar/eliminar evidencias. Si el Metodólogo
cambia los pesos (`Valuation.maxValue`) o el `tier`, los puntajes ya calculados quedan como
estaban hasta el siguiente evento de calificación de cada subindicador. La vista debería
advertirlo al guardar. (Editar los descriptores `red/yellow/green` no afecta el cálculo.)

---

## 6. Resumen operativo para armar la vista

1. Tras login (`POST /api/v2/login` con `{ email, password }`), llamar `GET /api/v2/me` → si
   `user.rol.permissions` incluye `rubric:configure`, habilitar la vista Metodólogo.
2. Cargar en paralelo: `GET /types` (árbol tipo→características poblado),
   `GET /valuation` (biblioteca de criterios), `GET /config/semaphore` (escala/labels).
3. Editor de rúbrica de una característica: `GET /characteristics/:id` (valuations
   pobladas) → editar la lista → `PATCH /characteristics/:id/valuation`.
4. Editor de descriptores del tipo: `PUT /types/:id` con `red`/`yellow`/`green` como
   **texto** (las frases ISO). NO como números. (Los umbrales numéricos son globales; no se
   editan aquí — ver §5.)
5. Marcar una característica como crítica: `PUT /characteristics/:id` con `tier: 2`.
6. Sin header `tenant` en nada de lo anterior (catálogo global); Bearer token en toda
   mutación; manejar `401/403/400/404` con los códigos del envelope.
