import { Service, FeedPost } from '../types';

export const DEFAULT_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Pijat Tradisional Parahiyangan Full Body',
    description: 'Pijat seluruh tubuh khas Parahiyangan menggabungkan teknik urut dalam dan penekanan lembut untuk melemaskan otot tegang, meningkatkan sirkulasi darah, dan meredakan penat fisik.',
    duration: 90,
    price: 155000,
    category: 'Massage',
    isBestSeller: true,
    isLatest: false,
    image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 's2',
    name: 'Refleksi Kaki Kesehatan Saraf',
    description: 'Terapi refleksi titik saraf kaki yang sangat efektif untuk memulihkan kebugaran tubuh, meringankan kelelahan setelah beraktivitas, dan menyeimbangkan energi tubuh.',
    duration: 60,
    price: 95000,
    category: 'Reflexology',
    isBestSeller: true,
    isLatest: false,
    image: 'https://images.unsplash.com/photo-1519823551278-64ac9283ca47?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 's3',
    name: 'Pijat Shiatsu Jepang Relaksasi',
    description: 'Pijat tanpa minyak menggunakan teknik tekanan jari pada titik-titik meridian tubuh untuk mengembalikan keseimbangan energi alami dan meredakan stres mental.',
    duration: 75,
    price: 135000,
    category: 'Massage',
    isBestSeller: false,
    isLatest: true,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 's4',
    name: 'Touch Aromaterapi Lavender & Sandalwood',
    description: 'Perpaduan pijat relaksasi mendalam dengan minyak esensial alami premium. Menghadirkan ketenangan jiwa dan keharuman aromaterapi yang menenteramkan.',
    duration: 90,
    price: 175000,
    category: 'Aromatherapy',
    isBestSeller: true,
    isLatest: true,
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 's5',
    name: 'Hot Stone Therapy Parahiyangan',
    description: 'Terapi pijat istimewa dengan meletakkan batu basal hangat di titik-titik kunci tubuh guna memperlancar aliran energi, melunturkan ketegangan otot dalam, dan melancarkan sirkulasi.',
    duration: 100,
    price: 210000,
    category: 'Special Treatment',
    isBestSeller: false,
    isLatest: true,
    image: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800'
  }
];

export const DEFAULT_FEED_POSTS: FeedPost[] = [
  {
    id: 'p1',
    title: 'Grand Opening Cabang Baru Refleksi Massage Parahiyangan!',
    content: 'Kabar gembira warga Bandung dan sekitarnya! Kami kini hadir lebih dekat dengan Anda. Nikmati nuansa terapi yang asri dan tenang dengan pelayanan bintang lima. Dapatkan diskon 20% untuk semua layanan di minggu pertama ini!',
    createdAt: '2026-06-01T08:30:00Z',
    image: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'p2',
    title: 'Pentingnya Pijat Refleksi Kaki Secara Rutin',
    content: 'Apakah Anda sering kelelahan setelah pulang kerja? Pijat refleksi kaki membantu menyehatkan fungsi organ tubuh lewat stimulasi titik saraf, mengurangi nyeri otot betis, meningkatkan kualitas tidur malam, serta membuang racun. Direkomendasikan 1-2 kali seminggu bersama terapis berpengalaman kami.',
    createdAt: '2026-06-04T10:15:00Z',
    image: 'https://images.unsplash.com/photo-1519823551278-64ac9283ca47?auto=format&fit=crop&q=80&w=800'
  }
];

export const SLIDESHOW_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1200',
    title: 'Sentuhan Hangat Khas Parahiyangan',
    subtitle: 'Kembalikan kesegaran fisik dan ketenangan batin Anda bersama terapis profesional terlatih kami.'
  },
  {
    url: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&q=80&w=1200',
    title: 'Aromaterapi Premium Berkhasiat',
    subtitle: 'Menggunakan minyak esensial alami pilihan untuk meningkatkan energi, meredakan stres, dan memanjakan tubuh.'
  },
  {
    url: 'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=1200',
    title: 'Refleksi Saraf Kaki Klasik',
    subtitle: 'Pulihkan kesehatan tubuh menyeluruh dari titik-titik refleksi telapak kaki dengan sensasi pijatan ternyaman.'
  }
];
