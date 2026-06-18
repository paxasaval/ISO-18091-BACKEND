# Cosas hardcodeadas en el Frontend que deberían venir del Backend

> Auditoría del FE pensando en el rediseño `/api/v2`. Lista de valores/reglas de
> **flujo y negocio** que hoy están "cableados" en el cliente y deberían ser
> **datos o configuración del backend** (ids, orden/prioridades, escalas, formatos,
> permisos…). Anclado a archivo:línea. Prioridad: **P0** rompe al re-sembrar/multi-
> tenant · **P1** configuración de workflow · **P2** mejoras/limpieza.

---

## P0 — Acoplamientos que rompen al cambiar de BD / GAD

### 1. IDs de tipo (ObjectId) cableados en las rutas
`features/admin-home/admin-home.routes.ts:72-75`:
```ts
typeRoute('Instancia-responsable', '648fd82bf2888184112b98bf'),
typeRoute('Diagnóstico',           '648fd82cf2888184112b98c1'),
typeRoute('Mecanismo,-Normativa y Reglamentación', '648fd82cf2888184112b98c3'),
typeRoute('Mecanismos',            '648fd82cf2888184112b98c5'),
```
Los 4 subindicadores **generales** dependen de **ObjectIds concretos**. Si se re-siembra la BD u otro GAD tiene otros ids, la navegación general se rompe.
→ **Backend:** exponer el catálogo de tipos generales (mandatory) y que el FE arme estas rutas dinámicamente desde ahí (no ids en código).

### 2. Acoplamiento nombre ↔ ruta (`name.replace(' ','-')`)
La ruta debe **coincidir con el nombre** del tipo: `navbar-indicators.ts:58` y `notifications-list.ts:149` generan el path con `t.name.replace(' ', '-')`.
- ⚠️ **Bug latente:** `String.replace(' ', '-')` reemplaza **solo el primer espacio**. Por eso el path del tercero está escrito a mano como `'Mecanismo,-Normativa y Reglamentación'` (con espacios sin reemplazar) para "calzar" con el bug. Renombrar un tipo, un acento o un espacio extra **rompe el ruteo**.
→ **Backend:** dar un **`slug`/`id` estable** por tipo para rutas; el `name` solo para mostrar.

### 3. Roles por **nombre** y matriz de permisos en el cliente
`environment.ts` define `ROL_ADMIN:'Administrador'`, `ROL_RESPONSIBLE:'Responsable'`; los permisos se deciden comparando `session().rol.name === '...'` en varios componentes (`auth.guard.ts:27`, `history.ts:104`, `specific-subindicators-table.ts:91-97`, `admin-sidebar.ts:117`, `login.ts:104`).
Renombrar un rol en la BD rompe permisos; el **mapa rol→acción** vive en el FE.
→ **Backend:** definir roles con **capacidades/permisos** (o al menos un `code` estable) y que el FE gatee por permiso, no por nombre. (Ver `RESPUESTAS-FRONTEND-ROLES-Y-EVIDENCIAS.md`.)

### 4. Tenant único en build-time
`environment.ts: TENATID: '64616f718e118fb22d4059e3'` — el `tenant` (que viaja en cada request) es **constante de compilación**. Multi-tenant real no es posible sin recompilar.
→ **Backend/infra:** resolver el tenant por subdominio/login/selección, no por constante.

---

## P1 — Configuración de workflow (orden, escalas, formatos)

### 5. Orden / prioridad de secciones e ítems  ⟵ *lo que preguntabas*
- **Tipos/pestañas generales:** el orden sale del **orden en que el backend devuelve** `getTypeByMandatory(true)`, con `Resumen` forzado primero y `Subindicadores-Especificos` al final, cableados en `navbar-indicators.ts`. **No hay campo `order`/`priority`** en `Type`.
- **Cuadrantes:** `[1,2,3,4]` cableado en `home.ts:24-27`, `footer.ts:53`, `nav-bar.ts:43`; geometría/orientación del semáforo por cuadrante en `semaphore.ts:32` (`GEOMETRY` con claves '1'..'4'). El número y orden de cuadrantes es fijo en el FE.
- **Características y criterios:** su orden = orden del array que manda el backend; **sin `order` explícito**.
→ **Backend:** añadir **`order`/`priority`** a `Type`, `Characteristic` y `Valuation` (y, si se quiere flexibilidad, a cuadrantes), para que el FE no imponga el orden ni dependa del orden de respuesta.

