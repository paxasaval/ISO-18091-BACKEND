const mongoose = require('mongoose')

const URI1 = 'mongodb+srv://paxasaval:TUgz39UKhi1oYB59@cluster0.ybxv9oy.mongodb.net/ISO18091?retryWrites=true&w=majority'
const URI2 = 'mongodb+srv://paxasaval:FiaMU59vXLU9iukm@cluster0.kqzljds.mongodb.net/test'

const Gad = require('./models/gad')
const IndicatorInstance = require('./models/indicatorInstance')
const Indicator = require('./models/indicator')
require('./models/subindicator')

function getReason(qualification, count1, count2, count3, numberEvaluated, totalSubs) {
  if (count1 > 0) return 'Hay al menos 1 subindicador en rojo (1), lo que pone todo el indicador en rojo.'
  if (count2 > 0 && numberEvaluated > totalSubs / 2) return 'Hay al menos 1 subindicador amarillo (2) y más de la mitad de subindicadores han sido evaluados → amarillo.'
  if (count3 === totalSubs && count3 > 4) return 'Todos los subindicadores están en verde (3) y hay más de 4 → verde.'
  if (count3 > totalSubs / 2) return 'Más de la mitad de subindicadores están en verde (3) → amarillo.'
  if (numberEvaluated > 0) return 'Hay subindicadores evaluados pero no cumplen condiciones para niveles superiores → rojo.'
  return 'Ningún subindicador ha sido evaluado → gris (0).'
}

async function main() {
  let uri = URI1
  try {
    await mongoose.connect(uri)
    console.log('Conectado a la primera URI')
  } catch {
    uri = URI2
    try {
      await mongoose.connect(uri)
      console.log('Conectado a la segunda URI')
    } catch (err) {
      console.error('No se pudo conectar a ninguna URI:', err.message)
      process.exit(1)
    }
  }

  const db = mongoose.connection.db
  console.log('Base de datos:', db.databaseName)

  // 1. Find GAD "Loja"
  const gads = await Gad.find({ name: /Loja/i })
  if (gads.length === 0) {
    console.error('No se encontró ningún GAD con "Loja" en el nombre')
    process.exit(1)
  }
  const gad = gads[0]
  console.log(`\nGAD encontrado: ${gad.name} (id: ${gad.id})`)

  // 2. Find all IndicatorInstances for this GAD and year 2023
  const instances = await IndicatorInstance.find({ gadID: gad._id, year: '2023' })
    .populate('subindicators')
  console.log(`\nIndicatorInstances encontrados para 2023: ${instances.length}`)

  // 3. Group by quadrant
  const byQuadrant = { 1: [], 2: [], 3: [], 4: [] }

  for (const inst of instances) {
    const indicator = await Indicator.findById(inst.indicatorID)
    if (!indicator) continue

    const subindicators = inst.subindicators || []
    const totalSubs = subindicators.length
    let count0 = 0, count1 = 0, count2 = 0, count3 = 0
    subindicators.forEach(s => {
      if (s.qualification === 0) count0++
      else if (s.qualification === 1) count1++
      else if (s.qualification === 2) count2++
      else if (s.qualification === 3) count3++
    })
    const numberEvaluated = count1 + count2 + count3
    const reason = getReason(inst.qualification, count1, count2, count3, numberEvaluated, totalSubs)

    const colorMap = { 0: 'Gris (0)', 1: 'Rojo (1)', 2: 'Amarillo (2)', 3: 'Verde (3)' }

    byQuadrant[indicator.quadrant].push({
      indicatorNumber: indicator.number,
      indicatorName: indicator.name,
      indicatorId: indicator.id,
      instanceId: inst.id,
      qualification: inst.qualification,
      qualificationLabel: colorMap[inst.qualification] || 'Desconocido',
      subindicators: {
        total: totalSubs,
        gray: count0,
        red: count1,
        yellow: count2,
        green: count3,
        evaluated: numberEvaluated
      },
      reason
    })
  }

  // 4. Print results organized by quadrant
  console.log('\n==============================================================')
  console.log('ESTADO DE CALIFICACIÓN - GAD DE LOJA - 2023')
  console.log('==============================================================\n')

  for (let q = 1; q <= 4; q++) {
    const items = byQuadrant[q]
    const quadrantName = items.length > 0 ? items[0].quadrantName : ''

    console.log(`════════════════════════════════════════════════════════════`)
    console.log(`CUADRANTE ${q}${quadrantName ? ` - ${quadrantName}` : ''}`)
    console.log(`Total indicadores: ${items.length}`)
    console.log(`════════════════════════════════════════════════════════════\n`)

    items.sort((a, b) => a.indicatorNumber - b.indicatorNumber)

    for (const item of items) {
      console.log(`  Indicador ${q}.${item.indicatorNumber}: ${item.indicatorName}`)
      console.log(`  ID Instancia: ${item.instanceId}`)
      console.log(`  Calificación actual: ${item.qualificationLabel}`)
      console.log(`  Subindicadores: ${item.subindicators.total} total` +
        ` | Gris: ${item.subindicators.gray}` +
        ` | Rojo: ${item.subindicators.red}` +
        ` | Amarillo: ${item.subindicators.yellow}` +
        ` | Verde: ${item.subindicators.green}`)
      console.log(`  Razón: ${item.reason}`)
      console.log('')
    }
  }

  // 5. Also print a JSON summary
  console.log('\n==============================================================')
  console.log('RESUMEN JSON')
  console.log('==============================================================\n')

  const result = {}
  for (let q = 1; q <= 4; q++) {
    result[`quadrant_${q}`] = {
      indicators: byQuadrant[q].sort((a, b) => a.indicatorNumber - b.indicatorNumber).map(item => ({
        indicator: `${q}.${item.indicatorNumber}`,
        name: item.indicatorName,
        qualification: item.qualification,
        qualificationLabel: item.qualificationLabel,
        subindicators: item.subindicators,
        reason: item.reason
      }))
    }
    result[`quadrant_${q}`].total = byQuadrant[q].length
  }
  console.log(JSON.stringify(result, null, 2))

  await mongoose.disconnect()
}

main().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
