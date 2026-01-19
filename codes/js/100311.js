const mysql = require('mysql2/promise');
const findMentors = require('./findMentors');
require('dotenv').config();
const bcrypt = require('bcrypt');

// connectToDatabase(): partially written by ChatGPT
async function connectToDatabase(userID) {
    const connectionConfig = {
        host: 'localhost',  // Replace with your MySQL server host
        user: 'root',       // Replace with your MySQL user
        password: process.env.MYSQL_ROOT_PASS,  // Replace with your MySQL password
        database: 'foster' // Replace with your MySQL database name
    };

    try {
        // Create a connection to the database
        const connection = await mysql.createConnection(connectionConfig);
        console.log("Connected to the MySQL database!");
        

        const [rows, fields] = await connection.execute(`SELECT * FROM profileClean WHERE (UserID = '${userID}')`);

        console.log(rows[0])

        await connection.end();
    } catch (error) {
        console.error("Error connecting to the MySQL database:", error);

        return null;
    }
}

async function main() {
    const hashedPassword = await bcrypt.hash("pass", 10)
    console.log(hashedPassword);
}
main();