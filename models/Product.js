import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "piece", trim: true },
    stock: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.Product ||
  mongoose.model("Product", productSchema);
