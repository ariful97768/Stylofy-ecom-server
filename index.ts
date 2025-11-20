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

app.use(cookieParser());
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

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findOne({ email: decoded.email });

    if (
      user &&
      (user.role === "admin" || user.role === "seller" || user.role === "user")
    ) {
      next();
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    res.status(401).json({ error, message: "Invalid token" });
  }
}

async function verifyAdmin(req: Request, res: Response, next: Function) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }
  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findOne({ email: decoded.email });

    if (decoded.role === "admin" && user.role === "admin") {
      next();
    } else {
      res.status(403).json({ message: "Forbidden" });
    }
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
}

async function verifySeller(req: Request, res: Response, next: Function) {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    const user = await User.findOne({ email: decoded.email });

    if (decoded.role === "seller" && user.role === "seller") {
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
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      })
      .json({ message: "signed token successfully" });
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

  app.post("/sign-user", async (req: Request, res: Response) => {
    try {
      const data = req.body;
      const email = data.email;
      if (!email) return res.status(400).json({ message: "Email is required" });

      const existingUser = await User.findOne({ email: email.toLowerCase() });

      if (existingUser) {
        return res.status(200).json(existingUser);
      }

      const newUser = new User(data);
      const savedUser = await newUser.save();
      res.status(201).json(savedUser);
    } catch (error) {
      res.status(500).json({ error, message: "Server Error" });
    }
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

  app.get("/get-homepage-products", async (req: Request, res: Response) => {
    try {
      const products = await Product.find().limit(8);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  });

  app.get("/get-all-products", async (req: Request, res: Response) => {
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
  });

  app.patch(
    "/update-order-status/:id",
    verifyAdmin,
    async (req: Request, res: Response) => {
      const id = req.params.id;
      const status = req.body.status;
      if (
        status !== "accepted" &&
        status !== "shipped" &&
        status !== "rejected"
      ) {
        return res.status(400).json({ message: "Invalid status" });
      }
      try {
        const updatedProduct = await Order.updateOne(
          { _id: id },
          {
            status: status,
          }
        );
        res.json(updatedProduct);
      } catch (error) {
        res.status(500).json({ error, message: "Server Error" });
      }
    }
  );

  app.get("/get-product/:id", async (req: Request, res: Response) => {
    const id = req.params.id;

    try {
      const product = await Product.findById(id);
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Server Error" });
    }
  });

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

  app.get(
    "/get-orders/:email",
    verifyToken,
    async (req: Request, res: Response) => {
      try {
        const orders = await Order.find()
          .where("user")
          .equals(req.params.email)
          .populate("product")
          .sort({ createdAt: -1 });
        res.json(orders);
      } catch (error) {
        res.status(500).json({ message: "Server Error" });
      }
    }
  );

  app.delete(
    "/delete-order/:id",
    verifyToken,
    async (req: Request, res: Response) => {
      const id = req.params.id;
      try {
        const ress = await Order.findByIdAndDelete(id);
        if (!ress) {
          return res.status(404).json({ message: "Order not found" });
        }
        res.json({ message: "Order canceled successfully" });
      } catch (error) {
        res.status(500).json({ message: "Server Error" });
      }
    }
  );

  app.get("/get-users", verifyAdmin, async (req: Request, res: Response) => {
    try {
      const start = parseInt(req.query.start as string) || 0;
      const limit = parseInt(req.query.limit as string) || 10;

      const users = await User.aggregate([
        {
          $lookup: {
            from: "orders",
            localField: "email",
            foreignField: "user",
            as: "orders",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "email",
            foreignField: "seller",
            as: "products",
          },
        },
        {
          $project: {
            name: 1,
            email: 1,
            role: 1,
            createdAt: 1,
            updatedAt: 1,
            orderCount: { $size: "$orders" },
            productCount: { $size: "$products" },
          },
        },
        { $skip: start },
        { $limit: limit },
      ]);

      res.json(users);
    } catch (error) {
      res.status(500).json({ error, message: "Server Error" });
    }
  });

  app.get(
    "/get-all-orders-admin",
    verifyAdmin,
    async (req: Request, res: Response) => {
      try {
        const orders = await Order.find()
          .populate("product")
          .sort({ createdAt: -1 });
        res.json(orders);
      } catch (error) {
        res.status(500).json({ error, message: "Server Error" });
      }
    }
  );
  // app.get(
  //   "/get-cart-item/:id",
  //   verifyToken,
  //   async (req: Request, res: Response) => {
  //     const id = req.params.id;

  //     try {
  //       const product = await Product.findById(id);
  //       res.json(product);
  //     } catch (error) {
  //       res.status(500).json({ message: "Server Error" });
  //     }
  //   }
  // );

  // app.get("/sign-token", (req: Request, res: Response) => {
  //   const token = req.cookies.token;
  //   if (!token) {
  //     return res.status(401).json({ message: "No token provided" });
  //   }
  //   try {
  //     const decoded = jwt.verify(token, jwtSecret);
  //     res.json({ decoded });
  //   } catch (error) {
  //     res.status(401).json({ message: "Invalid token" });
  //   }
  // });

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
