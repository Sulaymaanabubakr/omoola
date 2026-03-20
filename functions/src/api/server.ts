import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

// Support both standalone start (cwd is root) and Firebase Emulator start (cwd is functions)
const envPath = process.cwd().endsWith("functions")
  ? path.resolve(process.cwd(), "../.env")
  : path.resolve(process.cwd(), ".env");

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";
import { getAdminDb, getAdminAuth } from "../../../src/lib/firebase/admin";
import { sendOrderEmail } from "../../../src/lib/email";
import { checkoutSchema, statusUpdateSchema } from "../../../src/lib/schemas";
import type { CartItem, Order } from "../../../src/types";
import { getUserFromRequest, requireAdmin } from "./auth";
import cloudinary from "../../../src/lib/cloudinary";
import { serializeProduct } from "../../../src/lib/product-serialization";
import { serializeStoreSettings, defaultStoreSettings } from "../../../src/lib/settings-serialization";

const app = express();
app.set("trust proxy", true);
const PORT = Number(process.env.PORT || 3001);
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || PAYSTACK_SECRET_KEY;

const allowedOrigins = [
  ...(process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  "http://localhost:3000",
  "http://localhost:5173",
];

// Returns true for any origin that is explicitly allowed or is a Vercel preview deployment.
function isOriginAllowed(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;
  // Allow all Vercel preview deployments (*.vercel.app)
  try {
    const { hostname } = new URL(origin);
    if (hostname.endsWith(".vercel.app")) return true;
  } catch {
    // ignore malformed origins
  }
  return false;
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (isOriginAllowed(origin)) return callback(null, true);
      return callback(new Error("CORS blocked"));
    },
    credentials: true,
  }),
);
app.use(
  express.json({
    limit: "10mb",
    verify(req, _res, buf) {
      (req as Request & { rawBody?: Buffer }).rawBody = Buffer.from(buf);
    },
  }),
);

function rateLimitJsonHandler(req: Request, res: Response) {
  res.status(429).json({
    success: false,
    error: "Too many requests. Please wait a few minutes and try again.",
    path: req.path,
  });
}

const publicWriteLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitJsonHandler,
});

const paymentVerifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitJsonHandler,
});

function createOrderNumber() {
  return `MLX-${Date.now()}-${randomUUID().slice(0, 6).toUpperCase()}`;
}

function normalizeStatusEvents(snapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>) {
  return snapshot.docs
    .map((doc) => doc.data())
    .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
}

function readReferenceHistory(order: Record<string, unknown>): string[] {
  const payment = (order.payment || {}) as { referenceHistory?: unknown };
  return Array.isArray(payment.referenceHistory)
    ? payment.referenceHistory.map((value) => String(value || "")).filter(Boolean)
    : [];
}

function dedupeStrings(values: Array<string | undefined | null>) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

async function resolveOrderForReference(reference: string, metadataOrderId?: string) {
  if (metadataOrderId) {
    const direct = await getAdminDb().collection("orders").doc(metadataOrderId).get();
    if (direct.exists) return direct;
  }

  const byCurrentReference = await getAdminDb()
    .collection("orders")
    .where("payment.reference", "==", reference)
    .limit(1)
    .get();
  if (!byCurrentReference.empty) return byCurrentReference.docs[0];

  const byReferenceHistory = await getAdminDb()
    .collection("orders")
    .where("payment.referenceHistory", "array-contains", reference)
    .limit(1)
    .get();
  if (!byReferenceHistory.empty) return byReferenceHistory.docs[0];

  return null;
}

