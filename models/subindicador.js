const mongoose = require('mongoose')

const subIndicadorSchema = new mongoose.Schema({
  indicadorID:{
    type:String,
    required:true
  },
  typeID:{
    type:String,
    required:true
  },
  name:{
    type:String,
    required:true
  },
  responsible:{
    type:String,
    required:true
  },
  qualification:{
    type:Number,
    default:0,
    required:false
  }
})
subIndicadorSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('SubIndicator',subIndicadorSchema)