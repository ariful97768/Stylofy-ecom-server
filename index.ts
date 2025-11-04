import type { Request, Response } from "express";
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT;
const app = express();

const { User, Product, Order, Cart } = require("./src/models/models");

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://stylofy-ecom.vercel.app"],
    credentials: true,
  })
);

const PORT = process.env.PORT || 5000;

const uri = process.env.DB_URI;

mongoose.connect(uri).then(() => {
  console.log("MongoDB connected successfully");
});

async function run() {
  app.get("/", (req: Request, res: Response) => {
    res.send("E-Commerce Backend is running");
  });

  app.post("/sign-token", (req: Request, res: Response) => {
    const email = req.body.email;
    const token = jwt.sign(
      {
        email,
        role: "user",
      },
      jwtSecret,
      {
        algorithm: "HS256",
        expiresIn: "30d",
      }
    );
    res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      })
      .json({ token });
  });

  app.get("/signout", (req: Request, res: Response) => {
    res
      .clearCookie("token", {
        httpOnly: true,
        sameSite: "lax",
        secure: true,
      })
      .json({ message: "Signed out successfully" });
  });



  app.get("/products", async (req: Request, res: Response) => {
    try {
      const products = await Product.find().populate(
        "seller",
        "username email"
      );
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  });

  app.get("/users", async (req: Request, res: Response) => {
    try {
      const users = await User.find();
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  });
}

run().catch(console.dir);

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
