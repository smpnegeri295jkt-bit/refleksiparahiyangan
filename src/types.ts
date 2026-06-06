export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  price: number; // in Indonesian Rupiah
  category: 'Massage' | 'Reflexology' | 'Aromatherapy' | 'Special Treatment';
  isBestSeller: boolean;
  isLatest: boolean;
  image: string; // Base64 string or image URL
}

export interface User {
  username: string;
  fullName: string;
  whatsapp: string;
  address: string;
  password?: string; // used for simple auth check
}

export interface Booking {
  id: string;
  username: string;
  fullName: string;
  whatsapp: string;
  address: string;
  serviceId: string;
  serviceName: string;
  price: number;
  bookingDate: string;
  bookingTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  image?: string; // Optional image base64 or URL
}

export interface GoogleScriptConfig {
  scriptUrl: string;
  syncEnabled: boolean;
}
