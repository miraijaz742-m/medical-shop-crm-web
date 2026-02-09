import { useNavigate, NavLink, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    Package,
    ReceiptIndianRupee,
    Users,
    Wallet,
    Settings as SettingsIcon,
    LogOut,
    Stethoscope
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthContext';

const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Billing', path: '/billing', icon: ReceiptIndianRupee },
    { name: 'Inventory', path: '/inventory', icon: Package },
    { name: 'Customers', path: '/customers', icon: Users },
    { name: 'Expenses', path: '/expenses', icon: Wallet },
    { name: 'Settings', path: '/settings', icon: SettingsIcon },
];

export default function Layout() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    return (
        <div className="flex flex-col md:flex-row h-screen bg-transparent overflow-hidden">
            {/* Sidebar - Desktop Only */}
            <aside className="hidden md:flex w-20 m-4 mr-0 flex-col glass-panel rounded-[2rem] shadow-2xl shadow-slate-200/50 relative overflow-hidden group">
                {/* Decorative background glow */}
                <div className="absolute -top-32 -left-32 w-64 h-64 bg-[hsl(var(--primary))]/10 rounded-full blur-[80px] pointer-events-none" />

                <div className="p-4 relative flex justify-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--primary))]/80 rounded-2xl flex items-center justify-center text-[hsl(var(--primary-foreground))] shadow-lg shadow-[hsl(var(--primary))]/30 transition-transform hover:rotate-12 duration-300">
                        <Stethoscope className="w-7 h-7" />
                    </div>
                </div>

                <nav className="flex-1 px-2 space-y-2 overflow-y-auto relative py-2 custom-scrollbar">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            title={item.name}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center justify-center w-full h-12 rounded-2xl text-sm font-bold transition-all duration-300 group/link",
                                    isActive
                                        ? "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-xl shadow-[hsl(var(--primary))]/25 scale-[1.02]"
                                        : "text-slate-500 hover:bg-white/60 hover:text-slate-900 hover:scale-105"
                                )
                            }
                        >
                            <item.icon className={cn("h-5 w-5 transition-transform duration-300 group-hover/link:scale-110")} />
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 relative flex flex-col gap-3 items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[hsl(var(--primary))] font-black shadow-lg relative">
                        <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] shadow-[0_0_8px_hsl(var(--primary))] absolute -top-0.5 -right-0.5" />
                        {user?.email?.[0].toUpperCase() || 'A'}
                    </div>
                    <button
                        title="Sign Out"
                        onClick={handleLogout}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all active:scale-90"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </aside>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-6 left-6 right-6 z-50 glass-panel rounded-3xl shadow-2xl p-2 flex justify-between items-center border border-white/40">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                            cn(
                                "flex flex-col items-center justify-center flex-1 h-12 rounded-2xl transition-all duration-300",
                                isActive
                                    ? "bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary))]/30 scale-105"
                                    : "text-slate-400"
                            )
                        }
                    >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[8px] font-black uppercase mt-1 tracking-widest">{item.name}</span>
                    </NavLink>
                ))}
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center justify-center flex-1 h-12 text-slate-400"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="text-[8px] font-black uppercase mt-1 tracking-widest">Exit</span>
                </button>
            </nav>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto relative custom-scrollbar pb-24 md:pb-0">
                <header className="sticky top-0 z-40 bg-white/60 backdrop-blur-xl border-b border-white/40 px-4 md:px-10 py-5 flex items-center justify-between">
                    <div className="flex flex-col">
                        <h2 className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Current Workspace</h2>
                        <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight">Medical Shop CRM</h3>
                    </div>
                    <div className="flex items-center gap-3 md:gap-6">
                        <NavLink to="/subscription" className="hidden sm:block">
                            <button className="px-3 md:px-4 py-2 bg-[hsl(var(--primary))] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[hsl(var(--primary))]/20 hover:opacity-90 transition-all active:scale-95">
                                Upgrade Plan
                            </button>
                        </NavLink>
                        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/10 rounded-full text-[8px] md:text-[10px] font-black text-[hsl(var(--primary))] uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-[hsl(var(--primary))] animate-pulse shadow-[0_0_8px_hsl(var(--primary))]" />
                            <span className="hidden xs:inline">Live Cloud Sync</span>
                            <span className="xs:hidden">Sync</span>
                        </div>
                    </div>
                </header>
                <div className="p-4 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
