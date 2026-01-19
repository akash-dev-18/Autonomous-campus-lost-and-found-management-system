export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "user" | "admin";
  avatar?: string;
  reputation_score: number;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Item {
  id: string;
  type: "lost" | "found";
  title: string;
  description: string;
  category: string;
  location_found?: string;
  date_lost_found: string;
  status: "active" | "claimed" | "returned" | "closed";
  tags: string[];
  images: string[];
  user_id: string;
  user?: User;
  created_at: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}
