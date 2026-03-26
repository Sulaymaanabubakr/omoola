import { supabase } from "@/lib/supabase";
import { defaultStoreSettings, serializeStoreSettings } from "@/lib/settings-serialization";
import { mapDbProduct, mapProductToDb } from "@/lib/firestore";
import type { Category, Order, Product, StatusEvent, StoreSettings } from "@/types";

// ─── Dashboard ───────────────────────────────────────────────────────────────

export async function fetchAdminDashboardStats() {
    try {
        const [ordersRes, lowStockRes, bestSellerRes] = await Promise.all([
            supabase.from("orders").select("*"),
            supabase.from("products").select("*").lte("stock_qty", 5).limit(10),
            supabase.from("products").select("*").eq("best_seller", true).limit(5),
        ]);

        const allOrders = (ordersRes.data || []) as any[];
        const totalOrders = allOrders.length;
        const pendingOrders = allOrders.filter(o => o.status === "pending").length;
        const totalSales = allOrders
            .filter(o => o.payment_status === "paid" || o.status === "delivered")
            .reduce((sum, o) => sum + (Number(o.total) || 0), 0);

        const recentOrders = allOrders
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 10)
            .map(mapDbOrder);

        return {
            totalOrders,
            pendingOrders,
            totalSales,
            recentOrders,
            lowStockProducts: (lowStockRes.data || []).map(mapDbProduct),
            topSellingProducts: (bestSellerRes.data || []).map(mapDbProduct),
        };
    } catch (err) {
        console.error("Error fetching admin stats:", err);
        return null;
    }
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function fetchAdminOrders(): Promise<Order[]> {
    const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) { console.error(error); return []; }
    return (data || []).map(mapDbOrder);
}

export async function fetchAdminOrderById(orderId: string): Promise<{ order: Order; events: StatusEvent[] } | null> {
    const [orderRes, eventsRes] = await Promise.all([
        supabase.from("orders").select("*").eq("id", orderId).single(),
        supabase.from("order_status_events").select("*").eq("order_id", orderId).order("created_at", { ascending: true }),
    ]);

    if (orderRes.error || !orderRes.data) return null;

    return {
        order: mapDbOrder(orderRes.data),
        events: (eventsRes.data || []).map(e => ({
            status: e.status,
            note: e.note,
            createdAt: e.created_at,
        } as StatusEvent)),
    };
}

export async function updateAdminOrderStatus(orderId: string, status: string, note?: string): Promise<boolean> {
    const now = new Date().toISOString();

    const [updateRes, insertRes] = await Promise.all([
        supabase.from("orders").update({ status, updated_at: now }).eq("id", orderId),
        supabase.from("order_status_events").insert({
            order_id: orderId,
            status,
            note: note || `Order status updated to ${status} by admin`,
            created_at: now,
        }),
    ]);

    if (updateRes.error || insertRes.error) {
        console.error(updateRes.error || insertRes.error);
        return false;
    }
    return true;
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function fetchAdminProducts(): Promise<Product[]> {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) { console.error(error); return []; }
    return (data || []).map(mapDbProduct);
}

export async function deleteAdminProduct(productId: string): Promise<boolean> {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    return !error;
}

export async function toggleProductStatus(productId: string, currentStatus: boolean) {
    const { error } = await supabase.from("products").update({ is_active: !currentStatus }).eq("id", productId);
    return !error;
}

export async function saveAdminProduct(product: Partial<Product> & { id?: string }, isNew: boolean): Promise<string | null> {
    const now = new Date().toISOString();
    const dbRow = { ...mapProductToDb(product), updated_at: now };

    if (isNew) {
        dbRow.created_at = now;
        const { data, error } = await supabase.from("products").insert(dbRow).select("id").single();
        if (error) { console.error(error); return null; }
        return data?.id || null;
    } else if (product.id) {
        const { error } = await supabase.from("products").update(dbRow).eq("id", product.id);
        if (error) { console.error(error); return null; }
        return product.id;
    }
    return null;
}

