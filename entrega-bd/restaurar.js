/**
 * RESTAURAR BD DE BALDURWATCH
 * Crea las colecciones, sus índices y carga los datos exportados en el servidor indicado.
 * Lo único que hay que cambiar es la URI del servidor de destino.
 *
 * Uso (desde la carpeta Backend/, tras `npm install`):
 *   node entrega-bd/restaurar.js "mongodb://usuario:clave@servidor:27017/baldurwatch"
 *   MONGODB_URI_DESTINO="mongodb+srv://..." node entrega-bd/restaurar.js
 *
 * Opciones:
 *   --solo-estructura   crea colecciones e índices, sin cargar datos
 *   --reemplazar        borra cada colección de destino antes de cargarla
 *   --db <nombre>       nombre de la BD si la URI no lo incluye
 *                       (por defecto, el de la BD de origen)
 */

const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose')

const { EJSON } = mongoose.mongo.BSON

const DIR_ESTRUCTURA = path.join(__dirname, 'estructura')
const DIR_DATOS = path.join(__dirname, 'datos')
const LOTE = 1000

function leerArgs() {
  const args = process.argv.slice(2)
  const flag = name => args.includes(name)
  const iDb = args.indexOf('--db')
  const dbFlag = iDb >= 0 ? args[iDb + 1] : undefined
  const uri = args.find((a, i) => !a.startsWith('--') && (iDb < 0 || i !== iDb + 1)) ||
    process.env.MONGODB_URI_DESTINO
  return { uri, dbFlag, soloEstructura: flag('--solo-estructura'), reemplazar: flag('--reemplazar') }
}

// Nombre de BD incluido en la URI (lo que va entre el host y '?'), si lo hay.
function dbDeUri(uri) {
  const m = uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/)
  return m && m[1] ? decodeURIComponent(m[1]) : undefined
}

const ocultarClave = uri => uri.replace(/\/\/([^:/@]+):([^@]+)@/, '//$1:***@')

function leerEJSON(archivo) {
  return EJSON.parse(fs.readFileSync(archivo, 'utf8'), { relaxed: false })
}

async function main() {
  const { uri, dbFlag, soloEstructura, reemplazar } = leerArgs()
  if (!uri) {
    console.error('Falta la URI del servidor de destino.')
    console.error('Uso: node entrega-bd/restaurar.js "mongodb://usuario:clave@servidor:27017/baldurwatch"')
    process.exit(1)
  }

  const { database: dbOrigen, collections } = leerEJSON(path.join(DIR_ESTRUCTURA, 'colecciones.json'))
  const manifest = soloEstructura
    ? null
    : JSON.parse(fs.readFileSync(path.join(DIR_DATOS, 'manifest.json'), 'utf8'))

  const dbName = dbFlag || dbDeUri(uri) || dbOrigen
  if (!dbFlag && !dbDeUri(uri)) {
    console.warn(`AVISO: la URI no indica nombre de BD; se usará "${dbName}" (la de origen).`)
    console.warn('       El MONGODB_URI del backend debe apuntar a esa misma BD.\n')
  }

  console.log(`Servidor destino : ${ocultarClave(uri)}`)
  console.log(`Base de datos    : ${dbName}`)
  console.log(`Modo             : ${soloEstructura ? 'solo estructura' : 'estructura + datos'}${reemplazar ? ' (reemplazar)' : ''}`)
  if (manifest) console.log(`Export de origen : ${manifest.exportDate}`)

  await mongoose.connect(uri, { dbName })
  const db = mongoose.connection.db
  console.log('Conectado.\n')

  const existentes = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(c => c.name))

  // Sin --reemplazar no se toca nada si alguna colección de destino ya tiene datos.
  if (!reemplazar) {
    const ocupadas = []
    for (const { name } of collections) {
      if (existentes.has(name) && (await db.collection(name).estimatedDocumentCount()) > 0) ocupadas.push(name)
    }
    if (ocupadas.length) {
      throw new Error(`La BD destino ya tiene datos en: ${ocupadas.join(', ')}. ` +
        'Usa una BD vacía o vuelve a ejecutar con --reemplazar.')
    }
  }

  // 1) Colecciones + índices
  console.log('Estructura:')
  for (const { name, options, indexes } of collections) {
    if (existentes.has(name) && reemplazar) {
      await db.collection(name).drop()
      existentes.delete(name)
    }
    if (!existentes.has(name)) await db.createCollection(name, options)

    const especificaciones = indexes
      .filter(ix => ix.name !== '_id_')
      .map(({ v, ns, ...ix }) => ix)
    if (especificaciones.length) await db.collection(name).createIndexes(especificaciones)
    console.log(`  ${name.padEnd(32)} ${especificaciones.length} índices`)
  }

  if (soloEstructura) {
    console.log('\nEstructura creada (sin datos).')
    return mongoose.disconnect()
  }

  // 2) Datos
  console.log('\nDatos:')
  const diferencias = []
  for (const { name } of collections) {
    const archivo = path.join(DIR_DATOS, `${name}.json`)
    const docs = fs.existsSync(archivo) ? leerEJSON(archivo) : []
    for (let i = 0; i < docs.length; i += LOTE) {
      await db.collection(name).insertMany(docs.slice(i, i + LOTE), { ordered: true })
    }
    const esperado = manifest.collections[name] ?? 0
    const real = await db.collection(name).countDocuments()
    const ok = real === esperado
    if (!ok) diferencias.push(`${name}: esperado ${esperado}, cargado ${real}`)
    console.log(`  ${name.padEnd(32)} ${String(real).padStart(6)} / ${esperado} ${ok ? 'OK' : 'DIFERENCIA'}`)
  }

  console.log(diferencias.length
    ? `\nRestauración con diferencias:\n  ${diferencias.join('\n  ')}`
    : `\nRestauración completa: ${manifest.totalDocuments} documentos en ${collections.length} colecciones.`)
  await mongoose.disconnect()
  if (diferencias.length) process.exit(2)
}

main().catch(async err => {
  console.error('\nError en la restauración:', err.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
