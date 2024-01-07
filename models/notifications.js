const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  type: {
    type: Number,
    requred: true,
  },
  from:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:false
  },
  sendTo:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:false
  },
  content:{
    type:String,
    requred:true
  },
  itemType:{
    type:Number,
    requred:true
  },
  itemID:{
    type:String,
    required:false
  },
  date:{
    type:Date,
    requred:true
  },
  state:{
    type:Number,
    required:true
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
