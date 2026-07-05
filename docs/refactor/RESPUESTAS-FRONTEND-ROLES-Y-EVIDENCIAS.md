# Respuestas del Frontend (ronda 2): roles/permisos y agrupación de evidencias

> Respuestas ancladas a código real (archivo:línea). Complementa a
> `CONTRATO-FRONTEND-EVIDENCIAS.md`. **Corrección importante de contexto** abajo.

## ⚠️ Corrección al contexto del backend

El backend asumía "solo `ROL_ADMIN` ('Administrador') y `ROL_USER` ('Ciudadano')".
La realidad del FE es distinta (`src/environments/environment.ts:6-7`):

```ts
ROL_ADMIN: 'Administrador',
ROL_RESPONSIBLE: 'Responsable',
// NO existe ROL_USER. "Ciudadano" es implícito = cualquier rol que no sea
// Administrador ni Responsable (no hay constante para él).
```

→ **Hay 3 roles efectivos** y **ya existe segregación de funciones** en la UI (ver §6).

---

## A. Roles y permisos

### 1. Roles que existen hoy
- **Administrador** (`ROL_ADMIN`): control total (califica, publica, configura GAD, gestiona usuarios).
- **Responsable** (`ROL_RESPONSIBLE`): perfil del GAD que **crea subindicadores y sube evidencia**, pero **no califica ni publica**.
- **Ciudadano** (implícito): solo lectura del portal público.
- **Catálogo de roles:** colección del backend, `GET /api/rols` (`core/services/rol.service.ts:11`), usada para poblar el `<select>` de alta de usuario (`components/dialog-new-user.ts:33`). No es un enum del FE; el FE solo conoce los **nombres** `Administrador`/`Responsable` por `environment`.

### 2. Cómo gatea la UI
No hay un mapa `rol → permisos`; se **compara directamente `session().rol.name`** contra `environment.ROL_ADMIN` / `ROL_RESPONSIBLE`. Puntos de control:
- **Guard de ruta** `core/auth/auth.guard.ts:27` → entra a `/admin` si `name === ROL_ADMIN || name === ROL_RESPONSIBLE`; si no, `createUrlTree(['/user'])`.
- **Redirección de login** `features/login/login.ts:104-106` (misma regla).
- **Acciones solo-Administrador** (`computed isAdmin = name === ROL_ADMIN`):
  - Calificar/eliminar evidencia (`components/history.ts:104-105`, columnas "Revisar"/"Eliminar" bajo `@if(isAdmin())`).
  - Eliminar subindicador (`pages/specific-subindicators-table.ts:91-92`).
  - Menú **Workspace** (Usuarios + Configuración) (`shared/admin-sidebar/admin-sidebar.ts:116-117`).
- **Acciones Administrador + Responsable** (`computed canCreate`): botón "Nuevo subindicador" (`pages/specific-subindicators-table.ts:94-97`).
- **Sin gate de rol** (cualquiera dentro de `/admin`, es decir Admin o Responsable): botón "Agregar evidencias" (`pages/subindicator-general.ts:43`).

### 3. Matriz de permisos REAL (hoy)

| Acción | Administrador | Responsable | Ciudadano |
|---|:--:|:--:|:--:|
| Entrar a `/admin` | ✅ | ✅ | ❌ → `/user` |
| Crear/editar **indicadores** del catálogo + **instancias** por período | ❌ *(no hay UI)* | ❌ | ❌ |
| Crear/editar **características** y su **rúbrica/valuations** | ❌ *(no hay UI; solo lectura)* | ❌ | ❌ |
| Crear **subindicador** | ✅ | ✅ | ❌ |
| **Subir** evidencia | ✅ | ✅ | ❌ |
| **Calificar** evidencia (`qualify`, criterios) | ✅ | ❌ | ❌ |
| **Verificar/publicar** (`verified`) | ✅ | ❌ | ❌ |
| Borrar evidencia / subindicador | ✅ | ❌ | ❌ |
| Configurar GAD (`publishAuto`, `reportDefault`) | ✅ | ❌ | ❌ |
| Gestionar usuarios (alta/roles) | ✅ | ❌ | ❌ |
| Ver portal público + evidencias verificadas | ✅ | ✅ | ✅ |

