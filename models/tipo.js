const mongoose = require('mongoose')

const tipo = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  red:{
    type:String,
    required:true
  },
  yellow:{
    type:String,
    required:true
  },
  green:{
    type:String,
    required:true
  },
  qualification:{
    type:Number,
    default:0,
    required:false
  },
})
tipo.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('Type',tipo)