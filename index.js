const express = require('express')
const cors = require('cors')
const app = express()
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const { authMiddleware, getUsers, authMiddlewareWithNewUser, getDashboardData, setEditUser, setDeleteUser } = require('./databaseQueries')

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

app.get('/dashboard', getDashboardData, (req, res) => {
  res.status(200).json(
    { 
      message: 'Get dashboard data successfuly',
      dashboard_data: {
        positions: req.userPositions,
        position_counts: req.userPositionCounts,
        departments: req.userDepartments,
        department_counts: req.userDepartmentCounts
      }
    }
  )
})

app.post('/set-new-user', authMiddlewareWithNewUser, (req, res) => {
  res.status(200).json(
    { 
      message: 'New user added successfuly',
    }
  )
})

app.post('/set-edit-user', setEditUser, (req, res) => {
  res.status(200).json(
    { 
      message: 'User edited successfuly'
    }
  )
})

app.post('/set-delete-user', setDeleteUser, (req, res) => {
  res.status(200).json(
    { 
      message: 'User inactive successfuly'
    }
  )
})

app.listen(PORT, () => {
  console.log("Port 8080")
})