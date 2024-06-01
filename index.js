const express = require('express')
const cors = require('cors')
const app = express()
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const { authMiddleware, getUsers } = require('./databaseQueries')

dotenv.config()
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
app.use(cors())

const PORT = process.env.PORT || 8080

app.post('/login', authMiddleware, (req, res) => {
  res.status(200).json(
    { 
      message: 'Login successful',
      user_data: {
        user_dni: req.user.user_dni,
        user_email: req.user.user_email,
        user_last_name: req.user.user_last_name,
        user_name: req.user.user_name,
        user_position: req.user.user_position
      } 
    }
  )
})

app.get('/colaboradores', getUsers, (req, res) => {
  res.status(200).json(
    { 
      message: 'Get users successfuly',
      users_data: req.users
    }
  )
})

app.listen(PORT, () => {
  console.log("Port 8080")
})