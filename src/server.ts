 
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");

const app = express();
const PORT = process.env.PORT || 5000;

const uri = process.env.DB_URI;

mongoose.connect(uri).then(() => {
  console.log("MongoDB connected successfully");
});
       
 
async function run() {
    
}

run()

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