> **Importante:** **no hay UI en el FE para crear/editar indicadores del catálogo, instancias por período, ni características/rúbrica.** Eso se siembra/gestiona en el backend. El FE solo **lee** ese catálogo (`characteristics.service.ts` solo tiene GETs; `typeID` cableados en `admin-home.routes.ts`).

### 4. Token y resolución de rol
El JWT se decodifica con `jwt-decode` (`core/auth/auth.service.ts`). Pero los permisos se deciden por el **nombre** del rol tomado del **objeto `user.rol` (poblado) que devuelve el login/usuario** —`(session().rol as RolID).name`— **no** del id del JWT. Es decir, el FE espera que el backend entregue `rol` poblado con `name`. El JWT lleva el id; el FE usa el name del objeto de sesión.

### 5. Multi-tenant
El `tenant` (header, `environment.TENATID`) define el workspace y **se envía siempre** (`auth-token.interceptor.ts:10`). Sin embargo, **el rol se trata como global**: el FE lee un único `session().rol.name` y no lo resuelve por GAD. Hoy **no** hay soporte para "Administrador en un GAD y Responsable en otro"; un usuario tiene un rol. Si el rediseño quiere rol por workspace, es **cambio nuevo** (el FE tendría que resolver rol según `tenant`).

### 6. Segregación de funciones (clave para la tesis)
**Ya existe una segregación parcial por rol:** un **Responsable** sube evidencia pero **no** puede calificarla ni publicarla (el botón "Revisar" está bajo `isAdmin`), así que en la práctica **quien sube (Responsable) ≠ quien califica/publica (Administrador)**.
**PERO no hay enforcement a nivel de dato:** un **Administrador** puede subir una evidencia y luego calificarla él mismo; la UI **no** obliga a que `author ≠ qualificationBy`. La separación es **por rol**, no por identidad. Si la tesis requiere segregación dura (quien sube ≠ quien califica ≠ quien publica), hay que **implementarla** (hoy no está).

### 7. `subindicator.responsible`
Es **texto libre** (`models/subindicators.ts:17`). Se captura en el alta de subindicador como un `<textarea>` "Responsable(s)" (`pages/add-subindicator.ts:76-77,222`) y se guarda. **La UI no filtra, no asigna permisos ni enlaza a un usuario por él**; es solo informativo (incluso admite varios nombres en el mismo texto). **Recomendación:** convertirlo en **relación a usuario(s)** si se quiere asignar trabajo/filtrar por responsable.

### 8. ¿Faltan roles?
Perfiles **que ya existen** en el FE: *Administrador* (todo) y *Responsable* (cargador/creador del GAD) y *Ciudadano* (lectura). Perfiles **fusionados hoy en Administrador**: *evaluador/calificador*, *publicador*, *configurador*. Perfil **inexistente**: *metodólogo/configurador de rúbrica y pesos* (no hay UI para editar criterios/pesos). → Para el rediseño tiene sentido separar **cargador (ya = Responsable)**, **evaluador**, **publicador** y **metodólogo**.

---

## B. Agrupación de evidencias (varias por característica)

### 9. Cómo lo modela la UI hoy
**Varias `Evidence` separadas, cada una con su único `link`.** En `shared/input-evidence/input-evidence1.ts` cada "entrada" produce una `Evidence`; el botón "Añadir otra evidencia" (visible si `!characteristic.unique`) agrega más entradas; al guardar, `components/finish-evidence.ts:119-134` hace `concatMap → addEvidence` **una por una**. El modelo tiene **un solo `link` por evidencia** (`models/evidence.ts:11`, `link: string | File`). **No** existe "una evidencia con varios adjuntos".

### 10. ¿Principal vs complementaria? ¿Jerarquía?
**No.** Todas las evidencias de una característica se tratan **igual**, como lista plana, sin orden ni jerarquía (se muestran así en `general-user/components/section-evidence.ts` y en `history.ts`). No hay campo de "principal" ni de prioridad.

