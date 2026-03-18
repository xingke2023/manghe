export interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: number;
  openid?: string;
  phone?: string;
  nickname: string;
  avatar_url?: string;
  gender?: number;
  age?: number;
  height?: number;
  city?: string;
  district?: string;
  is_member: boolean;
  member_expire_date?: string;
  has_box_permission?: number;
  credit_score?: number;
}

export interface BlindBoxCreatorProfile {
  about_me?: string;
  interests: string[];
  interest_photos: string[];
  dating_purposes: string[];
}

export interface BlindBoxCreator {
  id: number;
  nickname: string;
  avatar_url?: string;
  gender?: number;
  age?: number;
  height?: number;
  is_member: boolean;
  generation_label?: string;
  profile?: BlindBoxCreatorProfile;
}

export interface BlindBox {
  id: number;
  title: string;
  cover_image?: string;
  meeting_time: string;
  meeting_time_full: string;
  location: string;
  city?: string;
  district?: string;
  fee_type: number;
  fee_label: string;
  expected_traits: string[];
  experience_values: string[];
  view_count: number;
  apply_count: number;
  status: number;
  created_at: string;
  creator?: BlindBoxCreator;
}

export interface Post {
  id: number;
  user_id: number;
  title: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface LoginCredentials {
  phone: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PostFormData {
  title: string;
  content: string;
  published?: boolean;
}
