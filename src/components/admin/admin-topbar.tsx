import { Link } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { BUSINESS } from "@/lib/constants";
import { usePublicStoreSettings } from "@/hooks/use-public-store-settings";

interface AdminTopbarProps {
    onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
    const { user, logout } = useAuth();
    const settings = usePublicStoreSettings();
    const storeName = settings.storeName || BUSINESS.name;

    return (
        <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b bg-background px-4 shadow-sm sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
                    <Menu className="h-6 w-6" />
                </Button>
                <Link to="/admin" className="font-semibold md:text-lg">
                    {storeName} Admin
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden text-sm md:block">
                    <span className="text-muted-foreground mr-1">Logged in as:</span>
                    <span className="font-medium">{user?.email}</span>
                </div>
                <Button variant="outline" size="sm" onClick={logout} className="gap-2">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                </Button>
            </div>
        </header>
    );
}
