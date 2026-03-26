/**
 * Client-side Supabase data service.
 * All public data reads go here — no API server round-trip required.
 */

import { supabase } from "@/lib/supabase";
import { defaultStoreSettings, serializeStoreSettings } from "@/lib/settings-serialization";
import type { Order, Product, StatusEvent, StoreSettings } from "@/types";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ProductFilters {
    q?: string;
    category?: string;
    slug?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
}

export interface ProductsResult {
    items: Product[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
    };
}

// ─── Products ────────────────────────────────────────────────────────────────

export async function fetchProducts(filters: ProductFilters = {}): Promise<ProductsResult> {
    const { q = "", category = "", slug = "", sort = "new", page = 1, pageSize = 12 } = filters;

    let query = supabase.from("products").select("*").eq("is_active", true);

    if (slug) query = query.eq("slug", slug);
    if (category && category !== "all") {
        query = query.or(`category_id.eq.${category},category_name.eq.${category}`);
    }
    if (q) {
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }

    // Sorting
    if (sort === "price-asc") query = query.order("price", { ascending: true });
    else if (sort === "price-desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;
    if (error) {
        console.error("Error fetching products:", error);
        return { items: [], pagination: { page: 1, pageSize: 12, total: 0, totalPages: 1 } };
    }

    const products = (data || []).map(mapDbProduct);

    // Client-side best seller sort if needed
    let sorted = products;
    if (sort === "best") {
        sorted = [...products].sort((a, b) => Number(Boolean(b.bestSeller)) - Number(Boolean(a.bestSeller)));
    }

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 12;
    const total = sorted.length;
    const start = (safePage - 1) * safePageSize;

    return {
        items: sorted.slice(start, start + safePageSize),
        pagination: {
            page: safePage,
            pageSize: safePageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / safePageSize)),
        },
    };
}

// ─── Settings ────────────────────────────────────────────────────────────────

export async function fetchPublicSettings(): Promise<StoreSettings> {
    try {
        const { data, error } = await supabase
            .from("settings")
            .select("*")
            .eq("id", "store")
            .single();

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
    } catch {
        return defaultStoreSettings;
    }
}

// ─── Contact / Newsletter ─────────────────────────────────────────────────────

export async function submitContactForm(data: {
    name: string;
    email: string;
    subject?: string;
    message: string;
}): Promise<void> {
    const { error } = await supabase.from("contact_messages").insert({
        name: data.name,
        email: data.email,
        subject: data.subject || null,
        message: data.message,
        created_at: new Date().toISOString(),
    });
    if (error) throw new Error("Failed to submit contact form");
}

export async function subscribeNewsletter(email: string): Promise<void> {
    const { error } = await supabase.from("newsletter_subscribers").upsert(
        { email, updated_at: new Date().toISOString() },
        { onConflict: "email" },
    );
    if (error) throw new Error("Failed to subscribe");
}

// ─── DB → App Mapping Helpers ────────────────────────────────────────────────

/** Map a Supabase DB product row (snake_case) to an app Product (camelCase) */
export function mapDbProduct(row: Record<string, any>): Product {
    return {
        id: row.id,
        name: row.name || "",
        slug: row.slug || "",
        description: row.description || "",
        price: Number(row.price) || 0,
        compareAtPrice: row.compare_at_price != null ? Number(row.compare_at_price) : undefined,
        categoryId: row.category_id || "",
        categoryName: row.category_name || "",
        tags: Array.isArray(row.tags) ? row.tags : [],
        featured: Boolean(row.featured),
        bestSeller: Boolean(row.best_seller),
        newArrival: Boolean(row.new_arrival),
        images: Array.isArray(row.images) ? row.images : [],
        stockQty: Math.max(0, Math.floor(Number(row.stock_qty) || 0)),
        sku: row.sku || "",
        isActive: Boolean(row.is_active),
        createdAt: row.created_at || "",
        updatedAt: row.updated_at || "",
    };
}

/** Map an app Product (camelCase) to a Supabase DB row (snake_case) */
export function mapProductToDb(product: Partial<Product>): Record<string, any> {
    const row: Record<string, any> = {};
    if (product.name !== undefined) row.name = product.name;
    if (product.slug !== undefined) row.slug = product.slug;
    if (product.description !== undefined) row.description = product.description;
    if (product.price !== undefined) row.price = product.price;
    if (product.compareAtPrice !== undefined) row.compare_at_price = product.compareAtPrice;
    if (product.categoryId !== undefined) row.category_id = product.categoryId;
    if (product.categoryName !== undefined) row.category_name = product.categoryName;
    if (product.tags !== undefined) row.tags = product.tags;
    if (product.featured !== undefined) row.featured = product.featured;
    if (product.bestSeller !== undefined) row.best_seller = product.bestSeller;
    if (product.newArrival !== undefined) row.new_arrival = product.newArrival;
    if (product.images !== undefined) row.images = product.images;
    if (product.stockQty !== undefined) row.stock_qty = product.stockQty;
    if (product.sku !== undefined) row.sku = product.sku;
    if (product.isActive !== undefined) row.is_active = product.isActive;
    return row;
}