### 11. POA / documento global
**No hay reutilización/referencia entre características.** Cada archivo se **re-sube** por característica a una ruta de storage por subindicador (`finish-evidence.ts:117` `basePath`). **No** existe forma de indicar "página/sección" del documento. Lo más parecido a un documento global es la **portada** del subindicador (`requireCover`/`cover`, único por subindicador), pero **no** se referencia desde varias características.

### 12. ¿Calificación por evidencia o por característica?
**Hoy es por evidencia.** El diálogo de revisión se abre **para UNA evidencia** (`components/history.ts:143 review(evidence,...)` → `dialog-check-evidence.ts`). Si una característica tiene 3 evidencias, el evaluador marca los criterios **una vez por cada evidencia** (3 veces). **Opinión del FE:** lo correcto según ISO 18091 sería **por característica** (los criterios/valuations pertenecen a la característica, no a cada archivo); pasar la rúbrica a nivel característica evitaría duplicación y notas contradictorias entre evidencias de la misma característica.

### 13. Decisión de nota con varias evidencias
Hoy **cada evidencia se evalúa por separado** (una rúbrica por evidencia); el FE **no** tiene lógica de "unión" entre evidencias. La agregación (promedio/última/mejor/unión) la hace el **backend**. Si se adopta rúbrica **por característica** (Q12), la pregunta de unión desaparece: el evaluador marcaría el criterio si **alguna** evidencia lo cumple, mirando todas juntas.

### B-bis. Caso real que motiva el rediseño (aclaración del equipo del GAD)

En la práctica, las evidencias de **una misma característica** son **heterogéneas en alcance y en rol**, no equivalentes. Ejemplo observado en el subindicador **Diagnóstico**:

- **Documento marco / global — POA (Plan Operativo Anual):** un documento **muy general** que **engloba muchos proyectos** y respalda a **varias** características/subindicadores a la vez. Hoy se **re-sube** en cada característica (no se reutiliza) → duplica archivos y rompe la trazabilidad.
- **Informe específico:** el documento que respalda **puntualmente** esa característica → sería la evidencia **principal**.
- **Fotos / anexos:** se suben **por separado** como respaldo del informe → evidencias **complementarias**.

→ El modelo plano actual (N `Evidence` iguales con un solo `link`) **no captura** ni la diferencia de **alcance** (global vs específico) ni la de **rol** (principal vs complementaria). Esto es lo que origina las preguntas 9–13.

**Modelo recomendado para v2:**

1. **Biblioteca de documentos fuente** a nivel **GAD/período** (alcance amplio, **confirmado**): el POA (y similares) se **sube UNA sola vez** como "fuente" y se **referencia desde múltiples características y subindicadores distintos** — en la práctica el mismo POA respalda **varios subindicadores**. Evita re-subidas y da trazabilidad ("este POA respalda estas N características de M subindicadores").
2. **Evidencia por característica con rol explícito:** `tipo: principal | complementaria`, y un `fuenteId` cuando la evidencia **referencia** un documento de la biblioteca en lugar de subir archivo propio. *Informe específico = principal; fotos/anexos = complementarias; POA = referencia a fuente global.*
3. **Rúbrica POR característica** (no por archivo): el evaluador valora **el conjunto** (POA + informe + fotos) y marca los criterios **una sola vez** → resuelve de raíz la agregación (Q12/Q13).
4. **Verificación/publicación:** decidir si es por característica o por evidencia, recordando que el portal ciudadano **solo muestra evidencias `verified`** (`section-evidence.ts`). Si el POA es global, su verificación debería **propagarse** a las características que lo referencian (o verificarse a nivel fuente).
5. **Referencia por páginas, SIN recortar el PDF (el punto a mejorar):** en el pasado se intentó que el usuario **extrajera solo la(s) página(s)** del subindicador y **no se pudo** (fricción + errores). Propuesta: la **referencia** a la fuente lleva un **rango de páginas** (p. ej. `pages: "12-15"`) y es **el visor** quien abre/muestra ese rango; el usuario **no corta nada**, solo indica las páginas. *Viabilidad técnica:* hoy `shared/view-pdf/view-pdf.ts` usa un **`<iframe>`** → basta `…/poa.pdf#page=12` para **saltar a la página** de inmediato; para una vista **acotada/enriquecida** ya está instalado **`ngx-extended-pdf-viewer`** (en `package.json`), que permite abrir en una página concreta y controlar la navegación. → **Escala la recolección** (subir el POA una vez y referenciar páginas en cada subindicador) y **mejora la verificabilidad** (el ciudadano salta directo a la evidencia).

