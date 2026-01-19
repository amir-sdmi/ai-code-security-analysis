const getDistanceBetweenZips = require('./geoDistance');
const mysql = require('mysql2/promise');
require('dotenv').config();

// getMentors(): partially written by ChatGPT
async function getMentors() {
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

        const [rows, fields] = await connection.execute("SELECT * FROM accounts WHERE Role = 'Mentor'");

        // Close the connection
        await connection.end();
        console.log("Connection closed.");

        return rows;
    } catch (error) {
        console.error("Error connecting to the MySQL database:", error);

        return null;
    }
}

async function getProfileClean(userID) {
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

        const [rows, fields] = await connection.execute(`SELECT * FROM profileClean WHERE UserID = ${userID}`);

        // Close the connection
        await connection.end();
        console.log("Connection closed.");

        return rows;
    } catch (error) {
        console.error("Error connecting to the MySQL database:", error);

        return null;
    }
}

async function getSimilaritiesWithMentor(userID, mentorUserID) {
    const rows = await getProfileClean(userID);
    const rowsMentor = await getProfileClean(mentorUserID);

    //console.log(rows);
    //console.log(rowsMentor);

    let common = 0;

    ["Careers", "Food", "Hobbies", "Interests", "Music", "TV Shows"].forEach((category) => {
        const str = rows[0][category];
        const strMentor = rowsMentor[0][category];
        const items = str.split(",");
        const itemsMentor = strMentor.split(",");

        const itemsCommon = items.filter(value => itemsMentor.includes(value));
        common = common + itemsCommon.length;
    });

    //console.log(common);
    return common;
}

async function findMentors(userID, zipCode) {
    const mentors = await getMentors();
    const mentorsDist = [];
    for (let i = 0; i < mentors.length; i++) {
        const mentor = mentors[i];
        const mentorZipCode = mentor.ZipCode;
        
        const dist = await getDistanceBetweenZips(zipCode, mentorZipCode);

        let score = dist - 30 * await getSimilaritiesWithMentor(userID, mentor.UserID);

        mentorsDist.push([score, mentor.UserID, dist]);
    }

    const mentorsDistSorted = mentorsDist.toSorted((a,b) => a[0] > b[0] ? 1 : -1);
    //console.log(mentorsDistSorted);
    return mentorsDistSorted;
}

module.exports = findMentors;