export async function updateProductStock(productId: string, stockQty: number): Promise<boolean> {
    const { error } = await supabase
        .from("products")
        .update({ stock_qty: stockQty, updated_at: new Date().toISOString() })
        .eq("id", productId);
    return !error;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export async function fetchAdminCategories(): Promise<Category[]> {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (error) { console.error(error); return []; }
    return (data || []).map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        imageUrl: row.image_url,
        createdAt: row.created_at,
    } as Category));
}

export async function saveAdminCategory(category: Partial<Category>): Promise<boolean> {
    const row: Record<string, any> = {
        name: category.name,
        slug: category.slug,
        description: category.description || null,
        image_url: category.imageUrl || null,
    };

    if (category.id) {
        const { error } = await supabase.from("categories").update(row).eq("id", category.id);
        return !error;
    } else {
        row.created_at = new Date().toISOString();
        const { error } = await supabase.from("categories").insert(row);
        return !error;
    }
}

export async function deleteAdminCategory(categoryId: string): Promise<boolean> {
    const { error } = await supabase.from("categories").delete().eq("id", categoryId);
    return !error;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function fetchAdminSettings(): Promise<StoreSettings> {
    const { data, error } = await supabase.from("settings").select("*").eq("id", "store").single();
    if (error || !data) return defaultStoreSettings;

    return serializeStoreSettings({
        storeName: data.store_name,
        logoUrl: data.logo_url,
        storeAddress: data.store_address,
        phone: data.phone,
        email: data.email,
        whatsapp: data.whatsapp,
        heroImages: data.hero_images,
        deliveryFee: data.delivery_fee,
        announcementEnabled: data.announcement_enabled,
        announcementText: data.announcement_text,
        announcementSpeed: data.announcement_speed,
        updatedAt: data.updated_at,
    });
}

export async function saveAdminSettings(settings: Partial<StoreSettings>): Promise<boolean> {
    const row = {
        id: "store",
        store_name: settings.storeName,
        logo_url: settings.logoUrl,
        store_address: settings.storeAddress,
        phone: settings.phone,
        email: settings.email,
        whatsapp: settings.whatsapp,
        hero_images: settings.heroImages,
        delivery_fee: settings.deliveryFee,
        announcement_enabled: settings.announcementEnabled,
        announcement_text: settings.announcementText,
        announcement_speed: settings.announcementSpeed,
        updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("settings").upsert(row, { onConflict: "id" });
    return !error;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export async function fetchAdminUsers() {
    const [usersRes, ordersRes] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
    ]);

    const users = (usersRes.data || []) as any[];
    const orders = (ordersRes.data || []).map(mapDbOrder);

    return users
        .map(user => {
            const userOrders = orders.filter(
                order => order.userId === user.id || (user.email && order.customer?.email === user.email),
            );
            return {
                uid: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                createdAt: user.created_at,
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
}

// ─── Image Upload (Cloudinary client-side) ───────────────────────────────────

export async function uploadImageToCloudinary(file: File): Promise<{ url: string; publicId: string }> {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "omoola_unsigned";

    if (!cloudName) throw new Error("Cloudinary cloud name not configured");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "omoola_supermarket_stores_products");

    const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
    });

    if (!res.ok) throw new Error("Image upload failed");
    const data = await res.json();
    return { url: data.secure_url, publicId: data.public_id };
}

// ─── Private Helpers ─────────────────────────────────────────────────────────

function mapDbOrder(row: Record<string, any>): Order {
    return {
        id: row.id,
        orderNumber: row.order_number || "",
        userId: row.user_id,
        customer: row.customer || {},
        items: row.items || [],
        subtotal: Number(row.subtotal) || 0,
        deliveryFee: Number(row.delivery_fee) || 0,
        total: Number(row.total) || 0,
        shippingAddress: row.shipping_address || {},
        payment: {
            provider: row.payment_provider || "whatsapp",
            reference: row.payment_reference || "",
            status: row.payment_status || "pending",
            paidAt: row.paid_at,
        },
        status: row.status || "pending",
        createdAt: row.created_at || "",
        updatedAt: row.updated_at || "",
    };
}
