//libraries
const express = require("express");
const hbs = require("hbs");
const CookieParser = require("cookie-parser");
const bodyParser = require('body-parser');


//Router Imported
const router = require("./routes/main");
const api = require("./routes/api");
const admin = require("./routes/admin")

//Models Imported
const User = require("./models/User");

//Variables
const port = process.env.PORT || 8000;

//Database Connectivity
require("./db/cons")



//app initiated
const app = express();

// app.use(express.json());
app.use(CookieParser());
// Suggested by ChatGPT
app.use(bodyParser.urlencoded({ extended: true ,limit: "50mb"}));
// app.use(bodyParser.json());
app.use(express.json({limit: '50mb',strict: false}));
// app.use(express.urlencoded({limit: '50mb'}));
app.use("",router)
app.use("/api",api)
app.use("/admin", admin)
app.use('/static', express.static('public'))

hbs.registerHelper("shorten", function (str, maxLength) {
    if (str.length <= maxLength) {
      return str;
    } else {
      return str.slice(0, maxLength) + "...";
    }
});
app.set("view engine", "hbs")
app.set("views", "views")


//app Started
app.listen(port,"0.0.0.0", () =>{
    console.log(`Server is listening at port no ${port}`);
});