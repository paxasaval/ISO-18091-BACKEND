const mongoose = require('mongoose')
/* const odsShema = new mongoose.Schema({
  number:Number,
  name:String,
  img:String
}) */

const indicadorSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  description:{
    type:String,
    required:true
  },
  number:{
    type:Number,
    required:true
  },
  quadrant:{
    type:Number,
    required:true
  },
  quadrantName:{
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
  ods:{
    type:[String]
  }
})
indicadorSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('Indicator',indicadorSchema)