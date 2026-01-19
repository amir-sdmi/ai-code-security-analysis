/* Sequelize is a powerful ORM for Node.js that simplifies database interactions and 
 provides advanced features like associations, migrations, and validations.*/

const { Sequelize } = require("sequelize");

// Create a new Sequelize instance
const sequelize = new Sequelize("mydatabase", "root", "", {
  host: "localhost",
  dialect: "mysql",
  logging: false, // Set to true to see SQL queries
});

// Test the connection
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

module.exports = sequelize;

// define models

const { DataTypes } = require("sequelize");
const sequelize = require("./sequelize"); // Import the Sequelize instance

// Define a model
const Product = sequelize.define("Product", {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
});

// Sync models with the database
sequelize
  .sync()
  .then(() => {
    console.log("Models synchronized with the database.");
  })
  .catch((err) => {
    console.error("Error synchronizing models:", err);
  });

module.exports = { Product };

// for rest use chatgpt for functions 

// when use findById() in it , it will not work as it is replaced with findByPk()
