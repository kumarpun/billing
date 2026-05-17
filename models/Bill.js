import mongoose from "mongoose";

const billItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    productName: { type: String, required: true },
    productPrice: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const billSchema = new mongoose.Schema(
  {
    billNumber: { type: Number, required: true, unique: true, index: true },
    customerName: { type: String, default: "", trim: true },
    items: { type: [billItemSchema], required: true },
    subtotal: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    paid: { type: Boolean, default: false, index: true },
    paidAt: { type: Date, default: null },
  },
  { timestamps: true }
);

billSchema.index({ createdAt: -1 });
billSchema.index({ paid: 1, createdAt: -1 });

export default mongoose.models.Bill || mongoose.model("Bill", billSchema);