Esto encaja con ISO 18091: el POA es un **instrumento de planificación** que respalda el **Diagnóstico** y a varios indicadores; **modelar la fuente como entidad reutilizable con referencia por páginas** (no copias recortadas por característica) es lo correcto y reduce drásticamente la carga de quien recolecta evidencia.

---

## C. Rúbrica, pesos y posible rol nuevo

### 14. Pesos por criterio
Hoy **no hay UI de pesos**; `Valuation.maxValue` solo se usa como flag `===1` para mostrar el checkbox (`dialog-check-evidence.ts:109`). Como **no existe rol metodólogo**, hoy cualquier configuración recaería en **Administrador**. **Recomendación:** crear un rol **"metodólogo/configurador de rúbrica"** que defina criterios y **pesos**, separado del Administrador operativo.

### 15. Alcance de la rúbrica (global vs por GAD)
**Global.** Los criterios/valuations vienen del catálogo de `type`/`characteristic` (los `typeID` están **cableados** en `admin-home.routes.ts`), y `characteristics.service.ts` **solo tiene GETs** (sin crear/editar). → La UI **no** permite editar criterios por GAD; son los del estándar, iguales para todos. Si se quiere **personalización por GAD**, es funcionalidad nueva.

### 16. Criterios críticos (`tier`)
Confirmado: **el FE no usa `tier`** en ningún cálculo. Solo aparece **cableado a `tier: 1`** al crear características de un subindicador (`pages/add-subindicator.ts:33`) y en el modelo (`models/characteristic.ts:14`). **No hay UI para marcar un criterio como crítico.** → El FE está de acuerdo con que el **backend** trate `tier>1` como crítico (si falta, el subindicador no pasa de rojo), pero **hoy nadie lo marca desde la UI**: habría que añadir esa edición (atada al rol metodólogo del Q14).

---

## Resumen para las decisiones del backend
1. **3 roles ya existen** (Administrador, Responsable, Ciudadano) con **segregación parcial**: Responsable sube/crea, Administrador califica/publica/configura. **No** hay enforcement `author ≠ qualificationBy` (solo separación por rol).
2. **El FE no crea catálogo** (indicadores/instancias/características/rúbrica): todo eso es backend; la rúbrica es **global**, no por GAD.
3. **Evidencias:** hoy N `Evidence` planas (1 link c/u). El **caso real** (POA global + informe específico + fotos en el subindicador Diagnóstico, ver §B-bis) exige un modelo nuevo: **biblioteca de documentos fuente reutilizables** de alcance **GAD/período** (un POA sirve a **varios subindicadores**) + **referencia por rango de páginas** (para **no** obligar a recortar el PDF) + **rol `principal`/`complementaria`** por evidencia.
4. **Rúbrica hoy por evidencia**; el FE recomienda moverla a **por característica** (más fiel a ISO 18091) → valora el conjunto (POA+informe+fotos) y simplifica la agregación.
5. **Pesos y críticos (`tier`)**: no hay UI; conviene un **rol metodólogo** que gestione criterios, pesos y marca de críticos.
6. **`responsible`** es texto libre informativo → debería ser **relación a usuario** si se quiere asignar/segregar trabajo.
7. **Rol por workspace/tenant**: hoy el rol es **global**; soportar rol por GAD es cambio nuevo en el FE.
