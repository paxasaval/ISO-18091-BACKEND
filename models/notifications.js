const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    requred: true,
  },
  description:{
    type:String,
    requred:true
  },
  author:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:false
  },
  sendTo:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:false
  },
  gad:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Gad',
    required:false
  },
  date:{
    type:Date,
    requred:true
  },
  open:{
    type:Boolean,
    requred:true
  },
  subindicatorID:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'SubIndicator',
    required:false
  },
})
notificationSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    returnObj.id = returnObj._id.toString()
    delete returnObj._id
    delete returnObj.__v
  }
})

module.exports = mongoose.model('Notification',notificationSchema)
