# Entrega de la base de datos — BaldurWatch

La plataforma usa **MongoDB** (base documental, sin tablas ni DDL). La entrega se divide en:

| Parte | Dónde | Qué contiene |
|---|---|---|
| **Estructura** | `estructura/colecciones.json` | Las 38 colecciones con sus opciones e índices (incluidos los únicos). |
| | `estructura/DICCIONARIO-DATOS.md` | Campos, tipos, obligatoriedad, valores permitidos y relaciones de cada colección. |
| **Datos** | `datos/<coleccion>.json` | Documentos en EJSON canónico (conserva tipos `ObjectId`, fechas, etc.). |
| | `datos/manifest.json` | Fecha del export, BD de origen y nº de documentos por colección. |
| **Script** | `restaurar.js` | Crea la estructura y carga los datos en el servidor que se le indique. |

Hay dos familias de colecciones: las `v2_*` (las que usa la API `/api/v2` y el frontend
actual) y las v1 sin prefijo (legacy; fuente de la migración `npm run migrate:v2`). Se
entregan ambas para que el backend funcione completo.

> ⚠️ **Datos personales.** El paquete incluye usuarios (correos y contraseñas cifradas con
> bcrypt) y notificaciones. Trátalo como confidencial.

## Restaurar en un servidor nuevo

**Requisitos:** Node.js ≥ 20 y un servidor MongoDB ≥ 6 (local, Docker o Atlas) con un usuario
con permiso de escritura sobre la BD destino.

1. Copia la carpeta `entrega-bd/` dentro de `Backend/` (si no viene ya) e instala dependencias:
   ```bash
   cd Backend
   npm install
   ```
2. Ejecuta el script cambiando **solo la URI del servidor** (incluye el nombre de la BD al final):
   ```bash
   node entrega-bd/restaurar.js "mongodb://usuario:clave@servidor:27017/baldurwatch"
   ```
   En Atlas: `"mongodb+srv://usuario:clave@cluster.xxxxx.mongodb.net/baldurwatch"`.
   También puede pasarse por variable: `MONGODB_URI_DESTINO="..." node entrega-bd/restaurar.js`.
3. El script termina comparando lo cargado con `manifest.json`:
   `Restauración completa: N documentos en 38 colecciones.` Si hay diferencias las lista y
   sale con código 2.
4. Configura el backend: copia `.env.example` a `.env` y pon en `MONGODB_URI` **la misma URI
   (con el mismo nombre de BD)**. Mantén `ROL_ADMIN_KEY` con el valor entregado: es el `_id`
   del rol administrador y se conserva en la restauración.
5. Arranca y comprueba: `npm run dev` y entra desde el frontend con un usuario existente.

### Opciones del script

| Opción | Efecto |
|---|---|
| `--solo-estructura` | Crea colecciones e índices vacíos (sin datos). |
| `--reemplazar` | Borra cada colección destino antes de cargarla. Sin esta opción, si la BD destino ya tiene datos el script **no toca nada** y se detiene. |
| `--db <nombre>` | Nombre de la BD cuando la URI no lo incluye. Si no se indica ninguno se usa el de origen (`test`) y se avisa. |

## Lo que NO está en la base de datos

- **Archivos de evidencias.** La BD guarda solo enlaces. La mayoría apunta a páginas
  públicas del GAD (`loja.gob.ec`); los subidos desde la plataforma están en
  **Firebase Storage** (`firebasestorage.googleapis.com`), configurado en el frontend.
  Esos enlaces siguen funcionando mientras se mantenga ese proyecto de Firebase; si se migra
  a otro storage habría que copiar los archivos y actualizar las URLs.
- **Secretos** (`.env` del backend, `environment.secrets.ts` del frontend): se entregan
  por un canal aparte o los define quien despliega (ver `.env.example`).
- Las colecciones `v2_improvement_plans` y `v2_rubric_overrides` están en el diccionario
  pero aún no existen en origen (sin datos ni índices propios); MongoDB las crea con el
  primer documento que guarde el backend.

## Regenerar el paquete (lado del equipo de desarrollo)

Desde `Backend/`, con `MONGODB_URI` del `.env` apuntando a la BD de origen:
```bash
node entrega-bd/exportar.js
npx tsx entrega-bd/diccionario.ts
```
`datos/` no se versiona en git (contiene datos reales); se entrega comprimida junto al resto.