### 6. Escala del semáforo, etiquetas y colores (0–3) cableados
La escala `0=gris/no evaluado, 1=rojo/Inaceptable, 2=amarillo/Debajo, 3=verde/Aceptable` y sus **colores hex** y **etiquetas** están repetidos en el FE: `semaphore.ts` (COLORS + leyenda), `ui/semaphore-badge.ts` (STATES/labels), `general-user/components/summary.ts:99-103`, `home.ts:275`, `indicator-summary.ts` (`alertType`).
Además, los **umbrales `red/yellow/green` existen en `Type` y en `Indicator`** (`models/type.ts:5-7`, `models/indicator.ts`) pero el **FE los ignora**.
→ **Backend:** definir **una sola fuente** de la escala (niveles, etiquetas, colores y umbrales) y, si aplica, devolver el color ya resuelto. Evita 5 copias desincronizables.

### 7. Modo de entrada de evidencia por "magic number"
`shared/input-evidence/input-evidence1.ts:164`: `initialMode = characteristic().type === 2 ? 'link' : 'file'`. El número **2** decide si la característica espera enlace o archivo.
→ **Backend:** un campo explícito en `Characteristic` (p. ej. `inputKind: 'file' | 'link'`), no un `type` mágico.

### 8. Formatos permitidos ignorados (se asume PDF)
`Characteristic.allowed_formats` existe en el modelo (`characteristic.ts:16`) pero la zona de carga **fuerza PDF**: `accept="application/pdf,.pdf"` y `file.type==='application/pdf'` (`input-evidence1.ts:107` y `onDrop`). El `PORTADA` también cablea `allowed_formats:['.pdf']`.
→ **FE/Backend:** que el dropzone respete `characteristic.allowed_formats` (ya viene en el modelo) en vez de PDF fijo.

### 9. "Portada" como pseudo-característica inventada en el FE
`add-subindicator.ts:26-36`: objeto `PORTADA` hardcodeado (`id:'portada'`, `name`, `tier:1`, `unique:true`, `allowed_formats:['.pdf']`). No existe en el backend; es un artificio del cliente.
→ **Backend:** modelar la portada como característica/flag real (o config de `requireCover`) con sus formatos, en vez de un objeto fabricado en el FE.

### 10. Regla de cálculo de la nota en el cliente
`dialog-check-evidence.ts`: `qualify = 1 + criterios_marcados`; rúbrica filtra `maxValue===1`. La lógica de scoring vive en el FE (ya detallado en `CONTRATO-FRONTEND-EVIDENCIAS.md` §2).
→ **Backend:** derivar la nota desde la rúbrica; el `maxValue` debería habilitar **pesos** reales, no solo un flag.

---

## P2 — Limpieza / mejoras

### 11. Tamaño de página fijo (sin paginación real)
`specific-subindicators-table.ts:104` e `indicator-summary.ts:107`: `getSubindicatorSpecificByIndicator(instance.id, 0, 10)` → **siempre página 0, tamaño 10**. Si hay más de 10 específicos, no se ven.
→ **FE/Backend:** paginación real (controles de página/tamaño) o `size` configurable.

### 12. Taxonomía de almacenamiento decidida en el FE
`finish-evidence.ts:117` y `add-subindicator.ts:193`: `basePath = \`${gad.name}/${year}/${quadrantName}/${name}/${subindicator.name}\``. El FE arma la ruta del archivo en storage con **nombres** (frágil ante renombrados/acentos).
→ **Backend/Storage:** que el servidor decida la clave de almacenamiento (por ids), no el cliente con nombres.

### 13. Período por defecto = año actual
`wkconfig.ts:125`: al crear reporte, `period: new Date().getFullYear().toString()`. El período debería venir del **período seleccionado** del backend, no de `getFullYear()`.

### 14. Enums de notificación mágicos
`notifications-list.ts:83,87`: `type===1 Indicador, 2 Subindicador, 3 Evidencia`; acción `1 agregado, 2 modificado, 3 eliminado`. Números mágicos mapeados a texto en el FE.
→ **Backend:** entregar `entityType`/`action` como enums con etiqueta, o el texto ya armado.

---

## Resumen para el rediseño
- **Dar ids/slug estables** para tipos y **un catálogo navegable** (mata los ObjectIds y el acoplamiento nombre↔ruta — P0 #1, #2).
- **Roles con permisos/`code`** (no por nombre) y **tenant resoluble** (P0 #3, #4).
- **Campos `order`/`priority`** en tipo/característica/valoración (y cuadrante) para no depender del orden de respuesta (P1 #5).
- **Una sola definición de la escala del semáforo** (niveles/labels/colores/umbrales) servida por el backend (P1 #6).
- **Metadatos de la característica** explícitos: `inputKind` (file/link), `allowed_formats`, portada como entidad real, pesos vía `maxValue` (P1 #7–#10).
- **Paginación real, storage por ids, período del backend, enums con etiqueta** (P2).
