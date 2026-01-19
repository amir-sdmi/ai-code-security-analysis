const { faker, da } = require('@faker-js/faker');
const mysql = require("mysql2");
const express = require("express");
const app = express();
const path = require("path");
const { send } = require('process');
const methodoverride = require("method-override");
const { v4: uuidv4 } = require('uuid');


//use method override to change post to patch
app.use(methodoverride("_method"));
//parse the form data
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'delta',
  password: 'mysql'
});

let createRandomUser = () => {
  return [
    faker.string.uuid(),
    faker.internet.userName(),
    faker.internet.email(),
    faker.internet.password(),
  ];
};

// //inseting new data
// let q="insert into user (id,username,email,password)values ?";
// let data=[];
// for(let i=1;i<=100;i++)
// {
// data.push(createRandomUser());
// }


//home page route
app.get("/", (req, res) => {
  let q = 'select count(*)from user';
  try {
    connection.query(q, (err, result) => {
      if (err) throw err;
      let count = result[0]["count(*)"];
      res.render("home.ejs", { count });
    });
  }
  catch (err) {
    console.log(err);
    res.send(err);
  }
});


//show user data route
app.get("/user", (req, res) => {
  let q = 'select * from user';
  try {
    connection.query(q, (err, result1) => {
      if (err) throw err;
      //  console.log(result);
      //  res.send(result);
      res.render("show_users.ejs", { result1 });
    });
  }
  catch (err) {
    console.log(err);
    res.send(err);
  }
});

// edit route
app.get("/user/:id/edit", (req, res) => {
  let id = req.params.id;
  let q = `SELECT * FROM user WHERE id='${id}'`;
  try {
    connection.query(q, (err, result2) => {
      if (err) throw err;
      let user = result2[0];
      res.render("edit.ejs", { user });
    });
  }
  catch (err) {
    console.log(err);
    res.send(err);
  }
});

//update route
app.patch("/user/:id", (req, res) => {
  let { id } = req.params;
  let { password: password, username: username } = req.body;
  let qa = `SELECT * FROM user WHERE id='${id}'`;
  try {
    connection.query(qa, (err, result3) => {
      if (err) throw err;
      let user = result3[0];
      console.log(user);
      if (password !== user.password) {
        res.send("wrong password");
      }
      else {
        let q2 = `UPDATE user SET username='${username}' WHERE id='${id}'`;
        connection.query(q2, (err, result) => {
          if (err) throw err;
          res.redirect("/user");
        });
      }
    });
  }
  catch (err) {
    console.log(err);
    res.send("some error in DB");
  }
});


//delete port
app.get("/user/:id/delete", (req, res) => {
  let id = req.params.id;
  let q = `SELECT * FROM user WHERE id=?`;
  try {
    connection.query(q, [id], (err, result2) => {
      if (err) throw err;
      let user = result2[0];
      res.render("delete.ejs", { user });
    });
  }
  catch (err) {
    console.log(err);
    res.send(err);
  }
});
//delete route
app.delete("/user/:id", (req, res) => {
  let id = req.params.id;
  let { email: useremail, password: uesrpassword } = req.body;
  let q = `SELECT * FROM user WHERE id=?`;
  try {
    connection.query(q, [id], (err, result2) => {
      if (err) throw err;
      let olduser = result2[0];
      console.log(olduser);
      if (olduser.email !== useremail || olduser.password !== uesrpassword) {
        res.send("wrong email and password");
      }
      else {
        let q = `DELETE FROM user WHERE id=?`;
        connection.query(q, [id], (err, result) => {
          if (err) throw err;
          console.log(user);
          res.redirect("/user");
        });
      }
    });
  }
  catch (err) {
    console.log(err);
    res.send(err);
  }
});

// create user rout
app.get("/user/create", (req, res) => {
  res.render("create.ejs");
});
// create user rout
app.post("/user", (req, res) => {
  const id = uuidv4();
  let { username, email, password } = req.body;
  let q = 'INSERT INTO user (id, username, email, password) VALUES (?,?,?,?)';
  let user=[
    id,username,email,password
  ];
  try {
    connection.query(q,user,(err, result) => {
      if (err) throw err;
      res.redirect("/user");
    });
  }
  catch {
    console.log(err);
  }
});



app.listen("6600", (req, rss) => {
  console.log("app is listening at port 6600");
});


//hw is not completed this is for home(biher) work
// 1.create a page for add new user by taking email username password;

// you can use chatgpt to take help
//if yout able to complete this hw day 37 will be completed

// try
// {
//   connection.query(q,[data],(err,result)=>
//   {
//     if(err) throw  err;
//     console.log(result);
//   });
// }
// catch(err)
// {
//   console.log(err);
// }
// connection.end();






