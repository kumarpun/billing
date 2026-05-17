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

    const filter = {};
    if (paid === "true") filter.paid = true;
    else if (paid === "false") filter.paid = false;

    const bills = await Bill.find(filter).sort({ createdAt: -1 }).lean();
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

    const { customerName, items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Build bill items with snapshot data and decrement stock
    const billItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
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

      // Decrement stock
      await Product.findByIdAndUpdate(product._id, {
        $inc: { stock: -quantity },
      });

      billItems.push({
        productId: product._id,
        productName: product.name,
        productPrice: product.price,
        quantity,
        amount: product.price * quantity,
      });
    }

    const totalAmount = billItems.reduce((sum, i) => sum + i.amount, 0);

    // Atomic bill number
    const counter = await Counter.findOneAndUpdate(
      { name: "bill" },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" }
    );

    const bill = await Bill.create({
      billNumber: counter.seq,
      customerName: customerName || "",
      items: billItems,
      totalAmount,
      createdBy: user.userId,
    });

    return NextResponse.json({ bill }, { status: 201 });
  } catch (error) {
    console.error("Bills POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
