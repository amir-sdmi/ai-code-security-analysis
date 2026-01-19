const { OpenAI } = require("openai");
const fs = require('fs');
const mysql = require('mysql2/promise');
const { all } = require("axios");
require('dotenv').config();


function makeQueryGetRaw(category, userRaw, existing) {
    const GPT_QUERY = `Determine which ${category} items in the string (${userRaw}) are represented in this list: [${existing}]. Output all items found in the string that are represented in the list in CSV form. In another line, output all the items found in the string that are NOT represented in the list in CSV form.`;
    return GPT_QUERY;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY_CARD,  // Corrected to apiKey
});

// pullRawFromDatabase(): partially written by ChatGPT
async function pullRawFromDatabase(userId) {
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

        // Query the database (e.g., get all rows from the `users` table)
        const [rows, fields] = await connection.execute(`SELECT * FROM profileRaw WHERE UserID = '${userId}'`);
        
        // Close the connection
        await connection.end();
        console.log("Connection closed.");

        return rows;
    } catch (error) {
        console.error("Error connecting to the MySQL database:", error);

        return null;
    }
}

// pushCleanToDatabase(): partially written by ChatGPT
async function pushCleanToDatabase(userID, category, clean) {
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

        // Query the database (e.g., get all rows from the `users` table)
        await connection.execute(`UPDATE profileClean SET ${category} = '${clean}' WHERE UserID = '${userID}'`);
        
        // Close the connection
        await connection.end();
        console.log("Connection closed.");
        
    } catch (error) {
        console.error("Error connecting to the MySQL database:", error);

        return null;
    }
}

async function runCompletion (userID) {
    const rows = await pullRawFromDatabase(userID);

    ["Careers", "Food", "Hobbies", "Interests", "Music", "TV Shows"].forEach((category) => {
        fs.readFile(`./storage/${category}.csv`, async (err, data) => {
            if (err) throw err;
            let existing = data.toString();
            let query = makeQueryGetRaw(category, rows[0][category], existing);
            console.log(query);
            
            try {
                /*
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o",
                    messages: [{role:"user", content:query}],
                });*/
                
                //console.log(completion.choices[0].message.content);  // Corrected message content access
                const [matched, unmatched] = completion.choices[0].message.content.split("\n");

                const matchedClean = matched.split(':')[1].replaceAll(' ','');
                const unmatchedClean = unmatched.split(':')[1].replaceAll(' ','');
                console.log(matchedClean.concat(",").concat(unmatchedClean));

                fs.appendFile(`./storage/${category}.csv`, ",".concat(unmatchedClean), (err) => {if (err) throw err;});
                await pushCleanToDatabase(userID, category, matchedClean.concat(",").concat(unmatchedClean));
            } catch (error) {
                console.error("Error querying GPT:", error);
            }
        })
    });
}

runCompletion(0);