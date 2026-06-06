import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { SLIDESHOW_IMAGES } from '../data/defaultServices';

export default function Slideshow() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
    }, 6000); // Change image every 6 seconds
    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + SLIDESHOW_IMAGES.length) % SLIDESHOW_IMAGES.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SLIDESHOW_IMAGES.length);
  };

  return (
    <div className="relative h-[480px] w-full overflow-hidden rounded-3xl shadow-2xl bg-neutral-900 border border-border-beige/10">
      {/* Slides showing */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Dim Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30 z-10" />
          
          <img
            src={SLIDESHOW_IMAGES[currentIndex].url}
            alt={SLIDESHOW_IMAGES[currentIndex].title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />

          {/* Slogan Banner / Info */}
          <div className="absolute bottom-12 left-6 right-6 md:left-12 md:right-12 z-20 text-white font-sans">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-primary/20 backdrop-blur-md rounded-full text-primary text-xs font-semibold tracking-wider uppercase mb-3 border border-primary/30"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Layanan Unggulan Parahiyangan
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-3xl md:text-5xl font-bold tracking-tight font-serif drop-shadow-md text-white max-w-2xl leading-tight"
            >
              {SLIDESHOW_IMAGES[currentIndex].title}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mt-3 text-neutral-200 text-sm md:text-lg max-w-xl font-light leading-relaxed font-sans"
            >
              {SLIDESHOW_IMAGES[currentIndex].subtitle}
            </motion.p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Navigation Left Arrow */}
      <button
        id="btn-slide-prev"
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-black/40 hover:bg-primary/70 text-white border border-white/10 hover:border-primary/40 backdrop-blur-md transition-all active:scale-95"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      {/* Slide Navigation Right Arrow */}
      <button
        id="btn-slide-next"
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-black/40 hover:bg-primary/70 text-white border border-white/10 hover:border-primary/40 backdrop-blur-md transition-all active:scale-95"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Bottom Dot indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 flex gap-2">
        {SLIDESHOW_IMAGES.map((_, idx) => (
          <button
            key={idx}
            id={`btn-slide-dot-${idx}`}
            onClick={() => setCurrentIndex(idx)}
            className={`w-3.5 h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'bg-primary w-7' : 'bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
