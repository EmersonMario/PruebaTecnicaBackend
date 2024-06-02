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
    )

    if (result.length > 0) {
      req.user = result[0]
      next()
    } else {
      res.status(401).json({ message: 'Invalid credentials' })
    }
  } catch (err) {
    console.error("Database query error: " + err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// Middleware for new users
const authMiddlewareWithNewUser = async (req, res, next) => {
  const authHeader = req.headers['authorization']
  const { dni, nombre, apellido, cargo, telefono, correo, genero } = req.body
  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header missing' })
  }

  const authToken = authHeader.split(' ')[1]
  let userPassword
  try {
    [userPassword] = Buffer.from(authToken, 'base64').toString('utf-8').split(':')
  } catch (err) {
    return res.status(400).json({ message: 'Invalid authentication token' })
  }

  try {
    const result = await sequelize.query(
      "INSERT INTO users (user_dni, user_name, user_last_name, user_position, user_telephone, user_email, user_gender, user_password) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      {
        replacements: [dni, nombre, apellido, cargo, telefono, correo, genero, userPassword],
        type: QueryTypes.INSERT
      }
    )

    if (result.length > 0) {
      next()
    } else {
      res.status(401).json({ message: 'Error' })
    }
  } catch (err) {
    console.error("Database query error: " + err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

const setEditUser = async (req, res, next) => {
  console.log(req.body)
  const { id, dni, nombre, apellido, cargo, telefono, correo, genero } = req.body

  try {
    const result = await sequelize.query(
      "UPDATE users SET user_dni = ?, user_name = ?, user_last_name = ?, user_position = ?, user_telephone = ?, user_email = ?, user_gender = ? WHERE user_id = ?",
      {
        replacements: [dni, nombre, apellido, cargo, telefono, correo, genero, id],
        type: QueryTypes.UPDATE
      }
    )

    if (result) {
      next()
    } else {
      res.status(401).json({ message: 'Error: No se encontró el usuario o no se pudo actualizar' })
    }
  } catch (err) {
    console.error("Database query error: " + err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// Get users
const getUsers = async (req, res, next) => {
  try {
    const result = await sequelize.query(
      "SELECT user_id, user_email, user_dni, user_position, user_name, user_last_name, user_gender, user_telephone FROM users",
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

//Get dashboard data
const getDashboardData = async (req, res, next) => {
  try {
    const result = await sequelize.query(
      "SELECT user_position, user_dni FROM users",
      {
        type: QueryTypes.SELECT
      }
    )

    if (result.length > 0) {
      const positionCounts = {}
      const userDepartmentCounts = {}

      const departmentMap = {
        "0101": "Atlántida",
        "0201": "Colón",
        "0301": "Comayagua",
        "0401": "Copán",
        "0501": "Cortés",
        "0601": "Choluteca",
        "0701": "El Paraíso",
        "0801": "Francisco Morazán",
        "0901": "Gracias a Dios",
        "1001": "Intibucá",
        "1101": "Islas de la Bahía",
        "1201": "La Paz",
        "1301": "Lempira",
        "1401": "Ocotepeque",
        "1501": "Olancho",
        "1601": "Santa Bárbara",
        "1701": "Valle",
        "1801": "Yoro"
      };

      result.forEach(row => {
        // Contar posiciones
        if (positionCounts[row.user_position]) {
          positionCounts[row.user_position]++
        } else {
          positionCounts[row.user_position] = 1
        }

        // Contar departamentos
        const departmentCode = row.user_dni.substring(0, 4)
        const department = departmentMap[departmentCode]

        if (department) {
          if (userDepartmentCounts[department]) {
            userDepartmentCounts[department]++
          } else {
            userDepartmentCounts[department] = 1
          }
        }
      });

      const positions = Object.keys(positionCounts)
      const counts = Object.values(positionCounts)
      const userDepartments = Object.keys(userDepartmentCounts)
      const departmentCountsArray = Object.values(userDepartmentCounts)

      req.userPositions = positions
      req.userPositionCounts = counts
      req.userDepartments = userDepartments
      req.userDepartmentCounts = departmentCountsArray
      next()
    } else {
      res.status(404).json({ message: 'No user positions found' })
    }
  } catch (err) {
    console.error("Database query error: " + err)
    res.status(500).json({ message: 'Internal server error' })
  }
}

module.exports = { authMiddleware, getUsers, authMiddlewareWithNewUser, getDashboardData, setEditUser }