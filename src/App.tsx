import { useState, useEffect } from 'react';
import { initializeDatabase, getServices, getFeedPosts } from './utils/sync';
import Navbar from './components/Navbar';
import PublicHome from './components/PublicHome';
import UserWorkspace from './components/UserWorkspace';
import AdminWorkspace from './components/AdminWorkspace';
import { User, Service, FeedPost } from './types';
import { HeartHandshake, Phone, Mail, MapPin } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'public' | 'user' | 'admin'>('public');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  
  const [services, setServices] = useState<Service[]>([]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize data and load initially
  useEffect(() => {
    const bootstrap = async () => {
      try {
        initializeDatabase();

        // Load logged in state from storage
        const savedUser = localStorage.getItem('parahiyangan_current_user');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }

        const savedAdmin = localStorage.getItem('parahiyangan_admin_logged_in');
        if (savedAdmin === 'true') {
          setIsAdminLoggedIn(true);
        }

        // Fetch services & feed posts
        const currentServices = await getServices();
        setServices(currentServices);

        const currentPosts = await getFeedPosts();
        setFeedPosts(currentPosts);
      } catch (err) {
        console.error('Failed to bootstrap app data:', err);
      } finally {
        setLoading(false);
      }
    };
    bootstrap();
  }, []);

  // Fetch updated catalog and announcements whenever tabs change
  useEffect(() => {
    const refetchOnNavigation = async () => {
      try {
        const s = await getServices();
        setServices(s);
        const p = await getFeedPosts();
        setFeedPosts(p);
      } catch (err) {
        console.error(err);
      }
    };
    refetchOnNavigation();
  }, [activeTab]);

  return (
    <div id="parahiyangan-app" className="min-h-screen flex flex-col bg-alabaster text-espresso selection:bg-primary/20 selection:text-espresso-dark font-sans">
      
      {/* Dynamic Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        isAdminLoggedIn={isAdminLoggedIn}
        setIsAdminLoggedIn={setIsAdminLoggedIn}
      />

      {/* Main Screen Content Body */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono tracking-widest text-primary uppercase animate-pulse">Menghubungkan Database...</p>
          </div>
        ) : (
          <div>
            {activeTab === 'public' && (
              <PublicHome
                services={services}
                feedPosts={feedPosts}
                setActiveTab={setActiveTab}
                setSelectedServiceId={setSelectedServiceId}
              />
            )}

            {activeTab === 'user' && (
              <UserWorkspace
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                services={services}
                selectedServiceId={selectedServiceId}
                setSelectedServiceId={setSelectedServiceId}
              />
            )}

            {activeTab === 'admin' && (
              <AdminWorkspace
                isAdminLoggedIn={isAdminLoggedIn}
                setIsAdminLoggedIn={setIsAdminLoggedIn}
                services={services}
                setServices={setServices}
                feedPosts={feedPosts}
                setFeedPosts={setFeedPosts}
              />
            )}
          </div>
        )}
      </main>

      {/* Premium Spacious Footer */}
      <footer className="w-full bg-espresso-dark border-t border-border-beige/10 text-neutral-400 py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          
          {/* Col 1 Brand Slogan */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <HeartHandshake className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-white tracking-tight leading-none">Refleksi Massage Parahiyangan</h3>
                <span className="text-[10px] uppercase font-mono tracking-wider text-primary">Layanan Terapi Terpercaya</span>
              </div>
            </div>
            <p className="text-xs leading-relaxed font-light">
              Menghadirkan layanan pijat refleksi saraf klasik, massage relaksasi tubuh, shiatsu, aromaterapi bergaransi higienis dengan terapis profesional langsung ke lokasi Anda.
            </p>
          </div>

          {/* Col 2 Operations schedule */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white font-sans">Jadwal Sesi Terapi</h4>
            <ul className="text-xs space-y-2 font-light">
              <li className="flex justify-between">
                <span>Senin - Jum'at:</span>
                <span className="text-white font-medium">08.00 WIB - 22.00 WIB</span>
              </li>
              <li className="flex justify-between">
                <span>Sabtu - Minggu:</span>
                <span className="text-white font-medium">07.00 WIB - 23.00 WIB</span>
              </li>
              <li className="flex justify-between text-primary font-semibold pt-1">
                <span>* Hari Libur Nasional:</span>
                <span>Tetap Buka & Sedia Melayani</span>
              </li>
            </ul>
          </div>

          {/* Col 3 Contact info */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white font-sans">Hubungi Kantor Pusat</h4>
            <ul className="space-y-3.5 text-xs font-light">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span>Jl. Parahiyangan Indah No. 121, Coblong, Kota Bandung, Jawa Barat</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-primary shrink-0" />
                <a href="https://wa.me/6285894336810" target="_blank" rel="noreferrer" className="hover:text-primary transition-colors font-mono">
                  +62 858-9433-6810 (WhatsApp Booking)
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="font-mono">kontak@refleksiparahiyangan.id</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Outer bottom row */}
        <div className="max-w-7xl mx-auto px-6 border-t border-neutral-800 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-light">
          <p>© 2026 Refleksi Massage Parahiyangan. Seluruh hak cipta dilindungi undang-undang.</p>
          <div className="flex gap-4 font-normal text-neutral-500 text-[11px]">
            <span className="hover:text-neutral-400 cursor-pointer">Syarat & Ketentuan</span>
            <span>•</span>
            <span className="hover:text-neutral-400 cursor-pointer">Kebijakan Privasi</span>
            <span>•</span>
            <span onClick={() => setActiveTab('admin')} className="hover:text-primary cursor-pointer text-primary font-semibold">Portal Admin</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
