import type { Request, Response } from "express";
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const { User, Product, Order, Cart } = require("./models/models");

const app = express();
const PORT = process.env.PORT || 5000;

const uri = process.env.DB_URI;

mongoose.connect(uri).then(() => {
  console.log("MongoDB connected successfully");
});

async function run() {
  app.get("/", (req: Request, res: Response) => {
    res.send("E-Commerce Backend is running");
  });

  // app.get("/products", async (req: Request, res: Response) => {
  //   try {
  //     const products = await Product.find().populate(
  //       "seller",
  //       "username email"
  //     );
  //     res.json(products);
  //   } catch (error) {
  //     res.status(500).json({ message: "Server Error" });
  //   }
  // });

  // app.get("/users", async (req: Request, res: Response) => {
  //   try {
  //     const users = await User.find();
  //     res.json(users);
  //   } catch (error) {
  //     res.status(500).json({ message: "Server Error" });
  //   }
  // });
}

run();

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
