import { Menu, LogOut, User } from 'lucide-react';
import { signOut } from '@/services/auth';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const user = useAuthStore(s => s.user);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="lg:hidden" /> {/* spacer */}

      <div className="flex items-center gap-3 ml-auto">
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span className="truncate max-w-[180px]">{user?.email}</span>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm font-medium text-destructive hover:bg-destructive/10 px-3 py-2 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:block">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
