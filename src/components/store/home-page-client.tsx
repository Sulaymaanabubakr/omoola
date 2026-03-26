

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionTitle } from "@/components/store/section-title";
import { ProductCard } from "@/components/store/product-card";
import { fetchCategories, fetchPublicSettings, subscribeNewsletter } from "@/lib/supabase-data";
import { defaultHeroImages } from "@/lib/settings-serialization";
import type { Product, StoreSettings } from "@/types";


export function HomePageClient({
  bestSellers,
  newArrivals,
}: {
  bestSellers: Product[];
  newArrivals: Product[];
}) {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [heroIndex, setHeroIndex] = useState(0);
  const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]);
  const [storeSettings, setStoreSettings] = useState<Pick<StoreSettings, "heroImages">>({
    heroImages: defaultHeroImages,
  });

  const activeHeroImages = storeSettings.heroImages.length ? storeSettings.heroImages : defaultHeroImages;

  useEffect(() => {
    fetchPublicSettings()
      .then((settings) => {
        setStoreSettings({ heroImages: settings.heroImages });
      })
      .catch(() => {
        setStoreSettings({ heroImages: defaultHeroImages });
      });

    fetchCategories()
      .then((data) => setCategories(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setHeroIndex((current) => (current >= activeHeroImages.length ? 0 : current));
  }, [activeHeroImages.length]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % activeHeroImages.length);
    }, 4500);

    return () => window.clearInterval(timer);
  }, [activeHeroImages.length]);

  const submitNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await subscribeNewsletter(newsletterEmail);
      setNewsletterEmail("");
      toast.success("You are now subscribed.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="bg-white">
      <section className="relative flex min-h-[500px] items-center overflow-hidden bg-zinc-900 lg:min-h-[600px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeHeroImages[heroIndex]}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0 z-0"
          >
            <img
              src={activeHeroImages[heroIndex]}
              alt="Omoola Pharmacy & Stores Hero"
              className="h-full w-full object-cover opacity-40"
              loading="eager"
            />
          </motion.div>
        </AnimatePresence>

        <div className="absolute inset-0 z-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

        <div className="container relative z-10 mx-auto grid px-4 py-12 md:grid-cols-2 md:items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center md:text-left"
          >
            <h2 className="text-[12px] font-bold uppercase tracking-[0.3em] text-white drop-shadow-md">
              Welcome to Omoola Pharmacy & Stores
            </h2>
            <h1 className="mt-4 font-sans text-5xl font-black uppercase tracking-tighter text-white drop-shadow-xl sm:text-6xl md:text-7xl lg:text-8xl">
              PREMIUM
              <br />
              <span className="text-[#7C3AED]">SELECTION</span>
            </h1>
            <p className="mx-auto mt-6 max-w-md font-serif text-lg text-zinc-200 drop-shadow-md sm:text-xl md:mx-0">
              Shop quality, live beautifully. Fashion, beauty, foodstuff and everyday essentials from Owode Yewa, Ogun State.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
              <Button asChild className="h-12 rounded-none bg-[#7C3AED] px-10 text-[13px] font-bold uppercase tracking-widest text-white shadow-lg hover:bg-[#EA580C]">
                <Link to="/shop">Shop Now</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-none border-2 border-white bg-transparent px-10 text-[13px] font-bold uppercase tracking-widest text-white shadow-lg transition-colors hover:bg-white hover:text-zinc-900">
                <Link to="/shop">Browse Collections</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="border-b border-zinc-200">
        <div className="container mx-auto flex items-center justify-center gap-1 overflow-x-auto px-4 py-4 no-scrollbar sm:gap-2">
          <span className="mr-2 shrink-0 text-[12px] font-bold uppercase tracking-[0.1em] text-zinc-800">
            FILTER BY:
          </span>
          {categories.map((cat, idx) => (
            <div key={cat.name} className="flex items-center">
              <Link
                to={`/category/${cat.id}`}
                className="shrink-0 px-2 py-1 text-[11px] font-bold uppercase tracking-widest text-zinc-500 transition-colors hover:text-[#7C3AED]"
              >
                {cat.name}
              </Link>
              {idx < categories.length - 1 && <span className="mx-1 text-zinc-300">|</span>}
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:py-24">
        <SectionTitle title="POPULAR PRODUCTS" align="center" viewAllHref="/shop?sort=best" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {bestSellers.length > 0 ? (
            bestSellers.map((p) => <ProductCard key={p.id} product={p} />)
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-zinc-100" />
            ))
          )}
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          <Link to="/shop" className="group relative block overflow-hidden bg-zinc-900 px-10 py-16 sm:py-24">
            <div className="relative z-10 text-center text-white">
              <h3 className="font-serif text-3xl font-bold uppercase sm:text-4xl md:text-5xl">
                EXCLUSIVE
                <br />DEALS
              </h3>
              <p className="mt-4 text-sm uppercase tracking-widest text-zinc-400">Incredible Discounts</p>
              <div className="mt-8 flex justify-center">
                <span className="inline-flex h-12 items-center justify-center border border-white px-8 text-[11px] font-bold uppercase tracking-widest text-white transition-colors group-hover:bg-white group-hover:text-zinc-900">
                  SHOP NOW
                </span>
              </div>
            </div>
          </Link>

          <Link to="/shop" className="group relative block overflow-hidden bg-[#F4F4F4] px-10 py-16 sm:py-24">
            <div className="relative z-10 text-center text-zinc-900">
              <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.2em] text-[#7C3AED]">Top 10+</p>
              <h3 className="font-serif text-3xl font-bold uppercase sm:text-4xl md:text-5xl">
                UNDER <span className="text-[#7C3AED]">₦5K</span>
              </h3>
              <p className="mt-4 text-sm font-medium uppercase tracking-widest text-zinc-500">Selected Essentials</p>
              <div className="mt-8 flex justify-center">
                <span className="inline-flex h-12 items-center justify-center border border-zinc-900 px-8 text-[11px] font-bold uppercase tracking-widest text-zinc-900 transition-colors group-hover:border-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white">
                  SHOP NOW
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 sm:py-24">
        <SectionTitle title="FEATURED ITEMS" align="center" viewAllHref="/shop?sort=new" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4 lg:gap-8">
          {newArrivals.length > 0 ? (
            newArrivals.map((p) => <ProductCard key={p.id} product={p} />)
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] animate-pulse bg-zinc-100" />
            ))
          )}
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-[#F4F4F4]">
        <div className="container mx-auto px-4 py-16 sm:py-20">
          <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-8 md:flex-row">
            <div className="text-center md:text-left">
              <h3 className="text-xl font-black uppercase tracking-widest text-zinc-900">NEWSLETTER</h3>
              <p className="mt-2 text-sm text-zinc-500">
                Get all the latest information on Events, Sales and Offers.
              </p>
            </div>

            <form className="flex w-full max-w-lg shadow-sm" onSubmit={submitNewsletter}>
              <Input
                type="email"
                placeholder="Email address..."
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="h-14 flex-1 rounded-none border-none bg-white px-6 text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0"
                required
              />
              <Button type="submit" className="h-14 rounded-none bg-[#7C3AED] px-8 text-[12px] font-black uppercase tracking-[0.1em] text-white hover:bg-[#EA580C]">
                Submit
              </Button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
