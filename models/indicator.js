const mongoose = require('mongoose')

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
  ods:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Ods'
  }]
})
indicadorSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    const id = returnObj._id.toString()
    //console.log(id)
    returnObj.id = id
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('Indicator',indicadorSchema)