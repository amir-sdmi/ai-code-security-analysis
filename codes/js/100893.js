// 1) Copied command from {https://mongoosejs.com/}
// 2) Made mongoURL variable and added url from mongodb atlas 
// 3) Used that url variable inside a arrow function and that function is assigned to variable Mongodb
// 4) Then we export that variable to index.js
// 5) the Mongodb function was showing error so whe have used chatgpt
// 6) We added database name in url between /?
// 7) Then we added command to fetch food_itmes collection in variable fetchData by establishing connection.
// 8) then we created a global varibale global.food_itmes and stored the data of foot_itmes in this and we go to index.js
// 9) now we created a async-await function fetchData.find({}).toArray(function(err,data) to fetch data from food_items
// 10)Inside the array of fetchdata we again fetched the data of foodCategory and made a global variable (global.foodCategory) and assigned value to it
// 11) This commented code was not working so i changed the code using chatgpt here we are fetching data from database by establishing connection and then adding them to global varibale

const mongoose = require('mongoose');
const mongoURL = "mongodb+srv://SwapnilPriyadarshi:mern123@cluster0.utxynw1.mongodb.net/gofoodmern?retryWrites=true&w=majority&appName=Cluster0";
// "mongodb://SwapnilPriyadarshi:mern123@ac-oanpzvy-shard-00-00.utxynw1.mongodb.net:27017,ac-oanpzvy-shard-00-01.utxynw1.mongodb.net:27017,ac-oanpzvy-shard-00-02.utxynw1.mongodb.net:27017/gofoodmern?ssl=true&replicaSet=atlas-h6k5d5-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Cluster0"

/*
const Mongodb = async () => {
    try {
        await mongoose.connect(mongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB");

        const fetchData = await mongoose.connection.db.collection("food_items");
        fetchData.find({}).toArray(async function(err,data){
            const foodCategory = await mongoose.connection.db.collection ("foodCategory");
            foodCategory.find({}).toArray(function (err,catData) {
                if(err) {
                    console.error("Error fetching data:", err);
                }else{
                    global.food_items = data;
                    global.foodCategory = catData;
                }
            })
        });
    }
    catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

module.exports = Mongodb;
*/

const Mongodb = async () => {
    try {
        await mongoose.connect(mongoURL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("Connected to MongoDB");

        const fetchData = await mongoose.connection.db.collection("food_items");
        const data = await fetchData.find({}).toArray();

        const foodCategory = await mongoose.connection.db.collection("food_category");
        const catData = await foodCategory.find({}).toArray();

        global.food_items = data;
        global.foodCategory = catData;

    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
};

module.exports = Mongodb;
