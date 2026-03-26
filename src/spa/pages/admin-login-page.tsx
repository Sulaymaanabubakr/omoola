import { useState } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminLoginPage() {
    const { user, loading, login, logout } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);

    if (loading) return <div className="flex min-h-screen items-center justify-center bg-zinc-900 text-white">Loading...</div>;

    // Already logged in → go to dashboard
    if (user) return <Navigate to="/admin" replace />;

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await login(email, password);
        } catch (err) {
            toast.error((err as Error).message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900 px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white">Admin</h1>
                    <div className="mx-auto mt-2 h-[2px] w-12 bg-[#7C3AED]" />
                </div>

                <form onSubmit={handleLogin} className="space-y-4 border border-zinc-700 bg-zinc-800 p-8">
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="h-12 rounded-none border-zinc-600 bg-zinc-900 text-sm text-white placeholder:text-zinc-500 focus-visible:ring-[#7C3AED]"
                            placeholder="admin@example.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-zinc-400">Password</label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 rounded-none border-zinc-600 bg-zinc-900 text-sm text-white placeholder:text-zinc-500 focus-visible:ring-[#7C3AED]"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-12 w-full rounded-none bg-[#7C3AED] text-xs font-bold uppercase tracking-widest text-white hover:bg-[#EA580C]"
                    >
                        {isSubmitting ? "Signing in..." : "Sign In"}
                    </Button>
                </form>
            </div>
        </div>
    );
}
