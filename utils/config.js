require('dotenv').config()

const PORT = process.env.PORT
let MONGODB_URI = process.env.MONGODB_URI
let ROL_ADMIN = process.env.ROL_ADMIN_KEY
if(process.env.NODE_ENV === 'test'){
  MONGODB_URI = process.env.TEST_MONGODB_URI
}

module.exports={ MONGODB_URI,PORT,ROL_ADMIN }