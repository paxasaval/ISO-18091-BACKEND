const mongoose = require('mongoose')

const caracteristicas = new mongoose.Schema({
  typeID:{
    type:String,
    required:true
  },
  name:{
    type:String,
    required:true
  },
  group:{
    type:String,
    required:true
  },
  groupName:{
    type:String,
    required:true
  },
  required:{
    type:Boolean,
    required:true
  },
  tier:{
    type:Number,
    required:true
  },
  unique:{
    type:Boolean,
    required:true
  }
})
caracteristicas.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('Characteristic',caracteristicas)