import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useCart } from "@/components/providers/cart-provider";
import { fetchPublicSettings } from "@/lib/supabase-data";
import { formatCurrency } from "@/lib/query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BUSINESS } from "@/lib/constants";

const checkoutSchema = z.object({
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(10, "Full address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  orderNotes: z.string().optional(),
});

type CheckoutValues = z.infer<typeof checkoutSchema>;

function normalizeWhatsAppNumber(value: string) {
  return value.replace(/[^\d]/g, "");
}

function formatNaira(value: number) {
  return `NGN ${value.toLocaleString()}`;
}

function createOrderNumber() {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `MLX-${ts}-${rand}`;
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, subtotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [whatsappNumber, setWhatsappNumber] = useState(BUSINESS.whatsapp);
  const { register, handleSubmit, formState: { errors } } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
  });

  // Load store settings for delivery fee and WhatsApp number
  useEffect(() => {
    fetchPublicSettings().then((settings) => {
      if (settings.deliveryFee) setDeliveryFee(settings.deliveryFee);
      if (settings.whatsapp) setWhatsappNumber(normalizeWhatsAppNumber(settings.whatsapp));
    });
  }, []);

  useEffect(() => {
    if (items.length === 0 && !isProcessing) {
      navigate("/shop");
    }
  }, [items, navigate, isProcessing]);

  if (items.length === 0 && !isProcessing) return null;

  const total = subtotal + deliveryFee;

  const onSubmit = (data: CheckoutValues) => {
    setIsProcessing(true);
    try {
      if (items.length === 0) {
        throw new Error("Your cart is empty.");
      }

      const orderNumber = createOrderNumber();
      const customerName = `${data.firstName} ${data.lastName}`;

      const orderLines = items.map(
        (item, index) => `${index + 1}. ${item.name}\n   Qty: ${item.qty}\n   Price: ${formatNaira(item.price)}`,
      );

      const text = [
        "*NEW ORDER REQUEST*",
        "",
        `Order No: ${orderNumber}`,
        `Customer: ${customerName}`,
        `Phone: ${data.phone}`,
        `Email: ${data.email}`,
        "",
        "*ITEMS*",
        ...orderLines,
        "",
        "*ORDER SUMMARY*",
        `Subtotal: ${formatNaira(subtotal)}`,
        `Delivery Fee: ${formatNaira(deliveryFee)}`,
        `Total: ${formatNaira(total)}`,
        "",
        "*DELIVERY ADDRESS*",
        data.address,
        `${data.city}, ${data.state}`,
        data.orderNotes ? `Notes: ${data.orderNotes}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

      clearCart();
      window.location.href = whatsappUrl;
    } catch (err) {
      toast.error((err as Error).message || "A checkout error occurred.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-[#F4F4F4] pb-24">
      <div className="border-b border-zinc-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center gap-2">
            <h1 className="text-4xl font-black uppercase tracking-widest text-zinc-900">CHECKOUT</h1>
            <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              <Link to="/" className="hover:text-[#7C3AED]">HOME</Link>
              <ChevronRight className="mx-2 h-3 w-3" />
              <span className="text-zinc-900">CHECKOUT</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <h3 className="mb-4 text-xl font-bold uppercase tracking-widest text-zinc-900">Billing Details</h3>
            <div className="mb-8 h-[2px] w-[50px] bg-[#7C3AED]" />

            <div className="space-y-6 border border-zinc-200 bg-white p-8 shadow-sm">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-700">First Name *</label>
                  <Input {...register("firstName")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#7C3AED]" />
                  {errors.firstName && <p className="text-xs text-red-500">{errors.firstName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-700">Last Name *</label>
                  <Input {...register("lastName")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#7C3AED]" />
                  {errors.lastName && <p className="text-xs text-red-500">{errors.lastName.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-700">Phone *</label>
                <Input {...register("phone")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#7C3AED]" />
                {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-700">Email Address *</label>
                <Input {...register("email")} type="email" className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#7C3AED]" />
                {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[12px] font-bold text-zinc-700">Street Address *</label>
                <Input {...register("address")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#7C3AED]" />
                {errors.address && <p className="text-xs text-red-500">{errors.address.message}</p>}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-700">Town / City *</label>
                  <Input {...register("city")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#7C3AED]" />
                  {errors.city && <p className="text-xs text-red-500">{errors.city.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[12px] font-bold text-zinc-700">State *</label>
                  <Input {...register("state")} className="h-12 rounded-none border-zinc-300 text-[13px] focus-visible:ring-[#7C3AED]" />
                  {errors.state && <p className="text-xs text-red-500">{errors.state.message}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="sticky top-24 border border-zinc-200 border-t-[3px] border-t-[#7C3AED] bg-white p-8 shadow-sm">
              <h3 className="mb-6 text-xl font-bold uppercase tracking-widest text-zinc-900">Your Order</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-2 text-[12px] font-bold uppercase tracking-widest text-zinc-900">
                  <span>Product</span><span>Total</span>
                </div>
                <div className="space-y-4 py-2">
                  {items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><span className="text-[13px] text-zinc-600">{item.name}</span><span className="text-xs font-bold text-zinc-900">x {item.qty}</span></div>
                      <span className="border-l border-zinc-100 pl-4 text-[14px] font-semibold text-zinc-900">{formatCurrency(item.price * item.qty)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between border-t border-zinc-200 py-4 text-[12px] font-bold uppercase tracking-widest text-zinc-900">
                  <span>Subtotal</span><span className="text-[15px]">{formatCurrency(subtotal)}</span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex items-center justify-between py-2 text-[12px] font-bold uppercase tracking-widest text-zinc-900">
                    <span>Delivery Fee</span><span className="text-[15px]">{formatCurrency(deliveryFee)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-4 text-xl font-bold uppercase tracking-widest text-zinc-900">
                  <span>Total</span><span className="text-[#7C3AED]">{formatCurrency(total)}</span>
                </div>
              </div>
              <Button type="submit" disabled={isProcessing} className="mt-6 h-14 w-full rounded-none bg-[#222222] text-[13px] font-bold uppercase tracking-[0.1em] text-white hover:bg-[#7C3AED]">
                {isProcessing ? "Preparing WhatsApp..." : "Order via WhatsApp"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
