const dotenv = require('dotenv');
const { Sequelize, QueryTypes } = require("sequelize");
dotenv.config();

// Sequelize setup
const sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
    define: {
      freezeTableName: true,
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      paranoid: true,
      deletedAt: "deleted_at",
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

// Authentication middleware
const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' })
  }

  const authToken = authHeader.split(' ')[1]
  let userEmail, userPassword;
  try {
    [userEmail, userPassword] = Buffer.from(authToken, 'base64').toString('utf-8').split(':')
  } catch (err) {
    return res.status(400).json({ message: 'Invalid authentication token' })
  }

  try {
    const result = await sequelize.query(
      "SELECT * FROM users WHERE user_email = ? AND user_password = ?",
      {
        replacements: [userEmail, userPassword],
        type: QueryTypes.SELECT
      }
    );

    if (result.length > 0) {
      req.user = result[0]
      next();
    } else {
      res.status(401).json({ message: 'Invalid credentials' })
    }
  } catch (err) {
    console.error("Database query error: " + err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// Get users function
const getUsers = async (req, res, next) => {
  try {
    const result = await sequelize.query(
      "SELECT user_id, user_email, user_dni, user_position, user_name, user_last_name, user_gender FROM users",
      {
        type: QueryTypes.SELECT
      }
    );

    if (result.length > 0) {
      req.users = result
      next()
    } else {
      res.status(404).json({ message: 'No users found' })
    }
  } catch (err) {
    console.error("Database query error: " + err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

module.exports = { authMiddleware, getUsers }