import { Sparkles, User as UserIcon, LogOut, ShieldAlert, HeartHandshake } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  activeTab: 'public' | 'user' | 'admin';
  setActiveTab: (tab: 'public' | 'user' | 'admin') => void;
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  currentUser,
  setCurrentUser,
  isAdminLoggedIn,
  setIsAdminLoggedIn
}: NavbarProps) {
  const handleUserLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('parahiyangan_current_user');
    setActiveTab('public');
  };

  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    localStorage.removeItem('parahiyangan_admin_logged_in');
    setActiveTab('public');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border-beige bg-alabaster/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        
        {/* Elegant Brand Logo */}
        <div 
          onClick={() => setActiveTab('public')} 
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/10 group-hover:scale-105 transition-all">
            <HeartHandshake className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-espresso-dark font-sans leading-none flex items-center gap-1.5">
              <span>Parahiyangan</span>
              <span className="inline-block px-1.5 py-0.5 rounded-md bg-primary/10 text-[10px] font-semibold text-primary tracking-wider uppercase">
                Therapy
              </span>
            </h1>
            <p className="text-[11px] text-espresso/70 font-mono tracking-widest uppercase mt-0.5">
              Refleksi & Massage
            </p>
          </div>
        </div>

        {/* Navigation Middle Actions */}
        <nav className="hidden md:flex items-center gap-1 bg-espresso/[0.03] p-1.5 rounded-2xl">
          <button
            id="nav-btn-home"
            onClick={() => setActiveTab('public')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'public'
                ? 'bg-primary text-white shadow-sm shadow-primary/10'
                : 'text-espresso/80 hover:text-espresso hover:bg-espresso/5'
            }`}
          >
            Beranda Publik
          </button>
          
          <button
            id="nav-btn-booking"
            onClick={() => setActiveTab('user')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'user'
                ? 'bg-primary text-white shadow-sm shadow-primary/10'
                : 'text-espresso/80 hover:text-espresso hover:bg-espresso/5'
            }`}
          >
            Pusat Pemesanan
            {currentUser && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            id="nav-btn-admin"
            onClick={() => setActiveTab('admin')}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-espresso text-white shadow-md'
                : 'text-espresso/85 hover:text-espresso/100 hover:bg-espresso/10'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-primary" />
            Portal Admin
            {isAdminLoggedIn && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            )}
          </button>
        </nav>

        {/* User Stats / Profile State */}
        <div className="flex items-center gap-3">
          {/* Mobile buttons */}
          <div className="flex md:hidden gap-1 bg-espresso/[0.03] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('public')}
              className={`p-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'public' ? 'bg-primary text-white' : 'text-espresso/70'
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`p-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'user' ? 'bg-primary text-white' : 'text-espresso/70'
              }`}
            >
              Pesan
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`p-1.5 rounded-lg text-xs font-medium ${
                activeTab === 'admin' ? 'bg-espresso text-white' : 'text-espresso/70'
              }`}
            >
              Admin
            </button>
          </div>

          {currentUser && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <UserIcon className="w-4 h-4 text-emerald-650" />
              <span className="text-xs font-medium text-emerald-800">
                Hi, {currentUser.fullName.split(' ')[0]}
              </span>
            </div>
          )}

          {isAdminLoggedIn && (
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-primary/15 border border-primary/20 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
              <span className="text-xs font-bold text-espresso">
                Mode Admin
              </span>
            </div>
          )}

          {currentUser ? (
            <button
              id="nav-btn-logout-user"
              onClick={handleUserLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-200 text-red-700 bg-red-50 hover:bg-red-100/80 hover:text-red-800 text-xs font-medium transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          ) : isAdminLoggedIn ? (
            <button
              id="nav-btn-logout-admin"
              onClick={handleAdminLogout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-espresso text-espresso-dark bg-transparent hover:bg-espresso/5 text-xs font-medium transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout Admin</span>
            </button>
          ) : null}
        </div>

      </div>
    </header>
  );
}
