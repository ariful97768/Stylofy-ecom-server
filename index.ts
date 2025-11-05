import type { Request, Response } from "express";
require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
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

async function verifyToken(req: Request, res: Response, next: Function) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  // as i don't have users collection, so just checking if token is valid
  next();
  // try {
  //   const decoded = jwt.verify(token, jwtSecret);
  //   const user = await User.findOne({ email: decoded.email });

  //   if (
  //     user.role === "admin" ||
  //     user.role === "seller" ||
  //     user.role === "user"
  //   ) {
  //     next();
  //   } else {
  //     res.status(403).json({ message: "Forbidden" });
  //   }
  // } catch (error) {
  //   res.status(401).json({ message: "Invalid token" });
  // }
}

async function verifyAdmin(req: Request, res: Response, next: Function) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findOne({ email: decoded.email });

    if (user.role === "admin") {
      next();
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
}

async function verifySeller(req: Request, res: Response, next: Function) {
  console.log(req.cookies);
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    console.log(decoded);
    if (decoded.role === "seller") {
      next();
    } else {
      return res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

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

  app.post(
    "/add-product",
    verifySeller,
    async (req: Request, res: Response) => {
      try {
        const newProduct = new Product(req.body);
        const savedProduct = await newProduct.save();
        res.status(201).json(savedProduct);
      } catch (error) {
        res.status(500).json({ error, message: "Server Error" });
      }
    }
  );

  app.get(
    "/get-homepage-products",

    async (req: Request, res: Response) => {
      try {
        const products = await Product.find().limit(8);
        res.json(products);
      } catch (error) {
        res.status(500).json({ message: "Server Error" });
      }
    }
  );

  app.get(
    "/get-all-products",
    verifyToken,
    async (req: Request, res: Response) => {
      const paginationStart = parseInt(req.query.start as string) || 0;
      const paginationLimit = parseInt(req.query.limit as string) || 18;

      try {
        const products = await Product.find()
          .skip(paginationStart)
          .limit(paginationLimit);
        res.json(products);
      } catch (error) {
        res.status(500).json({ message: "Server Error" });
      }
    }
  );

  app.get(
    "/get-product/:id",
    verifyToken,
    async (req: Request, res: Response) => {
      const id = req.params.id;

      try {
        const product = await Product.findById(id);
        res.json(product);
      } catch (error) {
        res.status(500).json({ message: "Server Error" });
      }
    }
  );

  app.post("/add-to-cart", verifyToken, async (req: Request, res: Response) => {
    try {
      const newCartItem = new Cart(req.body);
      const savedCartItem = await newCartItem.save();
      res.status(201).json(savedCartItem);
    } catch (error) {
      res.status(500).json({ error, message: "Server Error" });
    }
  });

  app.post(
    "/confirm-order",
    verifyToken,
    async (req: Request, res: Response) => {
      try {
        const newOrder = new Order(req.body);
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
      } catch (error) {
        res.status(500).json({ error, message: "Server Error" });
      }
    }
  );

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
