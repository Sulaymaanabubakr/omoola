import { useEffect, useMemo, useState } from "react";
import { HomePageClient } from "@/components/store/home-page-client";
import { fetchProducts } from "@/lib/supabase-data";
import type { Product } from "@/types";

function sortByCreatedAtDesc(a: Product, b: Product) {
  return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
}

function uniqueProducts(products: Product[]) {
  const seen = new Set<string>();
  return products.filter((product) => {
    const key = product.id || product.slug || product.name;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function HomePage() {
  const [items, setItems] = useState<Product[]>([]);

  useEffect(() => {
    fetchProducts({ page: 1, pageSize: 150 })
      .then((data) => setItems(data.items))
      .catch(() => setItems([]));
  }, []);

  const bestSellers = useMemo(
    () => uniqueProducts(items.filter((p) => p.bestSeller)).sort(sortByCreatedAtDesc).slice(0, 4),
    [items],
  );

  const newArrivals = useMemo(
    () =>
      uniqueProducts(
        items.filter((p) => p.newArrival && !bestSellers.some((featured) => featured.id === p.id)),
      )
        .sort(sortByCreatedAtDesc)
        .slice(0, 4),
    [items, bestSellers],
  );

  return <HomePageClient bestSellers={bestSellers} newArrivals={newArrivals} />;
}
