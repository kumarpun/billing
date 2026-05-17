import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Product from "@/models/Product";
import Counter from "@/models/Counter";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    const url = new URL(request.url);
    const paid = url.searchParams.get("paid");
    const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
    const skip = Math.max(Number(url.searchParams.get("skip")) || 0, 0);

    const filter = {};
    if (paid === "true") filter.paid = true;
    else if (paid === "false") filter.paid = false;

    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({ bills });
  } catch (error) {
    console.error("Bills GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { customerName, items, discountPercent } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const productIds = items.map((i) => i.productId);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("_id name price")
      .lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const billItems = [];
    const stockOps = [];
    for (const item of items) {
      const product = productMap.get(String(item.productId));
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }

      const quantity = Number(item.quantity);
      if (quantity < 1) {
        return NextResponse.json(
          { error: `Invalid quantity for ${product.name}` },
          { status: 400 }
        );
      }

      billItems.push({
        productId: product._id,
        productName: product.name,
        productPrice: product.price,
        quantity,
        amount: product.price * quantity,
      });

      stockOps.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $inc: { stock: -quantity } },
        },
      });
    }

    const subtotal = billItems.reduce((sum, i) => sum + i.amount, 0);
    const pct = Math.min(Math.max(Number(discountPercent) || 0, 0), 100);
    const discountAmount = +(subtotal * pct / 100).toFixed(2);
    const totalAmount = +(subtotal - discountAmount).toFixed(2);

    const [counter] = await Promise.all([
      Counter.findOneAndUpdate(
        { name: "bill" },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: "after" }
      ),
      Product.bulkWrite(stockOps, { ordered: false }),
    ]);

    const bill = await Bill.create({
      billNumber: counter.seq,
      customerName: customerName || "",
      items: billItems,
      subtotal,
      discountPercent: pct,
      discountAmount,
      totalAmount,
      createdBy: user.userId,
    });

    return NextResponse.json({ bill }, { status: 201 });
  } catch (error) {
    console.error("Bills POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
