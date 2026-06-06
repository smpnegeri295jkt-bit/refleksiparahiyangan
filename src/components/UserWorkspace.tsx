import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, Lock, Phone, MapPin, Send, 
  Calendar, Clock as ClockIcon, ClipboardList, 
  CheckCircle2, Info, ArrowRight, CornerDownRight, HeartPulse, Sparkles 
} from 'lucide-react';
import { User, Booking, Service } from '../types';
import { registerUser, getUsers, createBooking, getBookings } from '../utils/sync';

interface UserWorkspaceProps {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  services: Service[];
  selectedServiceId: string;
  setSelectedServiceId: (id: string) => void;
}

export default function UserWorkspace({
  currentUser,
  setCurrentUser,
  services,
  selectedServiceId,
  setSelectedServiceId,
}: UserWorkspaceProps) {
  // Navigation inside workspace
  const [isRegister, setIsRegister] = useState(false);
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  
  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form State
  const [regFullName, setRegFullName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regWhatsapp, setRegWhatsapp] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  // Order/Booking Form State
  const [bookingServiceId, setBookingServiceId] = useState(selectedServiceId || '');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingNotes, setBookingNotes] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccessUrl, setBookingSuccessUrl] = useState<string | null>(null);

  // Load user bookings
  const loadUserBookings = async (username: string) => {
    try {
      const allBookings = await getBookings();
      const filtered = allBookings.filter(b => b.username.toLowerCase() === username.toLowerCase());
      setUserBookings(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedServiceId) {
      setBookingServiceId(selectedServiceId);
    }
  }, [selectedServiceId]);

  useEffect(() => {
    if (currentUser) {
      loadUserBookings(currentUser.username);
    }
  }, [currentUser]);

  // Handle Customer Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername || !loginPassword) {
      setLoginError('Sila isi semua kolom formulir.');
      return;
    }

    try {
      const users = await getUsers();
      const matched = users.find(
        (u) =>
          u.username.toLowerCase() === loginUsername.toLowerCase() &&
          u.password === loginPassword
      );

      if (matched) {
        // Successful login
        const loggedUser: User = {
          username: matched.username,
          fullName: matched.fullName,
          whatsapp: matched.whatsapp,
          address: matched.address,
        };
        setCurrentUser(loggedUser);
        localStorage.setItem('parahiyangan_current_user', JSON.stringify(loggedUser));
        setLoginUsername('');
        setLoginPassword('');
      } else {
        setLoginError('Username atau sandi salah! Sila periksa kembali.');
      }
    } catch (err) {
      setLoginError('Terjadi kesalahan koneksi.');
    }
  };

  // Handle Customer Registration
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regFullName || !regAddress || !regWhatsapp || !regUsername || !regPassword) {
      setRegError('Mohon lengkapi seluruh formulir data diri Anda.');
      return;
    }

    // Format phone
    let formattedPhone = regWhatsapp.trim().replace(/[^0-9]/g, '');
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('8')) {
      formattedPhone = '62' + formattedPhone;
    }

    const newUser: User = {
      username: regUsername.trim(),
      password: regPassword,
      fullName: regFullName.trim(),
      address: regAddress.trim(),
      whatsapp: formattedPhone,
    };

    try {
      const result = await registerUser(newUser);
      if (result.success) {
        setRegSuccess('Akun berhasil dibuat! Silakan masuk menggunakan username baru Anda.');
        setIsRegister(false);
        setLoginUsername(regUsername.trim());
        // Clean fields
        setRegFullName('');
        setRegAddress('');
        setRegWhatsapp('');
        setRegUsername('');
        setRegPassword('');
      } else {
        setRegError(result.message);
      }
    } catch (err) {
      setRegError('Pengiriman data pendaftaran gagal.');
    }
  };

  // Handle Booking Therapy Session
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccessUrl(null);

    if (!currentUser) return;
    if (!bookingServiceId || !bookingDate || !bookingTime) {
      setBookingError('Silakan pilih layanan, tanggal, dan jam terapi.');
      return;
    }

    const selectedService = services.find((s) => s.id === bookingServiceId);
    if (!selectedService) {
      setBookingError('Layanan tidak valid.');
      return;
    }

    const newBookingId = 'B-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const newBooking: Booking = {
      id: newBookingId,
      username: currentUser.username,
      fullName: currentUser.fullName,
      whatsapp: currentUser.whatsapp,
      address: currentUser.address,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      price: selectedService.price,
      bookingDate: bookingDate,
      bookingTime: bookingTime,
      status: 'pending',
      notes: bookingNotes,
      createdAt: new Date().toISOString(),
    };

    try {
      // Save local / GAS state
      await createBooking(newBooking);
      await loadUserBookings(currentUser.username);

      // Create WhatsApp Deep Link Message to admin number: 085894336810
      // 085894336810 formatted in international as 6285894336810
      const adminWhatsApp = '6285894336810';
      const formattedPrice = new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(selectedService.price);

      const messageText = `*Refleksi Massage Parahiyangan - PESANAN BARU*
----------------------------------------
*ID Pesanan:* ${newBooking.id}
*Pelanggan:* ${newBooking.fullName}
*WA Pelanggan:* ${newBooking.whatsapp}
*Alamat Terapi:* ${newBooking.address}

*Layanan:* ${newBooking.serviceName}
*Durasi:* ${selectedService.duration} Menit
*Harga:* ${formattedPrice}

*Rencana Terapi:*
Tanggal: ${newBooking.bookingDate}
Jam/Waktu: ${newBooking.bookingTime} WIB

*Catatan Tambahan:* ${newBooking.notes || '-'}
----------------------------------------
_Mohon Segera Verifikasi di Portal Admin. Terima kasih._`;

      const encodedMessage = encodeURIComponent(messageText);
      const waUrl = `https://api.whatsapp.com/send?phone=${adminWhatsApp}&text=${encodedMessage}`;
      
      setBookingSuccessUrl(waUrl);

      // Reset form fields
      setBookingDate('');
      setBookingTime('');
      setBookingNotes('');
      setSelectedServiceId('');
    } catch (err) {
      setBookingError('Terjadi kegagalan saat memesan sesi terapi.');
    }
  };

  const getStatusBadge = (status: Booking['status']) => {
    switch (status) {
      case 'pending':
        return <span className="px-2.5 py-1 text-xs font-semibold text-primary bg-primary/10 rounded-lg">Menunggu Verifikasi ⏳</span>;
      case 'confirmed':
        return <span className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-lg">Dikonfirmasi & Dijadwalkan ✅</span>;
      case 'completed':
        return <span className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 rounded-lg">Selesai Dilayani Dan Sehat 🌸</span>;
      case 'cancelled':
        return <span className="px-2.5 py-1 text-xs font-semibold text-red-700 bg-red-50 rounded-lg">Dibatalkan ❌</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-20 font-sans text-espresso">
      
      {/* If Guest, show login or register */}
      {!currentUser ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center min-h-[500px]">
          
          {/* Brand/Slogan Side */}
          <div className="space-y-6">
            <div className="inline-flex gap-2 p-2 rounded-2xl bg-primary/10 border border-primary/15 text-primary text-xs font-semibold uppercase tracking-wider items-center w-fit">
              <Sparkles className="w-4 h-4 text-primary" />
              Relaksasi Terbaik Di Rumah Anda
            </div>
            <h2 className="text-3xl md:text-5xl font-bold font-serif text-espresso-dark leading-tight tracking-tight">
              Pesan Layanan Terapi <span className="text-primary block">Kapan Saja & Mudah</span>
            </h2>
            <p className="text-sm md:text-base text-neutral-600 leading-relaxed font-light font-sans">
              Nikmati kenyamanan refleksi kaki berkelas, pijat tradisional aromaterapi khas sunda Parahiyangan tanpa repot keluar rumah. Cukup daftar sekali, pilih waktu terapi, dan terapis handal kami akan tiba tepat waktu di depan hunian Anda.
            </p>
            
            <div className="space-y-3.5 pt-4">
              {[
                "Proses pendaftaran cepat & data aman",
                "Katalog terlengkap & rincian pesanan transparan",
                "Integrasi WhatsApp realtime langsung ke admin",
                "Pantau riwayat proses & status pemesanan Anda"
              ].map((point, idx) => (
                <div key={idx} className="flex items-center gap-2.5">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary">
                    <HeartPulse className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-medium text-neutral-800">{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Form Side */}
          <div className="bg-white rounded-3xl border border-border-beige shadow-sm p-8 space-y-6 relative overflow-hidden">
            
            <div className="flex border-b border-neutral-100">
              <button
                id="btn-switch-login"
                onClick={() => setIsRegister(false)}
                className={`flex-1 pb-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  !isRegister ? 'border-primary text-primary' : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                Masuk (Login Pelanggan)
              </button>
              <button
                id="btn-switch-register"
                onClick={() => setIsRegister(true)}
                className={`flex-1 pb-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                  isRegister ? 'border-primary text-primary' : 'border-transparent text-neutral-400 hover:text-neutral-600'
                }`}
              >
                Daftar Akun Baru
              </button>
            </div>

            {/* Error alerts */}
            {loginError && !isRegister && (
              <div className="p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}
            {regError && isRegister && (
              <div className="p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{regError}</span>
              </div>
            )}
            {regSuccess && (
              <div className="p-3.5 text-xs text-emerald-700 bg-emerald-55/40 border border-emerald-250 rounded-xl flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{regSuccess}</span>
              </div>
            )}

            {/* 1. Login Panel */}
            {!isRegister ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="login-username" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Username Anda</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      id="login-username"
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      placeholder="Masukkan username Anda..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-beige focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="login-password" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Kata Sandi (Password)</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="password"
                      id="login-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Masukkan password Anda..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-beige focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-login"
                  className="w-full py-3 bg-primary hover:bg-[#c29263] text-white rounded-xl text-sm font-semibold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  Masuk Sekarang
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            ) : (
              /* 2. Registration Panel */
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="reg-fullname" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Nama Lengkap</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      id="reg-fullname"
                      value={regFullName}
                      onChange={(e) => setRegFullName(e.target.value)}
                      placeholder="Nama lengkap sesuai KTP..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-beige focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-address" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Alamat Lengkap</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-neutral-400" />
                    <textarea
                      id="reg-address"
                      value={regAddress}
                      onChange={(e) => setRegAddress(e.target.value)}
                      placeholder="Alamat lengkap, nomor rumah, RT/RW, kelurahan, kecamatan..."
                      rows={2}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-beige focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="reg-whatsapp" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Nomor WhatsApp Aktif</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input
                      type="text"
                      id="reg-whatsapp"
                      value={regWhatsapp}
                      onChange={(e) => setRegWhatsapp(e.target.value)}
                      placeholder="Contoh: 08123456789..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-beige focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label htmlFor="reg-username" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Username</label>
                    <input
                      type="text"
                      id="reg-username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      placeholder="Pilih username..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border-beige focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="reg-password" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Password</label>
                    <input
                      type="password"
                      id="reg-password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Pilih password..."
                      className="w-full px-4 py-2.5 rounded-xl border border-border-beige focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  id="btn-submit-register"
                  className="w-full py-3 bg-primary hover:bg-[#c29263] text-white rounded-xl text-sm font-semibold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-3 cursor-pointer"
                >
                  Daftar & Buat Akun
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

        </div>
      ) : (
        /* If logged in, show booking panel and user dashboard */
        <div className="space-y-12 animate-fade-in font-sans text-espresso">
          
          {/* Dashboard Header Status Card */}
          <div className="p-8 rounded-3xl bg-espresso/[0.02] border border-border-beige flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold font-serif text-espresso-dark tracking-tight">
                Selamat Datang kembali, <span className="text-primary">{currentUser.fullName}</span>!
              </h2>
              <p className="text-xs text-neutral-500 font-light flex items-center gap-1.5 pt-1">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Alamat Terdaftar: {currentUser.address} | No WA: +{currentUser.whatsapp}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="p-4 bg-white border border-border-beige rounded-2xl text-center min-w-[120px]">
                <span className="text-xs font-medium text-neutral-400 block">Pemesanan Selesai</span>
                <span className="text-xl font-bold font-mono text-primary">
                  {userBookings.filter(b => b.status === 'completed').length} Sesi
                </span>
              </div>
              <div className="p-4 bg-white border border-border-beige rounded-2xl text-center min-w-[120px]">
                <span className="text-xs font-medium text-neutral-400 block">Menunggu Jadwal</span>
                <span className="text-xl font-bold font-mono text-espresso-dark">
                  {userBookings.filter(b => b.status === 'pending' || b.status === 'confirmed').length} Sesi
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            {/* Left Box: Sesi Pemesanan Baru (7 Cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-border-beige shadow-sm p-7 space-y-6">
              
              <div className="border-b border-border-beige pb-4">
                <h3 className="text-lg font-bold font-serif text-espresso-dark flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" />
                  Mulai Pesan Sesi Terapi Baru
                </h3>
                <p className="text-xs text-neutral-500 font-sans">Isi waktu janji temu terapis refleksi di bawah ini.</p>
              </div>

              {bookingError && (
                <div className="p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Success Booking Popup / Link Redirect Section */}
              {bookingSuccessUrl ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-5 text-center"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-emerald-900 font-serif">Pemesanan Sesi Selesai Tercatat!</h4>
                    <p className="text-xs text-emerald-800 leading-relaxed max-w-lg mx-auto mt-2">
                      Pesanan Anda sudah tersimpan di database sistem. Silakan ketuk tombol hijau untuk memverifikasi pesanan langsung ke admin Parahiyangan via WhatsApp.
                    </p>
                  </div>

                  <a
                    href={bookingSuccessUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-750 text-white font-bold rounded-xl text-sm shadow-sm transition-transform active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                    Kirim Rincian Pesanan Ke WhatsApp Admin
                  </a>

                  <button
                    onClick={() => setBookingSuccessUrl(null)}
                    className="block mx-auto text-xs font-semibold text-neutral-400 underline hover:text-neutral-600 pt-1 cursor-pointer"
                  >
                    Pesan Sesi Baru Lagi
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-5">
                  
                  {/* Select Service */}
                  <div className="space-y-1">
                    <label htmlFor="booking-service" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Pilih Layanan Terapi/Massage</label>
                    <select
                      id="booking-service"
                      value={bookingServiceId}
                      onChange={(e) => {
                        setBookingServiceId(e.target.value);
                        setSelectedServiceId(e.target.value);
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-border-beige bg-offwhite focus:outline-none focus:border-primary text-sm"
                    >
                      <option value="">-- Pilih Layanan Dari Katalog --</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.duration} Menit - Rp {s.price.toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Time Picker */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label htmlFor="booking-date" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Pilih Tanggal Terapi</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <input
                          type="date"
                          id="booking-date"
                          min={new Date().toISOString().split('T')[0]}
                          value={bookingDate}
                          onChange={(e) => setBookingDate(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-beige bg-offwhite focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label htmlFor="booking-time" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Pilih Jam Kedatangan</label>
                      <div className="relative">
                        <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                        <input
                          type="time"
                          id="booking-time"
                          value={bookingTime}
                          onChange={(e) => setBookingTime(e.target.value)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border-beige bg-offwhite focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notes Complaint */}
                  <div className="space-y-1">
                    <label htmlFor="booking-notes" className="text-[11px] font-bold text-neutral-600 uppercase tracking-wide">Keluhan Serta Sapaan Spesial (Opsional)</label>
                    <textarea
                      id="booking-notes"
                      value={bookingNotes}
                      onChange={(e) => setBookingNotes(e.target.value)}
                      placeholder="Contoh: Otot bahu kaku, tumpuan kaki pegal sekali, atau permintaan terapis pria/wanita..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl border border-border-beige bg-offwhite focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm"
                    />
                  </div>

                  {/* Summary cost details */}
                  {bookingServiceId && (
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-1.5 text-xs text-neutral-705">
                      <div className="flex justify-between font-medium">
                        <span>Nama Layanan:</span>
                        <span className="text-primary font-bold">{services.find(s => s.id === bookingServiceId)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Durasi Terapi:</span>
                        <span>{services.find(s => s.id === bookingServiceId)?.duration} Menit</span>
                      </div>
                      <div className="flex justify-between border-t border-border-beige pt-1.5 text-sm font-bold">
                        <span>Biaya Investasi:</span>
                        <span className="text-primary font-mono">
                          Rp {services.find(s => s.id === bookingServiceId)?.price.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    id="btn-submit-booking"
                    className="w-full py-3.5 bg-primary hover:bg-[#c29263] text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Buat Pesanan & Dapatkan Rincian WhatsApp
                    <ArrowRight className="w-4 h-4" />
                  </button>

                </form>
              )}
            </div>

            {/* Right Box: Riwayat Pemesanan Pelanggan (5 Cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-border-beige shadow-sm p-6 space-y-5">
              
              <div className="border-b border-border-beige pb-3">
                <h3 className="text-base font-bold font-serif text-espresso-dark">Riwayat Terapi & Pemesanan</h3>
                <p className="text-[11px] text-neutral-450 font-sans">Kemajuan proses status sesi spa refleksi Anda secara real-time.</p>
              </div>

              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {userBookings.map((b) => {
                  const correlatedService = services.find(s => s.id === b.serviceId);
                  
                  return (
                    <div
                      key={b.id}
                      className="p-4 rounded-2xl bg-offwhite border border-border-beige/55 space-y-3.5 hover:bg-neutral-50 transition-all duration-300"
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="space-y-0.5">
                          <span className="font-mono text-[10px] font-bold text-neutral-400 uppercase">{b.id}</span>
                          <h4 className="font-bold text-espresso-dark text-xs md:text-sm tracking-tight line-clamp-1 leading-tight font-serif">
                            {b.serviceName}
                          </h4>
                        </div>
                        {getStatusBadge(b.status)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-neutral-600 border-t border-border-beige/60 pt-2.5">
                        <div className="space-y-0.5">
                          <span className="text-[10px] text-neutral-400 block uppercase font-mono">Waktu Terapi</span>
                          <span className="font-semibold block text-espresso">
                            {new Date(b.bookingDate).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                          <span className="block text-neutral-500 font-mono text-[10px]">{b.bookingTime} WIB</span>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <span className="text-[10px] text-neutral-400 block uppercase font-mono">Biaya Terapi</span>
                          <span className="font-bold font-mono text-primary block text-xs">
                            Rp {b.price.toLocaleString('id-ID')}
                          </span>
                          <span className="block text-neutral-500 text-[10px]">
                            {correlatedService?.duration || 60} Mins
                          </span>
                        </div>
                      </div>

                      {b.notes && (
                        <div className="p-2 py-1.5 bg-white rounded-lg border border-border-beige/80 text-[10.5px] leading-relaxed text-neutral-550 flex gap-1">
                          <span className="font-bold uppercase shrink-0 text-primary text-[9px] mt-0.5">Nota:</span>
                          <p className="italic font-light">{b.notes}</p>
                        </div>
                      )}
                    </div>
                  );
                })}

                {userBookings.length === 0 && (
                  <div className="text-center py-12 bg-neutral-900/[0.01] rounded-3xl border border-dashed border-border-beige text-neutral-400 text-xs">
                    Belum ada riwayat pesanan terapi. Sila buat pesanan baru!
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
