const mongoose = require('mongoose')
const odsShema = new mongoose.Schema({
  number:Number,
  name:String,
  img:String
})
odsShema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})
module.exports=mongoose.model('Ods',odsShema)