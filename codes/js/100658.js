require("dotenv").config();
const sampleData = require("./data");

const mongoose = require("mongoose");
const { create: createRoom } = require("../modules/rooms/room.controller");
const userModel = require("../modules/users/user.model");
const { genHash } = require("../utils/secure");

/*
1. Require all the packages
2. Load the sample data
    a. Get the sample data using chatgpt
3. Create a user with admin role
4. Create the room using the sample data along with user data
*/

const admin = {
  name: "Raktim Admin",
  email: "raktim@mailinator.com",
  password: genHash("123"),
  roles: ["admin"],
  isActive: true,
};
const user = {
  name: "Raktim User",
  email: "rakimsth@mailinator.com",
  password: genHash("123"),
  isActive: true,
};

// IIFEs
(async () => {
  try {
    console.log("Resetting database");
    await mongoose.connect(process.env.DB_URL);
    await mongoose.connection.db.dropDatabase();
    console.log("Finished resetting database");
    console.log("Creating user database");
    const { _id: adminId } = await userModel.create(admin);
    const { _id: userId } = await userModel.create(user);
    console.log({ adminId, userId });
    console.log("finished creating user database");
    console.log("Creating room database");
    sampleData.map(async (room) => {
      room.updated_by = adminId;
      await createRoom(room);
    });
    console.log("Finished creating room database");
  } catch (e) {
    console.log({ e });
  }
})();
