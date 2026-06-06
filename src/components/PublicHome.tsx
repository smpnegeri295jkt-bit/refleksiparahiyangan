import { useState } from 'react';
import { motion } from 'motion/react';
import { Award, Zap, Clock, ShieldCheck, HeartPulse, Sparkles, MessageCircleCode } from 'lucide-react';
import { Service, FeedPost } from '../types';
import Slideshow from './Slideshow';

interface PublicHomeProps {
  services: Service[];
  feedPosts: FeedPost[];
  setActiveTab: (tab: 'public' | 'user' | 'admin') => void;
  setSelectedServiceId: (id: string) => void;
}

export default function PublicHome({
  services,
  feedPosts,
  setActiveTab,
  setSelectedServiceId,
}: PublicHomeProps) {
  const [filter, setFilter] = useState<'all' | 'bestseller' | 'latest'>('all');

  // Filter services
  const filteredServices = services.filter((s) => {
    if (filter === 'bestseller') return s.isBestSeller;
    if (filter === 'latest') return s.isLatest;
    return true;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleBookNow = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    setActiveTab('user');
  };

  return (
    <div className="space-y-14 pb-20 font-sans text-espresso">
      
      {/* 1. Large Slideshow */}
      <section className="px-1.5 md:px-0">
        <Slideshow />
      </section>

      {/* 2. Key Value Props Banner (Spacious and comforting) */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2 md:px-0">
        {[
          { icon: Award, label: "Terapis Sertifikasi", desc: "Berpengalaman & ramah" },
          { icon: HeartPulse, label: "Minyak Organik", desc: "Aman, wangi, premium" },
          { icon: ShieldCheck, label: "Higienis & Steril", desc: "Standar protokol ketat" },
          { icon: Clock, label: "Fleksibel & Tepat", desc: "Sesuai jadwal pesanan" }
        ].map((item, idx) => (
          <div 
            key={idx}
            className="flex flex-col items-center text-center p-5 rounded-2xl bg-primary/5 border border-primary/10 hover:bg-primary/[0.08] transition-all duration-350"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
              <item.icon className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-espresso-dark text-sm md:text-base leading-tight">{item.label}</h3>
            <p className="text-xs text-neutral-500 mt-1">{item.desc}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* 3. Catalog Services Section (Left column taking 2 cols on wide screens) */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-beige pb-4">
            <div>
              <h2 className="text-2xl font-bold font-serif text-espresso-dark flex items-center gap-2">
                <Sparkles className="w-5.5 h-5.5 text-primary" />
                Layanan & Menu Terapi
              </h2>
              <p className="text-xs text-neutral-500 font-sans">Pilihan terapi terbaik sesuai kebutuhan fisik dan kebugaran Anda.</p>
            </div>

            {/* Filter Pills */}
            <div className="flex gap-1.5 bg-espresso/[0.03] p-1 rounded-xl self-start sm:self-auto">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'bestseller', label: 'Terlaris 🔥' },
                { id: 'latest', label: 'Terbaru ✨' }
              ].map((pill) => (
                <button
                  key={pill.id}
                  id={`filter-btn-${pill.id}`}
                  onClick={() => setFilter(pill.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    filter === pill.id
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-espresso/70 hover:bg-espresso/5'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredServices.map((service, idx) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="group relative flex flex-col overflow-hidden rounded-3xl bg-white border border-border-beige hover:shadow-xl hover:border-primary/20 transition-all duration-300"
              >
                {/* Images */}
                <div className="relative h-48 w-full overflow-hidden bg-neutral-100">
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  {/* Badges Overlay */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                    {service.isBestSeller && (
                      <span className="px-2.5 py-1 text-[10px] font-bold text-white bg-primary rounded-md uppercase tracking-wider shadow-sm flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        Terlaris (Best Seller)
                      </span>
                    )}
                    {service.isLatest && (
                      <span className="px-2.5 py-1 text-[10px] font-bold text-white bg-emerald-600 rounded-md uppercase tracking-wider shadow-sm">
                        Terbaru
                      </span>
                    )}
                  </div>
                  <span className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-white font-mono text-[11px]">
                    {service.duration} Mins
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-col flex-grow p-5 space-y-3.5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest">
                      {service.category}
                    </span>
                    <h3 className="text-lg font-bold font-serif text-espresso-dark tracking-tight leading-snug group-hover:text-primary transition-colors">
                      {service.name}
                    </h3>
                  </div>

                  <p className="text-xs text-neutral-500 leading-relaxed font-light line-clamp-3">
                    {service.description}
                  </p>

                  <div className="pt-2 border-t border-border-beige flex items-center justify-between mt-auto">
                    <div>
                      <p className="text-[10px] text-neutral-400 uppercase font-medium">Harga Investasi</p>
                      <h4 className="text-lg font-bold text-primary font-mono">
                        {formatPrice(service.price)}
                      </h4>
                    </div>
                    <button
                      id={`btn-book-${service.id}`}
                      onClick={() => handleBookNow(service.id)}
                      className="px-4 py-2 bg-primary hover:bg-[#c29263] text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      Pesan Sekarang
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredServices.length === 0 && (
              <div className="col-span-full py-12 text-center text-neutral-450 text-sm">
                Tidak ada menu layanan di kategori ini.
              </div>
            )}
          </div>
        </div>

        {/* 4. Social News Feed Info Section (Right column taking 1 col) */}
        <div className="space-y-6">
          <div className="border-b border-border-beige pb-4">
            <h2 className="text-2xl font-bold font-serif text-espresso-dark flex items-center gap-2">
              <MessageCircleCode className="w-5.5 h-5.5 text-primary" />
              Info & Berita Terbaru
            </h2>
            <p className="text-xs text-neutral-500">Kabar hangat, pembaruan, dan postingan langsung dari admin.</p>
          </div>

          <div className="space-y-6 max-h-[850px] overflow-y-auto pr-1">
            {feedPosts.map((post, idx) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="p-5 rounded-3xl bg-white border border-border-beige shadow-sm space-y-4 hover:border-primary/15 hover:shadow-md transition-all duration-300"
              >
                {/* Header (Facebook Style / Admin Profile) */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-espresso text-white font-bold text-sm">
                    A
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-espresso-dark leading-tight">Admin Parahiyangan</h4>
                    <p className="text-[11px] text-neutral-450 font-mono">
                      {new Date(post.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Article Body */}
                <div className="space-y-3">
                  <h3 className="font-bold text-espresso-dark text-sm md:text-base tracking-tight leading-tight">
                    {post.title}
                  </h3>
                  <p className="text-xs text-neutral-600 leading-relaxed font-light whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* Article Image if present */}
                {post.image && (
                  <div className="overflow-hidden rounded-2xl h-44 bg-neutral-100">
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
              </motion.article>
            ))}

            {feedPosts.length === 0 && (
              <div className="text-center py-10 bg-offwhite rounded-3xl border border-dashed border-border-beige text-neutral-400 text-xs">
                Belum ada pengumuman yang dibagikan oleh admin.
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
