const mongoose = require('mongoose')

const periodSchema = new mongoose.Schema({
  year:{
    type:String,
    required:true
  },
  gad:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'gad',
    required:true
  },
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'user',
    required:true
  }
})
periodSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})
module.exports = mongoose.model('Period',periodSchema)
