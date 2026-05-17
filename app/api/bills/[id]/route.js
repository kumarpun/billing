import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Bill from "@/models/Bill";
import Product from "@/models/Product";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(request, { params }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();
    const bill = await Bill.findById(id).lean();

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    return NextResponse.json({ bill });
  } catch (error) {
    console.error("Bill GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const { paid } = await request.json();

    await connectDB();

    const bill = await Bill.findById(id);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    bill.paid = !!paid;
    bill.paidAt = paid ? new Date() : null;
    await bill.save();

    return NextResponse.json({ bill });
  } catch (error) {
    console.error("Bill PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;
    const { customerName, items } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: "At least one item is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const oldBill = await Bill.findById(id);
    if (!oldBill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (oldBill.paid && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can edit paid bills" },
        { status: 403 }
      );
    }

    // Restore stock from old bill items
    for (const oldItem of oldBill.items) {
      if (oldItem.productId) {
        await Product.findByIdAndUpdate(oldItem.productId, {
          $inc: { stock: oldItem.quantity },
        });
      }
    }

    // Build new bill items and decrement stock
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

    oldBill.customerName = customerName || "";
    oldBill.items = billItems;
    oldBill.totalAmount = totalAmount;
    await oldBill.save();

    return NextResponse.json({ bill: oldBill });
  } catch (error) {
    console.error("Bill PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const bill = await Bill.findById(id);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    if (bill.paid && user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can delete paid bills" },
        { status: 403 }
      );
    }

    // Restore stock
    for (const item of bill.items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }
    }

    await Bill.findByIdAndDelete(id);

    return NextResponse.json({ message: "Bill deleted" });
  } catch (error) {
    console.error("Bill DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
