const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const usersSchema = new mongoose.Schema({
  name:{
    type:String,
    required:true
  },
  mail:{
    type:String,
    required:true,
    unique:true
  },
  image:{
    type:String,
    required:false
  },
  password:{
    type:String,
    required:true,
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
  },
  gadID:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Gad',
    required:true
  }
})

usersSchema.plugin(uniqueValidator)

usersSchema.set('toJSON',{
  transform:(doc,returnObj) => {
    if(returnObj._id){
      returnObj.id = returnObj._id.toString()
      delete returnObj._id
      delete returnObj.__v
      delete returnObj.password
    }
  }
})

module.exports = mongoose.model('User',usersSchema)