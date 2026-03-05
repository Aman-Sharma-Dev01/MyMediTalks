import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Pencil, LayoutDashboard, Settings, LogOut, MessageCircle, Bell } from 'lucide-react';

export default function AdminLayout() {
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-cream flex font-sans">
            {/* Sidebar */}
            <aside className="w-64 border-r border-primary/10 bg-white shadow-sm flex flex-col">
                <div className="h-20 flex items-center px-6 border-b border-primary/5">
                    <span className="material-symbols-outlined text-xl text-primary mr-2">local_florist</span>
                    <span className="font-display italic text-2xl text-ink">MyMediTalks</span>
                    <span className="text-[10px] ml-2 font-bold uppercase tracking-widest text-primary">Admin</span>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    <NavLink
                        to="/admin"
                        end
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-primary/5 hover:text-ink'}`}
                    >
                        <LayoutDashboard size={18} /> Dashboard
                    </NavLink>
                    <NavLink
                        to="/admin/notifications"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-primary/5 hover:text-ink'}`}
                    >
                        <Bell size={18} /> Notifications
                    </NavLink>
                    <NavLink
                        to="/admin/engagement"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-primary/5 hover:text-ink'}`}
                    >
                        <MessageCircle size={18} /> Engagement
                    </NavLink>
                    <NavLink
                        to="/admin/editor"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-primary/5 hover:text-ink'}`}
                    >
                        <Pencil size={18} /> New Entry
                    </NavLink>
                    <NavLink
                        to="/admin/settings"
                        className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-secondary hover:bg-primary/5 hover:text-ink'}`}
                    >
                        <Settings size={18} /> Settings
                    </NavLink>
                </nav>

                <div className="p-4 border-t border-primary/5">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        <img src={user?.avatar || 'https://via.placeholder.com/40'} alt="Admin" className="w-10 h-10 rounded-full object-cover border border-primary/20" />
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-ink truncate">{user?.name}</p>
                            <p className="text-xs text-secondary truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
