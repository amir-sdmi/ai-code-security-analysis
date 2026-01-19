/* Fetch API */

// async function getData() {
//     const response = await fetch("https://fakerapi.it/api/v1/persons");
//     const jsonified = await response.json();
//     console.log(jsonified);
// }

// getData();

/* JWT */

const express = require("express");
const jwt = require("jsonwebtoken");

const app = express();
const jwtPassword = "123456";

app.use(express.json());

const allUsers = [
    {
        username: "test1@gmail.com",
        password: "123",
        name: "test1"
    }, {
        username: "test2@gmail.com",
        password: "123",
        name: "test2"
    }, {
        username: "test3@gmail.com",
        password: "123",
        name: "test3"
    }
];

function userExists(username, password) {
    // do some computation
    // for(let i = 0; i < allUsers.length; i++) {
    //     const user = allUsers[i];
    //     if(user.username === username && user.password === password) return true;
    // }

    // return false;

    // instead of using a for loop, I can use the find method
    return allUsers.find((user) => {
        return user.username === username && user.password === password; 
    });
}
userExists();

app.post('/signin', function(req, res) {
    // const username = req.body.username;
    // const password = req.body.password;
    const { username, password } = req.body;

    // the below check was suggested by chatgpt, did not apply it naturally
    if (!username || !password) {
        return res.status(400).json({ msg: "Username and password are required." });
    }

    const user = userExists(username, password);
    if(!user) {
        return res.status(403).json({
            msg: "User does not exist in our DB, you need to create one!" 
        });
    }

    // generating a jwt token:
    const token = jwt.sign({
        username: user.username,
    }, jwtPassword, {
        expiresIn: '1h',
    });

    return res.json({
        msg: "User signed in.",
        token,
    })

    // res.send("User signed in.");

    // var token = jwt.sign({username: username}, "shhhhhhhhh");
    // return res.json({
    //     token,
    // });
});

app.get('/users', function(req, res) {
    const token  = req.headers.authorization;

    if(!token) {
        return res.status(401).json({
            msg: "Token is required."
        });
    }

    try {
        const decoded = jwt.verify(token, jwtPassword);
        const username = decoded.username;

        const users = allUsers.filter((user) => {
            return user.username !== username
        });
        return res.json({
            users,
            decoded
        })
    } catch (error) {
        return res.status(403).json({
            msg: "Invalid Token!"
        });
    }
});

app.listen(3000);