function verifyPaystackSignature(req: Request) {
  const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;
  const signature = String(req.headers["x-paystack-signature"] || "");
  if (!rawBody || !signature || !PAYSTACK_WEBHOOK_SECRET) return false;

  const expected = createHmac("sha512", PAYSTACK_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const actualBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

async function finalizeVerifiedPayment(reference: string, verifyData: Record<string, any>) {
  const metadataOrderId = String(verifyData?.data?.metadata?.orderId || "").trim();
  const orderDoc = await resolveOrderForReference(reference, metadataOrderId);
  if (!orderDoc) {
    return { ok: false as const, status: 404, error: "No order found for payment reference" };
  }

  const orderRef = orderDoc.ref;
  const orderId = orderDoc.id;
  const orderData = orderDoc.data() as Record<string, unknown>;

  if (metadataOrderId && metadataOrderId !== orderId) {
    return { ok: false as const, status: 400, error: "Payment metadata does not match order reference" };
  }

  const expectedKobo = Math.round(Number(orderData.total || 0) * 100);
  const paidKobo = Number(verifyData?.data?.amount || 0);
  if (expectedKobo <= 0 || paidKobo !== expectedKobo) {
    return { ok: false as const, status: 400, error: "Paid amount does not match order total" };
  }

  let paymentTransitioned = false;
  let latestOrderData = orderData;

  await getAdminDb().runTransaction(async (tx) => {
    const latestOrderDoc = await tx.get(orderRef);
    if (!latestOrderDoc.exists) throw new Error("Order no longer exists");

    latestOrderData = latestOrderDoc.data() as Record<string, unknown>;
    const latestPayment = (latestOrderData.payment as { status?: string; reference?: string } | undefined) || {};
    const latestPaymentStatus = latestPayment.status || "unpaid";
    const latestStatus = String(latestOrderData.status || "");
    const history = readReferenceHistory(latestOrderData);
    const nextHistory = dedupeStrings([latestPayment.reference, reference, ...history]);

    if (latestPaymentStatus === "paid") {
      tx.update(orderRef, {
        "payment.reference": reference,
        "payment.referenceHistory": nextHistory,
        updatedAt: new Date().toISOString(),
      });
      return;
    }

    if (!(latestStatus === "pending" && latestPaymentStatus === "unpaid")) {
      throw new Error("Order is not payable in its current status");
    }

    const items = Array.isArray(latestOrderData.items)
      ? (latestOrderData.items as Array<{ productId?: string; qty?: number }>)
      : [];

    for (const item of items) {
      const productId = String(item.productId || "");
      const qty = Math.floor(Number(item.qty || 0));
      if (!productId || qty < 1) throw new Error("Invalid order item while confirming payment");

      const productRef = getAdminDb().collection("products").doc(productId);
      const productDoc = await tx.get(productRef);
      if (!productDoc.exists) throw new Error(`Product no longer exists: ${productId}`);

      const product = productDoc.data() as { stockQty?: number; name?: string };
      const currentStock = Number(product.stockQty || 0);
      if (!Number.isFinite(currentStock) || currentStock < qty) {
        throw new Error(`Insufficient stock for: ${product.name || productId}`);
      }

      tx.update(productRef, {
        stockQty: currentStock - qty,
        updatedAt: new Date().toISOString(),
      });
    }

    const now = new Date().toISOString();
    tx.update(orderRef, {
      status: "confirmed",
      "payment.reference": reference,
      "payment.referenceHistory": nextHistory,
      "payment.status": "paid",
      "payment.paidAt": now,
      updatedAt: now,
    });
    tx.set(orderRef.collection("statusEvents").doc(), {
      status: "confirmed",
      note: "Payment verified successfully via Paystack",
      createdAt: now,
    });
    paymentTransitioned = true;
  });

  if (paymentTransitioned) {
    const customerEmail = String(((latestOrderData.customer as Record<string, unknown> | undefined)?.email) || "");
    const orderNumber = String(latestOrderData.orderNumber || orderId);
    if (customerEmail) await sendOrderEmail(customerEmail, orderNumber).catch(() => undefined);
  }

  return { ok: true as const, orderId, paymentTransitioned };
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/orders", publicWriteLimiter, async (req, res) => {
  try {
    const parsed = checkoutSchema.safeParse(req.body);
    if (!parsed.success) {
      const flattened = parsed.error.flatten();
      const fieldEntries = Object.entries(flattened.fieldErrors)
        .map(([field, messages]) => {
          const first = Array.isArray(messages) ? messages[0] : undefined;
          return first ? `${field}: ${first}` : "";
        })
        .filter(Boolean);
      const formMessage = flattened.formErrors[0] || "";
      const message = [formMessage, ...fieldEntries].filter(Boolean).join(" | ") || "Invalid checkout payload";
      res.status(400).json({ success: false, error: message, details: flattened });
      return;
    }

    const data = parsed.data;
    let authenticatedUserId: string | undefined;
    try {
      const requester = await getUserFromRequest(req);
      authenticatedUserId = requester.uid;
    } catch {
      authenticatedUserId = undefined;
    }

    const productSnapshots = await Promise.all(
      data.items.map(async (item) => {
        const byId = await getAdminDb().collection("products").doc(item.productId).get();
        if (byId.exists) return byId;
        const slug = String(item.productSlug || "").trim();
        if (slug) {
          const bySlug = await getAdminDb().collection("products").where("slug", "==", slug).limit(1).get();
          if (!bySlug.empty) return bySlug.docs[0];
        }

        // Last-resort migration fallback for legacy carts after reseeding IDs/slugs.
        const name = String(item.name || "").trim();
        if (name) {
          const byName = await getAdminDb().collection("products").where("name", "==", name).limit(1).get();
          if (!byName.empty) return byName.docs[0];
        }
        return byId;
      }),
    );

    const validatedItems: CartItem[] = [];
    const missingProductIds: string[] = [];
    const inactiveProductIds: string[] = [];
    const insufficientStockItems: Array<{ productId: string; requestedQty: number; availableQty: number }> = [];

    data.items.forEach((item, idx) => {
      const snap = productSnapshots[idx];
      if (!snap.exists) {
        missingProductIds.push(item.productId);
        return;
      }

      const product = snap.data() as {
        name?: string;
        price?: number;
        stockQty?: number;
        isActive?: boolean;
        images?: Array<{ url?: string }>;
      };

      if (!product.isActive) {
        inactiveProductIds.push(item.productId);
        return;
      }
      const liveStock = typeof product.stockQty === "number" ? product.stockQty : 0;
      if (item.qty > liveStock) {
        insufficientStockItems.push({
          productId: item.productId,
          requestedQty: item.qty,
          availableQty: liveStock,
        });
        if (liveStock < 1) return;
        validatedItems.push({
          productId: item.productId,
          productSlug: item.productSlug,
          name: product.name || item.name,
          price: Number(product.price || 0),
          qty: liveStock,
          imageUrl: product.images?.[0]?.url || item.imageUrl,
          stockQty: Number(product.stockQty || item.stockQty),
        });
        return;
      }

      validatedItems.push({
        productId: item.productId,
        productSlug: item.productSlug,
        name: product.name || item.name,
        price: Number(product.price || 0),
        qty: item.qty,
        imageUrl: product.images?.[0]?.url || item.imageUrl,
        stockQty: Number(product.stockQty || item.stockQty),
      });
    });

    if (validatedItems.length === 0 && (missingProductIds.length || inactiveProductIds.length || insufficientStockItems.length)) {
      res.status(409).json({
        success: false,
        code: "CART_OUTDATED",
        error: "Some products in your cart are no longer available or have changed stock.",
        details: {
          missingProductIds,
          inactiveProductIds,
          insufficientStockItems,
        },
      });
      return;
    }

    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const settingsSnap = await getAdminDb().collection("settings").doc("store").get();
    const deliveryFee = Number(settingsSnap.data()?.deliveryFee || 0);
    const total = subtotal + deliveryFee;

    const orderRef = getAdminDb().collection("orders").doc();
    const now = new Date().toISOString();
    const orderNumber = createOrderNumber();

    const newOrder: Order = {
      id: orderRef.id,
      orderNumber,
      customer: {
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone,
      },
      items: validatedItems,
      subtotal,
      deliveryFee,
      total,
      shippingAddress: {
        fullName: data.shippingAddress.fullName,
        phone: data.shippingAddress.phone,
        addressLine1: data.shippingAddress.addressLine1,
        city: data.shippingAddress.city,
        state: data.shippingAddress.state,
        notes: data.shippingAddress.notes,
      },
      payment: {
        provider: "paystack",
        reference: "",
        status: "unpaid",
      },
      status: "pending",
      createdAt: now,
      updatedAt: now,
    };
    if (authenticatedUserId) {
      newOrder.userId = authenticatedUserId;
    }

    const sanitizedOrder = JSON.parse(JSON.stringify(newOrder)) as Order;
    await orderRef.set(sanitizedOrder);
    await orderRef.collection("statusEvents").add({
      status: "pending",
      note: "Order created, waiting for payment",
      createdAt: now,
    });

    res.json({
      success: true,
      orderId: orderRef.id,
      orderNumber,
      amount: total,
      adjustments: {
        missingProductIds,
        inactiveProductIds,
        insufficientStockItems,
      },
    });
  } catch (error) {
    const message = (error as Error).message;
    console.error("[/api/orders] checkout error:", error);
    const statusCode = message.startsWith("Product") || message.startsWith("Insufficient stock") ? 400 : 500;
    res.status(statusCode).json({ success: false, error: message });
  }
});

app.get("/api/orders/track", publicWriteLimiter, async (req, res) => {
  try {
    const orderIdOrNumber = String(req.query.orderId || req.query.orderNumber || "").trim();
    const email = String(req.query.email || "").toLowerCase();
    const phone = String(req.query.phone || "");

    if (!orderIdOrNumber || (!email && !phone)) {
      res.status(400).json({ error: "orderId/orderNumber and email or phone required" });
      return;
    }

    let orderDoc = await getAdminDb().collection("orders").doc(orderIdOrNumber).get();
    if (!orderDoc.exists) {
      const orderNumberQuery = await getAdminDb()
        .collection("orders")
        .where("orderNumber", "==", orderIdOrNumber)
        .limit(1)
        .get();
      if (!orderNumberQuery.empty) {
        orderDoc = orderNumberQuery.docs[0];
      }
    }

    if (!orderDoc.exists) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const order = orderDoc.data() as Record<string, unknown>;
    const customer = (order.customer || {}) as Record<string, unknown>;
    const emailMatch = email && String(customer.email || "").toLowerCase() === email;
    const phoneMatch = phone && String(customer.phone || "") === phone;

    if (!emailMatch && !phoneMatch) {
      res.status(403).json({ error: "Verification failed" });
      return;
    }

    const statusEventsSnap = await orderDoc.ref.collection("statusEvents").get();
    const statusEvents = statusEventsSnap.docs
      .map((doc) => doc.data())
      .sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));

    res.json({
      order: {
        id: orderDoc.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: order.items,
        total: order.total,
      },
      statusEvents,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/paystack/initialize", async (req, res) => {
  try {
    const { orderId, email, amount } = req.body as { orderId?: string; email?: string; amount?: number };
    if (!orderId || !email) {
      res.status(400).json({ success: false, error: "orderId and email are required." });
      return;
    }

    if (!PAYSTACK_SECRET_KEY) {
      res.status(500).json({ success: false, error: "Paystack secret key not configured." });
      return;
    }

    const orderRef = getAdminDb().collection("orders").doc(String(orderId));
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      res.status(404).json({ success: false, error: "Order not found." });
      return;
    }

    const order = orderDoc.data() as {
      customer?: { email?: string };
      total?: number;
      payment?: { status?: string };
    };

    if ((order.payment?.status || "unpaid") === "paid") {
      res.status(400).json({ success: false, error: "Order payment already completed." });
      return;
    }

    const orderEmail = String(order.customer?.email || "").toLowerCase();
    if (orderEmail && orderEmail !== String(email).toLowerCase()) {
      res.status(400).json({ success: false, error: "Email does not match order." });
      return;
    }

    const expectedAmount = Number(order.total || 0);
    if (expectedAmount <= 0) {
      res.status(400).json({ success: false, error: "Invalid order total." });
      return;
    }

    if (amount !== undefined && Math.round(Number(amount)) !== Math.round(expectedAmount)) {
      res.status(400).json({ success: false, error: "Amount does not match order total." });
      return;
    }

    const amountInKobo = Math.round(expectedAmount * 100);
    const baseUrl = process.env.APP_URL || allowedOrigins[0] || "http://localhost:3000";

    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountInKobo,
        metadata: { orderId },
        callback_url: `${baseUrl}/checkout/verify`,
      }),
    });

    const data = await paystackRes.json();
    if (!data.status) {
      res.status(400).json({ success: false, error: data.message });
      return;
    }

    const newReference = String(data.data.reference || "");
    const referenceHistory = dedupeStrings([
      newReference,
      ...readReferenceHistory(orderDoc.data() as Record<string, unknown>),
      String((order.payment || {}).reference || ""),
    ]);

    await orderRef.update({
      "payment.reference": newReference,
      "payment.referenceHistory": referenceHistory,
      updatedAt: new Date().toISOString(),
    });

    res.json({
      success: true,
      authorization_url: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.post("/api/paystack/verify", paymentVerifyLimiter, async (req, res) => {
  try {
    const { reference } = req.body as { reference?: string };
    if (!reference) {
      res.status(400).json({ success: false, error: "Missing reference" });
      return;
    }

    if (!PAYSTACK_SECRET_KEY) {
      res.status(500).json({ success: false, error: "Paystack secret key not configured." });
      return;
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });

    const verifyData = await verifyRes.json();
    const verifyStatus = Boolean(verifyData?.status);
    const paymentStatus = String(verifyData?.data?.status || "");
    if (!verifyStatus || paymentStatus !== "success") {
      res.status(400).json({ success: false, error: "Payment verification failed" });
      return;
    }

    const finalized = await finalizeVerifiedPayment(reference, verifyData);
    if (!finalized.ok) {
      res.status(finalized.status).json({ success: false, error: finalized.error });
      return;
    }

    res.json({ success: true, orderId: finalized.orderId });
  } catch (error) {
    const message = (error as Error).message;
    console.error("[/api/paystack/verify] verify error:", error);
    const statusCode =
      message.includes("Insufficient stock") ||
        message.includes("Product no longer exists") ||
        message.includes("Order no longer exists") ||
        message.includes("Order is not payable") ||
        message.includes("Invalid order item")
        ? 409
        : 500;
    res.status(statusCode).json({
      success: false,
      error: message || "Payment verification failed due to an unexpected server error.",
    });
  }
});

app.post("/api/paystack/webhook", async (req, res) => {
  try {
    if (!verifyPaystackSignature(req)) {
      res.status(401).json({ success: false, error: "Invalid webhook signature" });
      return;
    }

    const event = req.body as { event?: string; data?: Record<string, unknown> };
    if (event.event !== "charge.success") {
      res.status(200).json({ success: true, ignored: true });
      return;
    }

    const reference = String(event.data?.reference || "").trim();
    if (!reference) {
      res.status(400).json({ success: false, error: "Missing payment reference" });
      return;
    }

    const finalized = await finalizeVerifiedPayment(reference, req.body as Record<string, any>);
    if (!finalized.ok) {
      res.status(finalized.status).json({ success: false, error: finalized.error });
      return;
    }

    res.status(200).json({ success: true, orderId: finalized.orderId });
  } catch (error) {
    console.error("[/api/paystack/webhook] error:", error);
    res.status(500).json({ success: false, error: "Webhook processing failed" });
  }
});

// Debug endpoint to check Vercel production health and Firebase initialization
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/admin/settings", async (req, res) => {
  try {
    await requireAdmin(req);
    const docRef = getAdminDb().collection("settings").doc("store");
    const snap = await docRef.get();
    if (!snap.exists) {
      await docRef.set({ ...defaultStoreSettings });
      res.json({ item: defaultStoreSettings });
      return;
    }

    res.json({ item: serializeStoreSettings(snap.data() as Record<string, unknown>) });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

app.put("/api/admin/settings", async (req, res) => {
  try {
    await requireAdmin(req);
    const serialized = serializeStoreSettings(req.body as Record<string, unknown>);
    await getAdminDb().collection("settings").doc("store").set(
      {
        ...serialized,
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    res.json({ success: true });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

app.post("/api/admin/upload", async (req, res) => {
  try {
    await requireAdmin(req);
    const { image } = req.body as { image?: string };
    if (!image) {
      res.status(400).json({ error: "No image provided" });
      return;
    }
    const result = await cloudinary.uploader.upload(image, { folder: "omoola_supermarket_stores_products" });
    res.json({ url: result.secure_url, publicId: result.public_id });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/admin/orders", async (req, res) => {
  try {
    await requireAdmin(req);
    const snapshot = await getAdminDb().collection("orders").get();
    const items = snapshot.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) }))
      .sort(
        (a, b) =>
          new Date(String((b as Record<string, unknown>).createdAt || 0)).getTime() -
          new Date(String((a as Record<string, unknown>).createdAt || 0)).getTime(),
      );
    res.json({ items });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

app.get("/api/admin/orders/:id", async (req, res) => {
  try {
    await requireAdmin(req);
    const orderRef = getAdminDb().collection("orders").doc(String(req.params.id));
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const statusEventsSnap = await orderRef.collection("statusEvents").get();
    res.json({
      order: { id: orderDoc.id, ...(orderDoc.data() as Record<string, unknown>) },
      events: normalizeStatusEvents(statusEventsSnap),
    });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

app.patch("/api/admin/orders/:id/status", async (req, res) => {
  try {
    await requireAdmin(req);
    const parsed = statusUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid status update payload" });
      return;
    }

    const orderRef = getAdminDb().collection("orders").doc(String(req.params.id));
    const orderDoc = await orderRef.get();
    if (!orderDoc.exists) {
      res.status(404).json({ error: "Order not found" });
      return;
    }

    const now = new Date().toISOString();
    await orderRef.update({
      status: parsed.data.status,
      updatedAt: now,
    });
    await orderRef.collection("statusEvents").add({
      status: parsed.data.status,
      note: parsed.data.note?.trim() || `Order status updated to ${parsed.data.status} by admin`,
      createdAt: now,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

app.get("/api/admin/dashboard", async (req, res) => {
  try {
    await requireAdmin(req);

    const [ordersSnap, lowStockSnap, topSellingSnap] = await Promise.all([
      getAdminDb().collection("orders").get(),
      getAdminDb().collection("products").where("stockQty", "<=", 5).limit(10).get(),
      getAdminDb().collection("products").where("bestSeller", "==", true).limit(5).get(),
    ]);

    const allOrders = ordersSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as Order));
    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter((order) => order.status === "pending").length;
    const totalSales = allOrders
      .filter((order) => order.payment?.status === "paid" || order.status === "delivered")
      .reduce((sum, order) => sum + (order.total || 0), 0);
    const recentOrders = [...allOrders]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);
    const lowStockProducts = lowStockSnap.docs.map((doc) => serializeProduct(doc.id, doc.data() as Record<string, unknown>));
    const topSellingProducts = topSellingSnap.docs.map((doc) => serializeProduct(doc.id, doc.data() as Record<string, unknown>));

    res.json({
      totalOrders,
      pendingOrders,
      totalSales,
      recentOrders,
      lowStockProducts,
      topSellingProducts,
    });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    await requireAdmin(req);

    const [usersSnap, ordersSnap] = await Promise.all([
      getAdminDb().collection("users").get(),
      getAdminDb().collection("orders").orderBy("createdAt", "desc").get(),
    ]);

    const users = usersSnap.docs.map((doc) => ({ uid: doc.id, ...(doc.data() as Record<string, unknown>) }));
    const orders = ordersSnap.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Record<string, unknown>) } as Order));

    const items = users
      .map((user) => {
        const userOrders = orders.filter(
          (order) => order.userId === user.uid || (user.email && order.customer?.email === user.email),
        );
        return {
          ...user,
          totalOrders: userOrders.length,
          totalSpent: userOrders.reduce((sum, order) => sum + (order.total || 0), 0),
          lastOrderDate: userOrders[0]?.createdAt,
        };
      })
      .sort((a, b) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (a.role !== "admin" && b.role === "admin") return 1;
        return Number(b.totalSpent || 0) - Number(a.totalSpent || 0);
      });

    res.json({ items });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

app.get("/api/admin/products", async (req, res) => {
  try {
    await requireAdmin(req);
    const snapshot = await getAdminDb().collection("products").get();
    const items = snapshot.docs.map((doc) => serializeProduct(doc.id, doc.data() as Record<string, unknown>));
    res.json({ items });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});

export default app;
