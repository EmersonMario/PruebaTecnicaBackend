const atob = require('atob')
const mysql2 = require('mysql2')
const dotenv = require('dotenv')

dotenv.config()

const db = mysql2.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
})

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' })
  }

  const authToken = authHeader.split(' ')[1]
  const [userEmail, userPassword] = atob(authToken).split(':')

  db.query("SELECT * FROM users WHERE user_email = ? AND user_password = ?", [userEmail, userPassword], (err, result) => {
    if (err) {
      console.error("Database query error: " + err)
      return res.status(500).json({ message: 'Internal server error' })
    }
    if (result.length > 0) {
      req.user = result[0]
      next()
    } else {
      res.status(401).json({ message: 'Invalid credentials' })
    }
  })
}

module.exports = authMiddleware