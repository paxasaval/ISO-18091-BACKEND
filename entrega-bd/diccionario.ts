// Genera estructura/DICCIONARIO-DATOS.md a partir de los schemas Mongoose
// (modelos v2 en src/v2/models y legacy v1 en models/).
// Uso (desde Backend/): npx tsx entrega-bd/diccionario.ts
import fs from 'fs'
import path from 'path'
import mongoose, { Schema, SchemaType } from 'mongoose'

const RAIZ = path.join(__dirname, '..')
const CARPETAS = [
  { titulo: 'Colecciones v2 (API /api/v2, usadas por el frontend actual)', dir: 'src/v2/models' },
  { titulo: 'Colecciones v1 (legacy, fuente de la migración v1 → v2)', dir: 'models' }
]

type Opciones = {
  required?: unknown
  default?: unknown
  enum?: unknown
  ref?: string
  unique?: boolean
  type?: unknown
}

const celda = (v: unknown): string =>
  v === undefined || v === '' ? '' : String(v).replace(/\|/g, '\\|').replace(/\n/g, ' ')

function valorDefecto(d: unknown): string {
  if (d === undefined) return ''
  if (typeof d === 'function') return d.name === 'now' ? 'Date.now' : '(función)'
  return JSON.stringify(d)
}

const subschema = (st: SchemaType): Schema | undefined => (st as unknown as { schema?: Schema }).schema

function tipo(st: SchemaType): string {
  const caster = (st as unknown as { caster?: SchemaType }).caster
  if (subschema(st)) return st.instance === 'Array' ? 'Array<Subdocumento>' : 'Subdocumento'
  if (st.instance === 'Array' && caster?.instance) return `Array<${caster.instance}>`
  if (st.instance === 'Array') return 'Array<Mixed>'
  return st.instance
}

// Colección del modelo referenciado (algunos refs legacy usan minúsculas).
function coleccionRef(ref: string, coleccionDeModelo: Map<string, string>): string {
  const nombre = coleccionDeModelo.has(ref)
    ? ref
    : [...coleccionDeModelo.keys()].find(n => n.toLowerCase() === ref.toLowerCase())
  return nombre ? coleccionDeModelo.get(nombre)! : '?'
}

function opcionesDe(st: SchemaType): Opciones {
  const o = st.options as Opciones
  const caster = (st as unknown as { caster?: SchemaType }).caster
  // En arrays de referencias el `ref` vive en el elemento.
  if (!o.ref && Array.isArray(o.type) && o.type[0] && typeof o.type[0] === 'object') {
    return { ...o, ref: (o.type[0] as Opciones).ref }
  }
  if (!o.ref && caster) return { ...o, ref: (caster.options as Opciones).ref }
  return o
}

function filasCampos(schema: Schema, coleccionDeModelo: Map<string, string>, prefijo = ''): string[] {
  const filas: string[] = []
  schema.eachPath((rutaLocal, st) => {
    if (rutaLocal === '__v' || rutaLocal === '_id') return
    const ruta = prefijo + rutaLocal
    const o = opcionesDe(st)
    const enumVals = Array.isArray(o.enum) ? o.enum.join(', ') : ''
    const ref = o.ref ? `${o.ref} (\`${coleccionRef(o.ref, coleccionDeModelo)}\`)` : ''
    filas.push(`| \`${ruta}\` | ${tipo(st)} | ${o.required ? 'sí' : ''} | ${o.unique ? 'sí' : ''} | ` +
      `${celda(valorDefecto(o.default))} | ${celda(enumVals)} | ${celda(ref)} |`)
    const sub = subschema(st)
    if (sub) filas.push(...filasCampos(sub, coleccionDeModelo, `${ruta}${st.instance === 'Array' ? '[]' : ''}.`))
  })
  return filas
}

function tablaCampos(schema: Schema, coleccionDeModelo: Map<string, string>): string {
  return ['| Campo | Tipo | Requerido | Único | Por defecto | Valores permitidos | Referencia |',
    '|---|---|---|---|---|---|---|', ...filasCampos(schema, coleccionDeModelo)].join('\n')
}

function tablaIndices(schema: Schema): string {
  const indices = schema.indexes()
  if (!indices.length) return ''
  return '\n\n**Índices declarados:** ' + indices
    .map(([campos, opts]) => `\`${JSON.stringify(campos)}\`${(opts as { unique?: boolean }).unique ? ' (único)' : ''}`)
    .join(', ')
}

function main(): void {
  const grupos = CARPETAS.map(({ titulo, dir }) => {
    const antes = new Set(mongoose.modelNames())
    for (const f of fs.readdirSync(path.join(RAIZ, dir)).filter(f => f.endsWith('.ts')).sort()) {
      require(path.join(RAIZ, dir, f))
    }
    return { titulo, modelos: mongoose.modelNames().filter(n => !antes.has(n)) }
  })

  const coleccionDeModelo = new Map(mongoose.modelNames().map(n => [n, mongoose.model(n).collection.collectionName]))

  const partes = [
    '# Diccionario de datos — BaldurWatch',
    '',
    'Base de datos **MongoDB** (documental). La estructura la definen los schemas Mongoose del backend;',
    'este documento se genera automáticamente desde ellos (`npx tsx entrega-bd/diccionario.ts`).',
    'Los índices efectivos de la BD están en `colecciones.json`. Todas las colecciones tienen `_id` (ObjectId).',
    ''
  ]

  for (const { titulo, modelos } of grupos) {
    partes.push(`## ${titulo}`, '')
    for (const nombre of modelos.sort((a, b) => coleccionDeModelo.get(a)!.localeCompare(coleccionDeModelo.get(b)!))) {
      const { schema } = mongoose.model(nombre)
      partes.push(`### \`${coleccionDeModelo.get(nombre)}\` — modelo ${nombre}`, '',
        tablaCampos(schema, coleccionDeModelo) + tablaIndices(schema), '')
    }
  }

  const salida = path.join(__dirname, 'estructura', 'DICCIONARIO-DATOS.md')
  fs.mkdirSync(path.dirname(salida), { recursive: true })
  fs.writeFileSync(salida, partes.join('\n'), 'utf8')
  console.log(`Diccionario generado: ${path.relative(process.cwd(), salida)}`)
}

main()
