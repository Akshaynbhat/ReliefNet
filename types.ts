
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin'
}

// Fixed: Added SupportedLanguage type used in Navbar.tsx
export type SupportedLanguage = 'en' | 'kn' | 'hi';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export enum ReportStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected'
}

export interface DisasterReport {
  id: string;
  userId: string;
  userName: string;
  userEmail: string; // Added for email automation
  title: string;
  description: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  imageUrl: string;
  status: ReportStatus;
  timestamp: number;
  upvotes: number;
  remarks?: string; // Added for admin feedback
}

export interface Donation {
  id: string;
  userId?: string;
  donorName: string;
  userEmail: string; // Added for email automation
  amount: number;
  campaign: string;
  timestamp: number;
  status: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
