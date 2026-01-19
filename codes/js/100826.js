require("dotenv").config();
const mongoose = require("mongoose");
const { Vendor } = require("../models/vendor");

mongoose
    .connect(process.env.CONNECTION_STRING, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Could not connect to MongoDB", err));

// use this file as a template to update the model schema after refactoring the schema
// this script will update the existing documents in the database to match the new schema

// to run: node migrate-data-template.js

// use chatGPT for other data. e.g.

/*
convert the following fields to the new schema:

vendor:{
    document:"string"
} 

to 

vendor:{
    document:{ 
        s3Key: { type: String },
        uploadedAt: { type: Date },
        approvedAt: { type: Date },
    }
}
*/


async function migrateData() {
    const vendors = await Vendor.find({}).lean();

    const savePromises = vendors.map((vendor) => {
        // Refactor vendor.document
        if (typeof vendor.document === "string") {
            vendor.document = {
                s3Key: vendor.document,
                uploadedAt: Date.now(),
            };
        }

        // Remove unnecessary fields
        delete vendor.email;
        delete vendor.profileImg;

        // Update the existing document
        return Vendor.updateOne({ _id: vendor._id }, vendor);
    });

    // Wait for all save promises to resolve
    await Promise.all(savePromises);
    console.log("All vendors updated");
}

migrateData();
