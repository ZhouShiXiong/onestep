const User = require('../models/user')
const jwt = require('jsonwebtoken')

const config = require('../config/config')
const msg = require('./msg')

const generateToken = data => {
  return jwt.sign(data, config.jwtSecret, { expiresIn: config.expiresIn })
}

exports.sendSmsCode = async (req, res) => {
  const { phoneNum } = req.body
  try {
    const user = await User.findOne({ phoneNum })
    if (user) {
      return res.status(400).json({
        errorMsg: '手机号已被使用',
        success: false
      })
    }
    msg.send(req, res)
  } catch (err) {
    console.log('check signup sms code...', err)
  }
}

exports.info = async(req,res) => {
    const {token}=req.query
    console.log('%%%'+token)
    var decoded = jwt.decode(token)
    console.log('#######################')
    console.log(decoded)
    decoded.roles=['admin']
    return res.status(200).json({
      decoded
    })
}

exports.signup = async (req, res) => {
  const { username, password } = req.body
  const phoneNum = username
  const  smsCode = 'aaaa'
  try {
    const all = await User.find()
    console.log('所有用户'+all)
    const name = await User.findOne({ userName:username })
    if (name) {
      return res.status(400).json({
        errorMsg: '该用户已被使用',
        success: false
      })
    }
    // try {
    //   await msg.check(phoneNum, smsCode)
    // } catch (err) {
    //   return res.status(400).json({
    //     errorMsg: err,
    //     success: false
    //   })
    // }
    const count = await User.count()
    const str = (count + 1).toString()
    const uid = str.length < 6 ? '000000'.slice(0, 6 - str.length) + str : str
    const userName = username
    const user = new User({ userName, phoneNum, password, uid })
    const doc = await user.save()
    const data = {
      _id: doc._id,
      username,
      uid: doc.uid
    }
    return res.status(200).json({
      token: generateToken(data),
      success: true,
      name:userName,
    })
  } catch (err) {
    console.log('已存在')
    return res.status(200).json({
      errorMsg: '注册失败，请稍后再试',
      success: false
    })
  }
}

exports.login = async (req, res) => {
  const { password, username } = req.body
  
  try {
    const user = await User.findOne({
      userName: username
    })
    console.log('~~~~~~~~~~~~~~~~~~~~'+user)
    if (!user) {
      console.log('不存在该账号')
      return res.status(400).json({
        errorMsg: '账号不存在',
        success: false
      })
    }
    const isMatch = user.comparePassword(password)
    console.log(isMatch)
    if (!isMatch) {
      console.log('匹配密码'+!isMatch)
      return res.status(400).json({
        errorMsg: '账号密码不匹配',
        success: false
      })
    }
    const data = {
      userName: user.userName,
      coin: user.coin,
      _id: user._id,
      uid: user.uid
    }

    // if (user.admin) {
    //   data.admin = user.admin
    // }

    return res.json({
      
      token: generateToken(data),
      success: true
    })
  } catch (err) {
    console.log('login err...', err)
    return res.status(200).json({
      errorMsg: '登录失败，请稍后再试',
      success: false
    })
  }
}

exports.profile = async (req, res) => {
  try {
    const user = await User.findById({ _id: req.userId })
    const coin = user.coin
    if (coin && coin > 0) {
      return res.json({ success: true, coin })
    }
  } catch (err) {
    console.log('get profile err...', err)
  }
}
