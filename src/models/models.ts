import mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    provider: { type: String, required: true },
    password: { type: String },
    role: { type: String, enum: ["admin", "seller"], default: "user" },
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
    // seller: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: true,
    // },
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

/**
 * Users{
  _id ObjectId
  name string
  email string
  image string
  provider string
  password string
  role string
  createdAt timestamp
  updatedAt timestamp
}
Product{
  _id ObjectId
  title string
  description string
  category string
  price number
  image string
  video string
  discount number
  discountTill timestamp
  stock number
  seller userId
  createdAt timestamp
  updatedAt timestamp
}
Order{
  _id string
  user userId
  product productId
  discount number
  quantity number
  price number
  status string
  createdAt timestamp
  updatedAt timestamp
}
Cart{
  _id ObjectId
  user userId
  product productId
  createdAt timestamp
  updatedAt timestamp
}

Users._id < Product.seller
Users._id < Order.user
Users._id < Cart.user
Cart.product < Product._id
Order.product < Product._id

 */
