import * as dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase environment variables.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const templates = [
    // Shoes (15 items)
    ...Array.from({ length: 15 }).map((_, i) => ({
        name: `Premium Leather Sneaker Vol ${i + 1}`, categoryId: "shoes", categoryName: "Shoes", price: 15000 + (i * 1000)
    })),
    // Clothes (15 items)
    ...Array.from({ length: 15 }).map((_, i) => ({
        name: `Ankara Print Dress Design ${String.fromCharCode(65 + i)}`, categoryId: "clothing", categoryName: "Clothing", price: 8000 + (i * 500)
    })),
    // Hand/Body Creams (5 items)
    { name: "Shea Butter Body Cream", categoryId: "beauty", categoryName: "Health & Beauty", price: 3500 },
    { name: "Cocoa Butter Hand Lotion", categoryId: "beauty", categoryName: "Health & Beauty", price: 2800 },
    { name: "Aloe Vera Skin Soothing Gel", categoryId: "beauty", categoryName: "Health & Beauty", price: 4000 },
    { name: "Vitamin C Brightening Lotion", categoryId: "beauty", categoryName: "Health & Beauty", price: 5500 },
    { name: "Organic Coconut Body Oil", categoryId: "beauty", categoryName: "Health & Beauty", price: 3200 },
    // Body Spray / Hair Spray (5 items)
    { name: "Midnight Musk Body Spray", categoryId: "beauty", categoryName: "Health & Beauty", price: 4500 },
    { name: "Floral Bloom Perfume Mist", categoryId: "beauty", categoryName: "Health & Beauty", price: 5000 },
    { name: "Argan Oil Hair Spray", categoryId: "beauty", categoryName: "Health & Beauty", price: 3800 },
    { name: "Ocean Breeze Deodorant", categoryId: "beauty", categoryName: "Health & Beauty", price: 2500 },
    { name: "Edge Control Hair Gel", categoryId: "beauty", categoryName: "Health & Beauty", price: 2000 },
    // Costume Jewelry (10 items)
    ...Array.from({ length: 10 }).map((_, i) => ({
        name: `Gold Plated Chain Style ${i + 1}`, categoryId: "jewelry", categoryName: "Jewelry", price: 5000 + (i * 200)
    })),
    // Food Stuffs (50 items)
    ...[
        "Ofada Rice (Paint)", "Long Grain Parboiled Rice (Bag)", "Basmati Rice (Box)", "Local Brown Rice", "Foreign White Rice",
        "Honey Beans (Oloyin) - Paint", "Iron Beans - Paint", "White Beans - Paint", "Brown Beans", "Pigeon Pea (Fio Fio)",
        "Ijebu Garri (Paint)", "White Garri (Paint)", "Yellow Garri", "Cassava Flakes (Abacha) Large", "Cassava Flakes Small",
        "Grinded Ogbono (Derica)", "Whole Ogbono Seeds", "Grinded Egusi (Derica)", "Whole Egusi Seeds", "Peeled Egusi",
        "Grinded Dry Pepper (Jar)", "Cameroon Pepper", "Whole Dry Pepper", "Scotch Bonnet Powder", "Cayenne Pepper Mix",
        "Dry Catfish (Large)", "Smoked Round Fish", "Stockfish (Okporoko) Cuts", "Stockfish Head", "Smoked Mangala Fish",
        "Crayfish (Blended - Derica)", "Whole Crayfish", "Dry Prawns", "Smoked Shrimps", "Bonga Fish",
        "Yam Flour (Elubo) - Paint", "Plantain Flour", "Wheat Flour", "Bambara Nut Flour (Okpa)", "Bean Flour (Akara mix)",
        "Red Palm Oil (4 Litres)", "Vegetable Oil (4 Litres)", "Groundnut Oil", "Soya Oil", "Coconut Oil (Cooking)",
        "Curry Powder & Thyme Set", "Suya Spice Mix (Yaji)", "Mixed Herbs Seasoning", "Ginger & Garlic Paste", "Chicken Seasoning Cubes",
    ].map(name => ({
        name, categoryId: "food", categoryName: "Groceries & Food", price: 1500 + Math.floor(Math.random() * 8000)
    }))
];

