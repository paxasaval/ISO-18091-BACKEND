const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../models/users')

loginRouter.post('/',async(req,res) => {
  const body= req.body
  const user = await User.findOne({ mail:body.mail })
  const passwordCorrect = user === null
    ?false
    :await bcrypt.compare(body.password,user.password)

  if(!(user && passwordCorrect)){
    return res.status(401).json({
      error:'invalid mail o password'
    })
  }
  const userForToken = {
    mail: user.mail,
    name:user.name,
    rol: user.rol,
    id:user._id,
  }

  const token = jwt.sign(
    userForToken,
    process.env.SECRET,
    { expiresIn: 60*60 }
  )

  res
    .status(200)
    .send({ token,mail:user.mail,name:user.name,rol:user.rol })
})

module.exports = loginRouter
