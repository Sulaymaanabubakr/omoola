import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CheckoutVerifyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-[#F4F4F4] px-4 py-16">
      <div className="w-full max-w-md border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <div className="flex flex-col items-center justify-center py-8">
          <CheckCircle2 className="mb-4 h-16 w-16 text-green-600" />
          <h2 className="text-xl font-bold uppercase tracking-widest text-zinc-900">Order Created</h2>
          <p className="mt-2 text-[13px] text-zinc-600">
            Orders are now completed through WhatsApp chat with the store.
          </p>
          <Button asChild className="mt-8 h-12 rounded-none bg-[#222222] px-8 text-[12px] font-bold uppercase tracking-widest text-white hover:bg-[#0F766E]">
            <Link to="/account">View My Orders</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
