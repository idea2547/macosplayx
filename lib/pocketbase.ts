import PocketBase from 'pocketbase';

const PB_URL = process.env.NEXT_PUBLIC_PB_URL || 'https://k1r3ok.celestiai.co';

// Singleton for browser
let pb: PocketBase | null = null;

export function getPocketBase(): PocketBase {
  if (!pb) {
    pb = new PocketBase(PB_URL);
    pb.autoCancellation(false);
  }
  return pb;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  created: string;
  updated: string;
}

export interface CosplayerProfile {
  id: string;
  user: string;
  bio?: string;
  interests?: string[];
  preferred_characters?: string[];
  preferred_series?: string[];
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'pro';
  body_measurements?: Record<string, string>;
  social_links?: Record<string, string>;
  is_public: boolean;
  created: string;
  updated: string;
  expand?: { user?: User };
}

export interface FriendConnection {
  id: string;
  user_a: string;
  user_b: string;
  status: 'pending' | 'accepted' | 'blocked';
  initiated_by: string;
  created: string;
  updated: string;
  expand?: { user_a?: User; user_b?: User };
}

export interface ExperienceNote {
  id: string;
  user: string;
  title: string;
  content: string;
  images?: string[];
  event?: string;
  outfit?: string;
  tags?: string[];
  visibility: 'private' | 'friends' | 'public';
  likes_count?: number;
  comments_count?: number;
  created: string;
  updated: string;
  expand?: { user?: User };
}

export interface ChatMessage {
  id: string;
  session: string;
  user: string;
  role: 'user' | 'assistant';
  content: string;
  created: string;
}

export interface ChatSession {
  id: string;
  user: string;
  title: string;
  message_count: number;
  created: string;
  updated: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  price: number;
  seller: string;
  store?: string;
  size_label?: string;
  status: 'draft' | 'published' | 'paused' | 'sold_out' | 'archived';
  listing_type?: 'used_sale' | 'rental' | 'preorder' | 'trade' | 'auction';
  rental_price_per_day?: number;
  character_text?: string;
  series_text?: string;
  location_province?: string;
  condition?: string;
  created: string;
  updated: string;
  expand?: { seller?: User; store?: UserStore };
}

export interface UserStore {
  id: string;
  Name: string;
  Details: string;
  Thumbnail: string;
  user: string;
  slug?: string;
  Province: string;
  isVerified?: boolean;
  rating?: number;
  created: string;
  updated: string;
}

export interface Event {
  id: string;
  name: string;
  description?: string;
  eventDate?: string;
  province?: string;
  venue?: string;
  banner?: string;
  tags?: string[];
  isActive?: boolean;
  created: string;
  updated: string;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function getImageUrl(record: any, filename: string | string[], thumb?: string): string {
  if (!filename) return '';
  const f = Array.isArray(filename) ? filename[0] : filename;
  if (!f) return '';
  return getPocketBase().files.getURL(record, f, { thumb });
}

export const PROVINCES = [
  'กระบี่','กรุงเทพมหานคร','กาญจนบุรี','ขอนแก่น','ชลบุรี','เชียงใหม่',
  'นครราชสีมา','นครศรีธรรมราช','นนทบุรี','ปทุมธานี','ภูเก็ต',
  'สงขลา','สมุทรปราการ','สุราษฎร์ธานี','อุดรธานี','อุบลราชธานี',
] as const;
