const express = require('express');
const app = express()
const bcrypt = require('bcrypt')
const mysql = require('mysql2/promise');
require('dotenv').config();
const findMentors = require('./findMentors');
const cors = require('cors');

//app.use(express.json())
app.use(cors())

// pullRawFromDatabase(): partially written by ChatGPT
async function pullUserFromDatabase(email,field) {
    const connectionConfig = {
        host: 'localhost',
        user: 'root',
        password: process.env.MYSQL_ROOT_PASS,
        database: 'foster'
    };

    try {
        
        const connection = await mysql.createConnection(connectionConfig);
        console.log("Connected to the MySQL database!");

        const [rows, fields] = await connection.execute(`SELECT * FROM Accounts WHERE (${field} = '${email}')`);

        await connection.end();

        return rows;
    } catch (error) {
        console.error("Error connecting to the MySQL database:", error);

        return null;
    }
}

async function pullUserProfileFromDatabase(userID) {
    const connectionConfig = {
        host: 'localhost',
        user: 'root',
        password: process.env.MYSQL_ROOT_PASS,
        database: 'foster'
    };

    try {
        const connection = await mysql.createConnection(connectionConfig);
        let user = {};
        
        const [rows, fields] = await connection.execute(`SELECT * FROM Accounts WHERE (UserID = '${userID}')`);

        user.id = rows[0].UserID;
        user.name = rows[0].Name;
        
        const [profileRows, profileFields] = await connection.execute(`SELECT * FROM profileClean WHERE (UserID = '${userID}')`);

        // name, hobbies, food, music, tv shows, interests, careers, distance
        user.hobbies = profileRows[0].Hobbies;
        user.food = profileRows[0].Food;
        user.music = profileRows[0].Music;
        user.tvshows = profileRows[0]["TV Shows"];
        user.interests = profileRows[0].Interests;
        user.careers = profileRows[0].Careers;

        await connection.end;

        return user;
    } catch (error) {
        console.error("Error connecting to the MySQL database:", error);
    }
}

async function checkUserExists(email) {
    const connectionConfig = {
        host: 'localhost',
        user: 'root',
        password: process.env.MYSQL_ROOT_PASS,
        database: 'foster'
    };

    try {
        
        const connection = await mysql.createConnection(connectionConfig);
        console.log("Connected to the MySQL database!");

        const [rows, fields] = await connection.execute(`SELECT * FROM Accounts WHERE (Email = '${email}')`);

        await connection.end();
        console.log("Connection closed.");
        if (rows.length == 0) {
            return false;
        } else {
            return true;
        }
    } catch (error) {
        console.error("Error connecting to the MySQL database:", error);

        return null;
    }
}

async function createUser(user) {
    const connectionConfig = {
        host: 'localhost',
        user: 'root',
        password: process.env.MYSQL_ROOT_PASS,
        database: 'foster'
    };

    try {
        
        const connection = await mysql.createConnection(connectionConfig);
        console.log("Connected to the MySQL database!");

        
        await connection.execute(`INSERT INTO Accounts (Name, Password, Email, Phone, ZipCode, Role, Age) Values ("${user.name}", "${user.password}", "${user.email}", "${user.phone}", "${user.zipcode}", "${user.role}", "${user.age}")`);

        await connection.end();
        console.log("Connection closed.");

        return;
    } catch (error) {
        console.error("Error connecting to the MySQL database:", error);

        return null;
    }
}

const users = []

app.get('/users', (req, res) => {
    res.json(users)
})

app.post('/users', async(req, res) => { 
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10) // phone, zipcode, role, gender
        const user = {email: req.body.email, password: hashedPassword, name: req.body.name, phone: req.body.phone, zipcode: req.body.zipcode, role: req.body.role, age: req.body.age}
        if(await checkUserExists(user.email)) {
            res.status(201).send("Email already in use!");
        } else {
            createUser(user);
            res.status(201).send("Success!");
        }
    } catch {
        res.status(500).send();
    }
})

app.post('/users/login', express.json(), async(req, res) => {
    const user = await pullUserFromDatabase(req.body.email, "Email");
    if(user.length == 0) {
        return res.status(400).send("Cannot find user");
    }
    try {
        if(await bcrypt.compare(req.body.password, user[0].Password)) {
            res.send(`${user[0].UserID}`); // FIX LATER
            console.log(`Success at ${user[0].UserID}`);
        } else {
            res.send("Not allowed");
        }
    } catch {
        res.status(500).send();
    }
})

app.get('/find-mentors/:userId', async(req, res) => {
    const user = await pullUserFromDatabase(req.params.userId, "UserID");
    
    if(user.length == 0) {
        return res.status(400).send("Cannot find user");
    }
    
    const my_mentors = await findMentors(req.params.userId, user[0].ZipCode)

    // NAME, HOBBIES, FOOD, MUSIC, TV SHOWS, INTERESTS, CAREERS, DISTANCE
    console.log("BOBO FLAG");
    console.log(my_mentors);
    const mentor_array = [];
    await Promise.all(my_mentors.map(async mentor => {
        const profile = await pullUserProfileFromDatabase(mentor[1]);
        profile.distance = mentor[2];
        console.log(profile);
        mentor_array.push(profile);
    }));

    res.json(mentor_array);
})

app.listen(2500);