import "dotenv/config";
import { getAdminDb } from "../src/lib/firebase/admin";
import { BUSINESS, CATEGORIES_SEED } from "../src/lib/constants";

async function run() {
  const db = getAdminDb();

  for (const category of CATEGORIES_SEED) {
    const existing = await db.collection("categories").where("slug", "==", category.slug).limit(1).get();
    if (!existing.empty) continue;

    const ref = db.collection("categories").doc();
    await ref.set({
      id: ref.id,
      ...category,
      createdAt: new Date().toISOString(),
    });
  }

  await db.collection("settings").doc("store").set(
    {
      storeName: BUSINESS.name,
      storeAddress: BUSINESS.address,
      phone: BUSINESS.phone,
      email: BUSINESS.email,
      whatsapp: BUSINESS.whatsapp,
      deliveryFee: 2000,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  console.log("Categories and settings seeded.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
