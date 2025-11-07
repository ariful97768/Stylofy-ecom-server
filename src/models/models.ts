import mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String, default: null },
    provider: { type: String, required: true },
    password: { type: String },
    role: { type: String, enum: ["admin", "seller", "user"], default: "user" },
  },
  { timestamps: true }
);

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    images: { type: [String], required: true },
    video: { type: String },
    discount: { type: Number, default: 0 },
    discountTill: { type: Date },
    quantity: { type: Number, required: true },
    size: { type: String, required: true },
    seller: { type: String, required: true },
  },
  { timestamps: true }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: String, required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    payment: { type: ["card", "cod"], required: true },
    discount: { type: Number, default: 0 },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true },
    shipping: { type: Number, required: true },
    userInfo: {
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
    order: {
      country: { type: String, required: true },
      city: { type: String, required: true },
      address: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["pending", "shipped", "delivered"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
const Product = mongoose.model("Product", productSchema);
const Order = mongoose.model("Order", orderSchema);
const Cart = mongoose.model("Cart", cartSchema);
module.exports = { User, Product, Order, Cart };
