import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, DollarSign, CalendarCheck, HelpCircle, 
  Settings, KeyRound, Plus, Trash2, Edit3, 
  MessageSquare, Save, Copy, CheckCircle, AlertTriangle, 
  Upload, Sparkles, LogOut, Check, X, BookmarkCheck, PhoneCall, Image as ImageIcon
} from 'lucide-react';
import { Booking, Service, FeedPost, User } from '../types';
import { 
  getBookings, updateBookingStatus, getServices, 
  saveService, deleteService, getFeedPosts, 
  createFeedPost, deleteFeedPost, getUsers,
  getGoogleScriptUrl, saveGoogleScriptUrl, GOOGLE_APPS_SCRIPT_CODE 
} from '../utils/sync';

interface AdminWorkspaceProps {
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (val: boolean) => void;
  services: Service[];
  setServices: (services: Service[]) => void;
  feedPosts: FeedPost[];
  setFeedPosts: (posts: FeedPost[]) => void;
}

export default function AdminWorkspace({
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  services,
  setServices,
  feedPosts,
  setFeedPosts
}: AdminWorkspaceProps) {
  // Navigation
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'orders' | 'services' | 'posts' | 'settings'>('orders');

  // Login Form States
  const [adminUserInput, setAdminUserInput] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [loginError, setLoginError] = useState('');

  // Data States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [gScriptUrl, setGScriptUrl] = useState('');
  const [settingsMessage, setSettingsMessage] = useState('');
  const [copiedScript, setCopiedScript] = useState(false);

  // Services CRUD Form States
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceName, setServiceName] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');
  const [serviceDuration, setServiceDuration] = useState(60);
  const [servicePrice, setServicePrice] = useState(100000);
  const [serviceCategory, setServiceCategory] = useState<Service['category']>('Massage');
  const [isBestSeller, setIsBestSeller] = useState(false);
  const [isLatest, setIsLatest] = useState(false);
  const [serviceImageBase64, setServiceImageBase64] = useState('');
  const [serviceFormError, setServiceFormError] = useState('');

  // Info Feed Post Form States
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImageBase64, setPostImageBase64] = useState('');
  const [postFormError, setPostFormError] = useState('');

  // Load all admin data
  const loadAdminData = async () => {
    try {
      const bList = await getBookings();
      setBookings(bList);
      const uList = await getUsers();
      setRegisteredUsers(uList);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isAdminLoggedIn) {
      loadAdminData();
      setGScriptUrl(getGoogleScriptUrl());
    }
  }, [isAdminLoggedIn]);

  // Handle Admin Authorization
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (adminUserInput === 'admin' && adminPassInput === 'Tower121509*') {
      setIsAdminLoggedIn(true);
      localStorage.setItem('parahiyangan_admin_logged_in', 'true');
    } else {
      setLoginError('Kredensial Admin Salah! Periksa ulang username/password.');
    }
  };

  // Status Change inside Dashboard (Real-time update)
  const handleStatusChange = async (bookingId: string, newStatus: Booking['status']) => {
    try {
      const updated = await updateBookingStatus(bookingId, newStatus);
      setBookings(updated);
    } catch (err) {
      console.error(err);
    }
  };

  // Convert uploaded image file into base64 string
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save or edit catalog service
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setServiceFormError('');

    if (!serviceName || !serviceDesc || !serviceDuration || !servicePrice) {
      setServiceFormError('Mohon isi semua data katalog layanan.');
      return;
    }

    if (!serviceImageBase64) {
      setServiceFormError('Silakan pilih dan upload gambar thumbnail.');
      return;
    }

    const targetId = editingServiceId || 'S-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const servicePayload: Service = {
      id: targetId,
      name: serviceName.trim(),
      description: serviceDesc.trim(),
      duration: Number(serviceDuration),
      price: Number(servicePrice),
      category: serviceCategory,
      isBestSeller,
      isLatest,
      image: serviceImageBase64,
    };

    try {
      const updatedList = await saveService(servicePayload);
      setServices(updatedList);
      
      // Reset form
      setEditingServiceId(null);
      setServiceName('');
      setServiceDesc('');
      setServiceDuration(60);
      setServicePrice(100000);
      setServiceCategory('Massage');
      setIsBestSeller(false);
      setIsLatest(false);
      setServiceImageBase64('');
    } catch (err) {
      setServiceFormError('Gagal memproses simpan layanan.');
    }
  };

  // Start edit flow for a service
  const startEditService = (service: Service) => {
    setEditingServiceId(service.id);
    setServiceName(service.name);
    setServiceDesc(service.description);
    setServiceDuration(service.duration);
    setServicePrice(service.price);
    setServiceCategory(service.category);
    setIsBestSeller(service.isBestSeller);
    setIsLatest(service.isLatest);
    setServiceImageBase64(service.image);
  };

  // Abort edit flow
  const cancelEditService = () => {
    setEditingServiceId(null);
    setServiceName('');
    setServiceDesc('');
    setServiceDuration(60);
    setServicePrice(100000);
    setServiceCategory('Massage');
    setIsBestSeller(false);
    setIsLatest(false);
    setServiceImageBase64('');
  };

  const handleDeleteService = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus layanan ini dari katalog?')) {
      try {
        const updated = await deleteService(id);
        setServices(updated);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Submit Facebook Post (FeedPost)
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostFormError('');

    if (!postTitle || !postContent) {
      setPostFormError('Mohon isi Judul dan Narasi Informasi.');
      return;
    }

    const newPost: FeedPost = {
      id: 'P-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      title: postTitle.trim(),
      content: postContent.trim(),
      createdAt: new Date().toISOString(),
      image: postImageBase64 || undefined
    };

    try {
      const updated = await createFeedPost(newPost);
      setFeedPosts(updated);
      // Reset form
      setPostTitle('');
      setPostContent('');
      setPostImageBase64('');
    } catch (err) {
      setPostFormError('Gagal mengirimkan postingan info.');
    }
  };

  const handleDeletePost = async (id: string) => {
    if (window.confirm('Hapus informasi/postingan ini dari Beranda Publik?')) {
      try {
        const updated = await deleteFeedPost(id);
        setFeedPosts(updated);
      } catch (e) {
        console.error(e);
      }
    }
  };

  // Google Script URL configuration
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMessage('');
    saveGoogleScriptUrl(gScriptUrl.trim());
    setSettingsMessage('Link Google script berhasil disimpan & disambungkan ke aplikasi!');
    setTimeout(() => setSettingsMessage(''), 4000);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  // Total earnings calculator
  const totalEarnings = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.price, 0);

  // Format IDR helper
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  // If Admin is unauthorized, display Beautiful Glow/Light Effect Login Page
  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 relative overflow-hidden py-12">
        {/* DESIGN BACKDROP EFFECTS */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-80 h-80 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-primary/15 blur-[150px]" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-md bg-white rounded-3xl border border-border-beige shadow-sm p-8 relative z-10"
        >
          {/* Top aesthetic color bar */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />

          <div className="text-center space-y-2 mb-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white shadow-sm shadow-primary/10">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-bold font-serif text-espresso-dark tracking-tight">
              Portal Admin
            </h2>
            <p className="text-xs text-neutral-500 uppercase tracking-widest font-mono">
              Refleksi Massage Parahiyangan
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl mb-5 flex items-center gap-2">
              <AlertTriangle className="w-4.5 h-4.5 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="admin-username" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Username Admin</label>
              <input
                type="text"
                id="admin-username"
                value={adminUserInput}
                onChange={(e) => setAdminUserInput(e.target.value)}
                placeholder="Masukkan username admin..."
                className="w-full px-4 py-2.5 rounded-xl border border-border-beige bg-offwhite focus:outline-none focus:border-primary focus:bg-white text-sm"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="admin-password" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Kata Sandi (Password)</label>
              <input
                type="password"
                id="admin-password"
                value={adminPassInput}
                onChange={(e) => setAdminPassInput(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full px-4 py-2.5 rounded-xl border border-border-beige bg-offwhite focus:outline-none focus:border-primary focus:bg-white text-sm"
              />
            </div>

            <button
              type="submit"
              id="admin-login-submit"
              className="w-full py-3 bg-primary hover:bg-[#c29263] text-white font-bold rounded-xl text-sm shadow-sm transition-all duration-300 transform active:scale-[0.98] mt-2 relative overflow-hidden group cursor-pointer"
            >
              Verifikasi Masuk Portal
            </button>
          </form>
        </motion.div>
      </div>
    );
  }

  // If Admin is Authorized, display Full Admin Panel Dashboard
  return (
    <div className="space-y-10 pb-24">
      
      {/* Admin Stats Row Block */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-border-beige shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Penerimaan Dana</span>
            <h3 className="text-xl font-bold font-mono text-primary leading-none">
              {formatIDR(totalEarnings)}
            </h3>
            <p className="text-[10px] text-neutral-400">Dari pesanan berstatus Selesai</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <DollarSign className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-border-beige shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Total Pesanan</span>
            <h3 className="text-2xl font-bold font-mono text-espresso leading-none">
              {bookings.length} Pesanan
            </h3>
            <p className="text-[10px] text-neutral-400">
              {bookings.filter(b => b.status === 'pending').length} Menunggu verifikasi
            </p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarCheck className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-border-beige shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Pelanggan Aktif</span>
            <h3 className="text-2xl font-bold font-mono text-espresso leading-none block">
              {registeredUsers.length} Orang
            </h3>
            <p className="text-[10px] text-neutral-400">Terdaftar di database</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="w-5.5 h-5.5" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-border-beige shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wide">Spreadsheet Sync</span>
            <h3 className="text-xs font-bold leading-none mt-1">
              {gScriptUrl ? (
                <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md inline-block">Terhubung (GAS) ✅</span>
              ) : (
                <span className="text-[#a47a4d] bg-offwhite px-2 py-1 rounded-md inline-block">Lokal (Fallback Only) ⚠️</span>
              )}
            </h3>
            <p className="text-[10px] text-neutral-400 mt-2">Sinkronisasi Google Sheet</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Settings className="w-5.5 h-5.5" />
          </div>
        </div>
      </section>

      {/* Admin Sub Dashboard Navigation menu */}
      <div className="border-b border-border-beige flex flex-wrap gap-2 pb-2">
        {[
          { id: 'orders', label: `Daftar Pesanan Terapi (${bookings.length})` },
          { id: 'services', label: `Kelola Katalog Produk/Jasa (${services.length})` },
          { id: 'posts', label: `Kelola Berita/Facebook-Post (${feedPosts.length})` },
          { id: 'settings', label: 'Konfigurasi Google Script Sheet' }
        ].map((subTab) => (
          <button
            key={subTab.id}
            id={`admin-subtab-${subTab.id}`}
            onClick={() => setActiveAdminSubTab(subTab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeAdminSubTab === subTab.id
                ? 'bg-primary text-white shadow-sm font-sans'
                : 'text-neutral-500 hover:text-primary hover:bg-offwhite'
            }`}
          >
            {subTab.label}
          </button>
        ))}
      </div>

      {/* Admin Panel Sections */}
      <div className="space-y-8">
        
        {/* 1. ORDERS LIST COMPONENT */}
        {activeAdminSubTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-border-beige shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">Daftar Antrean & Pesanan Masuk (Real-time)</h3>
                <p className="text-xs text-neutral-500">Ubah status pesanan pelanggan dan hubungi via WhatsApp langsung.</p>
              </div>
              <button
                id="btn-refresh-orders"
                onClick={loadAdminData}
                className="px-4 py-2 bg-neutral-150 hover:bg-neutral-250 text-neutral-700 font-semibold rounded-xl text-xs transition-all"
              >
                Segarkan Data 🔄
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-neutral-100">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-100 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-4">ID / Tanggal</th>
                    <th className="p-4">Pelanggan & Kontak</th>
                    <th className="p-4">Layanan & Investasi</th>
                    <th className="p-4">Waktu Terapi</th>
                    <th className="p-4">Status & Keluhan</th>
                    <th className="p-4 text-center">Aksi Verifikasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-neutral-900/[0.01] transition-all">
                      
                      {/* ID / Date */}
                      <td className="p-4 py-5 font-mono">
                        <span className="font-bold text-primary block text-xs">{booking.id}</span>
                        <span className="text-[10px] text-neutral-450 mt-1 block">
                          Dibuat: {new Date(booking.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td className="p-4 py-5">
                        <div className="font-semibold text-neutral-900 text-sm">{booking.fullName}</div>
                        <div className="text-[10.5px] text-neutral-500 font-light mt-1.5 max-w-xs">{booking.address}</div>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="font-mono text-[10.5px] text-neutral-550">+{booking.whatsapp}</span>
                          <a
                            href={`https://api.whatsapp.com/send?phone=${booking.whatsapp}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 rounded text-[10px] font-semibold hover:bg-emerald-500/20"
                            title="Chat via WhatsApp"
                          >
                            <PhoneCall className="w-2.5 h-2.5" />
                            Hubungi
                          </a>
                        </div>
                      </td>

                      {/* Service / Price */}
                      <td className="p-4 py-5 text-neutral-800">
                        <span className="font-bold block">{booking.serviceName}</span>
                        <span className="font-semibold font-mono text-primary block text-[11px] mt-1">{formatIDR(booking.price)}</span>
                      </td>

                      {/* Time Schedule */}
                      <td className="p-4 py-5 font-medium text-neutral-800">
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-semibold text-neutral-850">
                            {new Date(booking.bookingDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-primary mt-1 font-bold bg-primary/10 px-2 py-0.5 rounded w-fit">
                          {booking.bookingTime} WIB
                        </div>
                      </td>

                      {/* Status / Notes */}
                      <td className="p-4 py-5">
                        <div>
                          {booking.status === 'pending' && <span className="px-2 py-0.5 text-[10px] font-semibold text-[#8f643b] bg-[#fbf9f6] border border-[#e5d6c8] rounded">Pending⏳</span>}
                          {booking.status === 'confirmed' && <span className="px-2 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-250 rounded">Dikonfirmasi🗓️</span>}
                          {booking.status === 'completed' && <span className="px-2 py-0.5 text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-250 rounded">Selesai🌸</span>}
                          {booking.status === 'cancelled' && <span className="px-2 py-0.5 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-250 rounded">Dibatalkan❌</span>}
                        </div>
                        {booking.notes && (
                          <p className="text-[10px] text-neutral-450 italic mt-2 max-w-[180px] bg-neutral-50 p-1.5 rounded border border-neutral-150 leading-relaxed font-light">
                            "{booking.notes}"
                          </p>
                        )}
                      </td>

                      {/* Action trigger buttons */}
                      <td className="p-4 py-5 text-center">
                        <div className="flex flex-col sm:flex-row gap-1.5 justify-center">
                          {booking.status === 'pending' && (
                            <button
                              onClick={() => handleStatusChange(booking.id, 'confirmed')}
                              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-750 text-white font-bold rounded-lg text-[10.5px] transition-all"
                            >
                              Konfirmasi Sesi
                            </button>
                          )}
                          {booking.status === 'confirmed' && (
                            <button
                              onClick={() => handleStatusChange(booking.id, 'completed')}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-750 text-white font-bold rounded-lg text-[10.5px] transition-all"
                            >
                              Selesaikan Terapi
                            </button>
                          )}
                          {(booking.status === 'pending' || booking.status === 'confirmed') && (
                            <button
                              onClick={() => handleStatusChange(booking.id, 'cancelled')}
                              className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-150 font-bold rounded-lg text-[10.5px] transition-all"
                            >
                              Batalkan Sesi
                            </button>
                          )}
                          {booking.status === 'completed' && (
                            <span className="text-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" />
                              Diproses Sukses
                            </span>
                          )}
                          {booking.status === 'cancelled' && (
                            <span className="text-red-650 text-[10px] italic">Batal</span>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}

                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-14 text-neutral-450">
                        Belum ada pesanan terapi masuk terdeteksi.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. CATALOG SERVICES CRUD */}
        {activeAdminSubTab === 'services' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Form Column (4 Coils) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-border-beige shadow-sm p-6 space-y-5">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <BookmarkCheck className="w-5 h-5 text-primary" />
                  {editingServiceId ? 'Edit Menu Layanan' : 'Input Layanan Jasa Baru'}
                </h3>
                <p className="text-[11px] text-neutral-450">Tulis nama, deskripsi, durasi, dan sertakan upload foto gambar.</p>
              </div>

              {serviceFormError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {serviceFormError}
                </div>
              )}

              <form onSubmit={handleSaveService} className="space-y-4">
                
                <div className="space-y-1">
                  <label htmlFor="serv-name" className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide">Nama Layanan Terapi</label>
                  <input
                    type="text"
                    id="serv-name"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    placeholder="Contoh: Massage Tradisional Full Body..."
                    className="w-full px-3 py-2 border border-border-beige bg-offwhite hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="serv-desc" className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide">Deskripsi Penjelasan</label>
                  <textarea
                    id="serv-desc"
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
                    placeholder="Tulis rincian apa saja yang pelanggan peroleh, manfaat bugar, jenis minyak..."
                    rows={3}
                    className="w-full px-3 py-2 border border-border-beige bg-offwhite hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="serv-duration" className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide">Durasi (Menit)</label>
                    <input
                      type="number"
                      id="serv-duration"
                      min={10}
                      value={serviceDuration}
                      onChange={(e) => setServiceDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border-beige bg-offwhite hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="serv-price" className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide">Harga (Rupiah)</label>
                    <input
                      type="number"
                      id="serv-price"
                      min={1000}
                      step={5000}
                      value={servicePrice}
                      onChange={(e) => setServicePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-border-beige bg-offwhite hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:border-primary text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="serv-cat" className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide">Kategori Jenis</label>
                  <select
                    id="serv-cat"
                    value={serviceCategory}
                    onChange={(e) => setServiceCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border-beige bg-offwhite hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:border-primary text-xs cursor-pointer"
                  >
                    <option value="Massage">Massage</option>
                    <option value="Reflexology">Reflexology</option>
                    <option value="Aromatherapy">Aromatherapy</option>
                    <option value="Special Treatment">Special Treatment</option>
                  </select>
                </div>

                {/* Badges Toggle Switch Checkbox */}
                <div className="flex gap-4 p-2.5 rounded-xl bg-neutral-50 border border-border-beige">
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isBestSeller}
                      onChange={(e) => setIsBestSeller(e.target.checked)}
                      className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded"
                    />
                    Terlaris (Best Seller) 🔥
                  </label>
                  <label className="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isLatest}
                      onChange={(e) => setIsLatest(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded"
                    />
                    Terbaru ✨
                  </label>
                </div>

                {/* Upload Image Base64 Fulfilling specific: "foto gambar dalam bentuk upload gambar bukan link" */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide block">Upload Thumbnail Produk Jasa</label>
                  <div className="flex items-center justify-center w-full">
                    {serviceImageBase64 ? (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border-beige">
                        <img
                          src={serviceImageBase64}
                          alt="Uploaded Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setServiceImageBase64('')}
                          className="absolute top-2 right-2 p-1.5 bg-red-650 hover:bg-red-750 text-white rounded-lg text-[10px]"
                        >
                          Hapus Gambar ❌
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-neutral-300 hover:border-primary rounded-xl cursor-pointer bg-neutral-50/55 hover:bg-[#fbf9f6] transition-all">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                          <Upload className="w-8 h-8 text-neutral-400 mb-1" />
                          <p className="text-[10.5px] font-bold text-neutral-500">Pilih berkas foto terapi draf Anda</p>
                          <p className="text-[9.5px] text-neutral-400 mt-1 font-mono uppercase">PNG, JPG, JPEG (Maks. 5MB)</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setServiceImageBase64)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    id="btn-save-service"
                    className="flex-1 py-2.5 bg-primary hover:bg-[#c29263] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {editingServiceId ? 'Simpan Perubahan' : 'Masukkan ke Katalog'}
                  </button>
                  {editingServiceId && (
                    <button
                      type="button"
                      onClick={cancelEditService}
                      className="px-3 py-2.5 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold rounded-xl text-xs"
                    >
                      Batal
                    </button>
                  )}
                </div>

              </form>
            </div>

            {/* List Column (7 Coils Displaying and allowing deletion/edits of everything) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-border-beige shadow-sm p-6 space-y-4">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="text-base font-bold text-neutral-900">Katalog Menu Layanan Berjalan</h3>
                <p className="text-[11px] text-neutral-450">Tabel menu lengkap yang diakses pelanggan saat order.</p>
              </div>

              <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                {services.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 rounded-2xl bg-neutral-50 border border-neutral-100 hover:border-primary/10 transition-all items-center"
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-neutral-100 border border-neutral-200">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex flex-wrap gap-1 items-center">
                        <span className="text-[9px] font-extrabold text-primary uppercase tracking-widest">{item.category}</span>
                        {item.isBestSeller && <span className="text-[8px] bg-[#a47a4d] text-white px-1.5 py-0.5 rounded uppercase font-bold">Best Seller</span>}
                        {item.isLatest && <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase font-bold">Terbaru</span>}
                      </div>
                      <h4 className="font-bold text-neutral-900 text-sm">{item.name}</h4>
                      <p className="text-[11px] text-neutral-500 font-light line-clamp-1">{item.description}</p>
                      
                      <div className="text-[11px] flex gap-4 text-neutral-600 font-medium pt-1">
                        <span>Durasi: <strong className="font-mono">{item.duration} Menit</strong></span>
                        <span>Harga: <strong className="font-mono text-primary">{formatIDR(item.price)}</strong></span>
                      </div>
                    </div>

                    {/* Manage actions */}
                    <div className="flex flex-col sm:flex-row gap-1.5">
                      <button
                        onClick={() => startEditService(item)}
                        className="p-2 bg-white text-neutral-600 hover:text-primary border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-all cursor-pointer"
                        title="Edit Layanan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(item.id)}
                        className="p-2 bg-red-50 text-red-600 hover:text-red-750 border border-red-100 rounded-lg hover:bg-red-100 transition-all"
                        title="Hapus Layanan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 3. POST TO FACEBOOK STYLE NEW FEED / ANNOUNCEMENTS */}
        {activeAdminSubTab === 'posts' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left box: Create Post form */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-border-beige shadow-sm p-6 space-y-5">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" />
                  Buat Postingan Informasi Baru
                </h3>
                <p className="text-[11px] text-neutral-450">Akan langsung tampil di Beranda Publik untuk semua orang.</p>
              </div>

              {postFormError && (
                <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                  {postFormError}
                </div>
              )}

              <form onSubmit={handleCreatePost} className="space-y-4">
                
                <div className="space-y-1">
                  <label htmlFor="post-title" className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide">Judul / Headline Informasi</label>
                  <input
                    type="text"
                    id="post-title"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Contoh: Diskon Kemerdekaan 17% Untuk Semua..."
                    className="w-full px-3 py-2.5 border border-border-beige bg-offwhite hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:border-primary text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="post-content" className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide">Isi Informasi / Penjelasan Lengkap</label>
                  <textarea
                    id="post-content"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Tulis narasi berita / promosi lengkap di sini..."
                    rows={4}
                    className="w-full px-3 py-2 border border-border-beige bg-offwhite hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:border-primary text-xs whitespace-pre-wrap"
                  />
                </div>

                {/* Upload Thumbnail for post */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-600 uppercase tracking-wide block">Upload Banner/Foto Berita (Opsional)</label>
                  <div className="flex items-center justify-center w-full">
                    {postImageBase64 ? (
                      <div className="relative w-full h-36 rounded-xl overflow-hidden border border-border-beige">
                        <img
                          src={postImageBase64}
                          alt="Post Preview"
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => setPostImageBase64('')}
                          className="absolute top-2 right-2 p-1.5 bg-red-650 hover:bg-red-750 text-white rounded-lg text-[10px]"
                        >
                          Hapus Gambar ❌
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-neutral-300 hover:border-primary rounded-xl cursor-pointer bg-neutral-50/55 hover:bg-[#fbf9f6] transition-all">
                        <div className="flex flex-col items-center justify-center text-center px-4">
                          <ImageIcon className="w-7 h-7 text-neutral-400 mb-1" />
                          <p className="text-[10px] font-bold text-neutral-500">Sisipkan gambar berita</p>
                          <p className="text-[8.5px] text-neutral-400 font-mono mt-0.5">JPEG, PNG (Maks 5MB)</p>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, setPostImageBase64)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-post"
                  className="w-full py-2.5 bg-primary hover:bg-[#c29263] text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-white" />
                  Posting Informasi Sekarang
                </button>

              </form>
            </div>

            {/* Right box: Posts List with deletion */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-border-beige shadow-sm p-6 space-y-4">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="text-base font-bold text-neutral-900">Arsip Pengumuman Aktif</h3>
                <p className="text-[11px] text-neutral-450">Daftar semua sebaran kabar yang dipasang di halaman beranda.</p>
              </div>

              <div className="space-y-4 max-h-[550px] overflow-y-auto pr-1">
                {feedPosts.map((post) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl bg-neutral-50 border border-neutral-100 space-y-3 flex items-start gap-4 hover:border-primary/10 transition-all"
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[9px] font-bold font-mono text-neutral-400 uppercase">{post.id}</span>
                        <span className="text-[10px] text-neutral-450">
                          {new Date(post.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <h4 className="font-bold text-neutral-900 text-sm">{post.title}</h4>
                      <p className="text-xs text-neutral-600 leading-relaxed font-light line-clamp-3">{post.content}</p>
                      
                      {post.image && (
                        <div className="w-full h-24 rounded-lg overflow-hidden bg-neutral-200">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 bg-red-50 text-red-650 hover:text-red-750 border border-red-100 rounded-lg hover:bg-red-100 transition-all shrink-0 mt-5"
                      title="Hapus Informasi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {feedPosts.length === 0 && (
                  <div className="text-center py-12 text-neutral-400 text-xs">
                    Belum ada pengumuman terbit.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 4. GOOGLE SCRIPT SHEETS CONFIGURATION */}
        {activeAdminSubTab === 'settings' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Input Config Form */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-border-beige shadow-sm p-6 space-y-6">
              <div className="border-b border-neutral-100 pb-3">
                <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-primary" />
                  Atur Tautan Google Script Web App
                </h3>
                <p className="text-[11px] text-neutral-450">Koneksikan spreadsheet Anda sebagai database cloud durabel.</p>
              </div>

              {settingsMessage && (
                <div className="p-3.5 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{settingsMessage}</span>
                </div>
              )}

              <form onSubmit={handleSaveSettings} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="g-url" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">URL Google Apps Script Web App</label>
                  <input
                    type="url"
                    id="g-url"
                    value={gScriptUrl}
                    onChange={(e) => setGScriptUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                    className="w-full px-3.5 py-2.5 border border-border-beige bg-offwhite hover:bg-white focus:bg-white rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-xs font-mono"
                  />
                  <p className="text-[10px] text-neutral-450 leading-relaxed font-light pt-1">
                    Isi dengan Web App link URL yang Anda peroleh setelah melakukan "New Deployment" di Google Apps Script editor.
                  </p>
                </div>

                <button
                  type="submit"
                  id="btn-save-g-url"
                  className="w-full py-3 bg-primary hover:bg-[#c29263] text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  Simpan & Hubungkan Database
                </button>
              </form>

              {/* Status Tracker */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-150 space-y-3 text-xs leading-relaxed text-neutral-700">
                <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-neutral-100">
                  <span className="font-bold text-[10.5px]">Mode Database Berjalan:</span>
                  <span>
                    {gScriptUrl ? (
                      <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded uppercase text-[9.5px]">Google Sheets (GAS)</strong>
                    ) : (
                      <strong className="text-primary bg-primary/10 px-2 py-0.5 rounded uppercase text-[9.5px]">Lokal (LocalStorage)</strong>
                    )}
                  </span>
                </div>
                <p className="text-[10.5px] font-light text-neutral-500">
                  *Aplikasi ini dirancang cerdas dengan fallback otomatis! Jika belum memasang Google Script Web App, seluruh transaksi pendaftaran, katalog, berita, dan pemesanan tetap berfungsi normal dan tersimpan aman di browser (LocalStorage).
                </p>
              </div>
            </div>

            {/* Instruction copy guide */}
            <div className="lg:col-span-7 bg-neutral-900 rounded-3xl text-neutral-200 border border-neutral-800 shadow-xl p-7 space-y-4">
              <div className="border-b border-neutral-800 pb-3 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Kode Script Google Apps</h3>
                  <p className="text-[10.5px] text-neutral-450 leading-relaxed pt-1.5 font-light">Copy-paste seluruh kode di bawah ini ke editor Apps Script Anda.</p>
                </div>
                <button
                  id="btn-copy-script"
                  onClick={handleCopyScript}
                  className="px-3 py-1.5 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 text-xs font-bold rounded-lg border border-neutral-750 transition-all flex items-center gap-1.5"
                >
                  {copiedScript ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Disalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Code
                    </>
                  )}
                </button>
              </div>

              {/* Code preview syntax block */}
              <div className="relative">
                <pre className="text-[10px] font-mono p-4 bg-neutral-950 rounded-2xl max-h-[360px] overflow-auto text-neutral-300 antialiased leading-relaxed border border-white/5 whitespace-pre">
                  {GOOGLE_APPS_SCRIPT_CODE}
                </pre>
              </div>

              {/* Simple steps bullet list */}
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-xs space-y-2.5">
                <h4 className="font-bold text-[#b5a089] font-mono uppercase tracking-wider text-[10px]">Langkah Menghubungkan Google Sheet:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-neutral-300 font-light">
                  <li>Buat Spreadsheet Google baru bernama <strong className="text-white">"Parahiyangan_Database"</strong></li>
                  <li>Buat 4 sheet/tab dengan ejaan presisi: <strong className="text-white">Services</strong>, <strong className="text-white">Users</strong>, <strong className="text-white">Bookings</strong>, <strong className="text-white">FeedPosts</strong></li>
                  <li>Buka menu <strong className="text-white">Extensions &gt; Apps Script</strong></li>
                  <li>Keluarkan semua kode bawaan, lalu paste kode di atas yang sudah Anda salin</li>
                  <li>Klik tombol <strong className="text-white">Deploy &gt; New Deployment</strong>, pilih tipe <strong className="text-white">Web App</strong></li>
                  <li>Atur akses <strong className="text-white">"Who has access"</strong> ke <strong className="text-white">"Anyone"</strong>, klik deploy & izinkan akses</li>
                  <li>Copy Web App URL yang diberikan lalu tempelkan di form sebelah kiri!</li>
                </ol>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