async function fetchRealImages() {
    type DJResponse = { products: { category: string; thumbnail: string; images: string[] }[] };
    try {
        // Use a different API or just fallback if dummyjson is down but here we use it
        const res = await fetch('https://dummyjson.com/products?limit=150');
        const data = (await res.json()) as DJResponse;

        const map: Record<string, string[]> = {
            shoes: [],
            clothing: [],
            beauty: [],
            jewelry: [],
            food: []
        };

        const addImg = (cat: string, img: string) => {
            if (map[cat] && !map[cat].includes(img)) map[cat].push(img);
        };

        data.products.forEach(p => {
            const img = p.images?.[0] || p.thumbnail;
            if (!img) return;

            if (p.category === 'mens-shoes' || p.category === 'womens-shoes') addImg('shoes', img);
            else if (p.category === 'mens-shirts' || p.category === 'tops' || p.category === 'womens-dresses') addImg('clothing', img);
            else if (p.category === 'beauty' || p.category === 'skin-care' || p.category === 'fragrances') addImg('beauty', img);
            else if (p.category === 'womens-jewellery') addImg('jewelry', img);
            else if (p.category === 'groceries') addImg('food', img);
        });

        return map;
    } catch {
        return null;
    }
}

async function seed100() {
    console.log(`Starting 100-product seed process for Supabase...`);

    console.log("Fetching realistic images from dummyjson...");
    const realImages = await fetchRealImages();
    if (!realImages) {
        console.error("Failed to fetch realistic images. Ensure you have internet access.");
        process.exit(1);
    }

    const trackers: Record<string, number> = { shoes: 0, clothing: 0, beauty: 0, jewelry: 0, food: 0 };

    const getImgFor = (catId: string, itemIdx: number) => {
        const pool = realImages[catId] || [];
        if (pool.length === 0) return `https://loremflickr.com/600/600/${catId}?lock=${itemIdx}`;
        const idx = (trackers[catId]++) % pool.length;
        return pool[idx];
    };

    console.log("Cleaning up old products...");
    const { error: deleteError } = await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (deleteError) {
        console.error("Failed to delete old products:", deleteError);
    } else {
        console.log("Old products cleared.");
    }

    const rows = [];
    let count = 0;

    for (let i = 0; i < templates.length; i++) {
        const item = templates[i];
        const sku = `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        const slug = generateSlug(item.name) + "-" + Math.random().toString(36).substring(2, 6);

        rows.push({
            name: item.name,
            slug: slug,
            description: `Premium quality ${item.name} sourced directly for Omoola Pharmacy & Stores. Authentic and top grade.`,
            price: item.price,
            category_id: item.categoryId,
            category_name: item.categoryName,
            tags: [item.categoryId, item.categoryName.toLowerCase().split(' ')[0]],
            featured: count < 10,
            best_seller: count >= 10 && count < 25,
            new_arrival: count >= 25 && count < 40,
            images: [
                {
                    url: getImgFor(item.categoryId, count),
                    publicId: `seed_${slug}`,
                    alt: item.name
                }
            ],
            stock_qty: 50 + Math.floor(Math.random() * 100),
            sku: sku,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

        count++;
    }

    // Insert in chunks of 50
    for (let i = 0; i < rows.length; i += 50) {
        const chunk = rows.slice(i, i + 50);
        const { error } = await supabase.from('products').insert(chunk);
        if (error) {
            console.error("Error inserting batch:", error);
        } else {
            console.log(`Inserted batch ${i / 50 + 1}`);
        }
    }

    console.log(`Successfully seeded ${count} distinct real items to Supabase!`);
    process.exit(0);
}

seed100().catch(err => {
    console.error(err);
    process.exit(1);
});
