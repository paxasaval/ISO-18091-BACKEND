const mongoose = require('mongoose')


const usersSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  mail:{
    type:String,
    required:true
  },
  password:{
    type:String,
    required:true
  },
  rol:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Rol',
    required:true
  },
  created:{
    type:Date,
    required:true
  },
  lastUpdate:{
    type:Date,
    required:true
  },
  state:{
    type:Boolean,
    default:true
  }
})
usersSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    if(returnObj._id){
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
    }
  }
})

module.exports = mongoose.model('User',usersSchema)