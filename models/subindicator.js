const mongoose = require('mongoose')

const subIndicadorSchema = new mongoose.Schema({
  indicadorID:{
    type:String,
    required:true
  },
  typeID:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Type',
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
  },
  created:{
    type:Date,
    required:true
  },
  lastUpdate:{
    type:Date,
    required:true
  },
  createdBy:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true
  },
  commits:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Commit',
    required:false
  }],
  evidences:[{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Evidence',
    required:false
  }]

})
subIndicadorSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('SubIndicator',subIndicadorSchema)