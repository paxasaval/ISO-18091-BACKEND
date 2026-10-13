/**
 * EXPORTAR BD PARA ENTREGA
 * Genera el paquete de la base de datos a partir de MONGODB_URI (.env del backend):
 *   estructura/colecciones.json  -> colecciones, opciones e índices
 *   datos/<coleccion>.json       -> documentos en EJSON canónico (preserva ObjectId, Date...)
 *   datos/manifest.json          -> fecha, BD de origen y conteo por colección
 *
 * Uso (desde la carpeta Backend/):
 *   node entrega-bd/exportar.js
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })
const mongoose = require('mongoose')
const fs = require('fs')

const { EJSON } = mongoose.mongo.BSON

const DIR_ESTRUCTURA = path.join(__dirname, 'estructura')
const DIR_DATOS = path.join(__dirname, 'datos')

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('Falta MONGODB_URI en el .env del backend')

  console.log('Conectando a la BD de origen...')
  await mongoose.connect(uri)
  const db = mongoose.connection.db
  console.log(`Conectado. BD: ${db.databaseName}\n`)

  fs.mkdirSync(DIR_ESTRUCTURA, { recursive: true })
  fs.rmSync(DIR_DATOS, { recursive: true, force: true })
  fs.mkdirSync(DIR_DATOS, { recursive: true })

  const colecciones = (await db.listCollections({ type: 'collection' }).toArray())
    .filter(c => !c.name.startsWith('system.'))
    .sort((a, b) => a.name.localeCompare(b.name))

  const estructura = []
  const conteos = {}
  let total = 0

  for (const { name, options } of colecciones) {
    const col = db.collection(name)
    const indices = await col.indexes()
    estructura.push({ name, options: options || {}, indexes: indices })

    const docs = await col.find({}).toArray()
    fs.writeFileSync(
      path.join(DIR_DATOS, `${name}.json`),
      EJSON.stringify(docs, null, 1, { relaxed: false }),
      'utf8'
    )
    conteos[name] = docs.length
    total += docs.length
    console.log(`  ${name.padEnd(32)} ${String(docs.length).padStart(6)} docs  ${indices.length} índices`)
  }

  fs.writeFileSync(
    path.join(DIR_ESTRUCTURA, 'colecciones.json'),
    EJSON.stringify({ database: db.databaseName, collections: estructura }, null, 2, { relaxed: false }),
    'utf8'
  )
  fs.writeFileSync(
    path.join(DIR_DATOS, 'manifest.json'),
    JSON.stringify({
      exportDate: new Date().toISOString(),
      sourceDatabase: db.databaseName,
      totalDocuments: total,
      collections: conteos
    }, null, 2),
    'utf8'
  )

  console.log(`\nColecciones: ${colecciones.length} | Documentos: ${total}`)
  console.log(`Estructura: ${path.relative(process.cwd(), DIR_ESTRUCTURA)}`)
  console.log(`Datos:      ${path.relative(process.cwd(), DIR_DATOS)}`)
  await mongoose.disconnect()
}

main().catch(async err => {
  console.error('\nError en la exportación:', err.message)
  await mongoose.disconnect().catch(() => {})
  process.exit(1)
})
