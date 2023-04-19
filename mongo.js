const fs = require('fs')
const axios = require('axios')

const api = 'http://localhost:3001/api'
const collection = 'indicators'

const file = 'archivo.json'

fs.readFile(file, 'utf8', async (err, data) => {
  if (err) throw err
  const objects = JSON.parse(data)
  // Recorre cada objeto y realiza la petición POST
  for (const obj of objects) {
    try {
      const response = await axios.post(`${api}/${collection}`, obj)
      console.log(response.data)
    } catch (error) {
      console.error(error)
    }
  }
})
