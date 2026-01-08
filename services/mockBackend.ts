import { DisasterReport, Donation, ReportStatus, User, UserRole } from '../types';

// Storage Keys
const KEYS = {
  USERS: 'reliefnet_v2_users',
  REPORTS: 'reliefnet_v2_reports',
  DONATIONS: 'reliefnet_v2_donations'
};

// --- Initial Seed Data (Only used if storage is empty) ---
const SEED_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Arjun Kumar', 
    email: 'arjun@reliefnet.com', 
    role: UserRole.USER, 
    avatar: 'https://images.unsplash.com/photo-1615813967515-e1838c1c5116?q=80&w=200&auto=format&fit=crop' 
  },
  { 
    id: 'a1', 
    name: 'Priya Admin', 
    email: 'admin@reliefnet.com', 
    role: UserRole.ADMIN, 
    avatar: 'https://ui-avatars.com/api/?name=Priya+Admin&background=0D8ABC&color=fff' 
  }
];

const SEED_REPORTS: DisasterReport[] = [
  {
    id: 'r1',
    userId: 'u1',
    userName: 'Arjun Kumar',
    // Fix: Added missing required userEmail property
    userEmail: 'arjun@reliefnet.com',
    title: 'Severe Waterlogging at Silk Board',
    description: 'Heavy rains have caused massive waterlogging at Silk Board junction. Traffic is completely stalled.',
    location: 'Silk Board Junction, Bangalore',
    coordinates: { lat: 12.9172, lng: 77.6228 },
    imageUrl: 'https://images.unsplash.com/photo-1569260171128-44e99a803738?q=80&w=800&auto=format&fit=crop',
    status: ReportStatus.VERIFIED,
    timestamp: Date.now() - 86400000, 
    upvotes: 145
  },
  {
    id: 'r2',
    userId: 'u2',
    userName: 'Sneha Reddy',
    // Fix: Added missing required userEmail property
    userEmail: 'sneha@example.com',
    title: 'Tree Fall in Indiranagar',
    description: 'A large Gulmohar tree fell on 100ft road blocking the service lane. An auto-rickshaw was crushed under the branches.',
    location: 'Indiranagar 100ft Road, Bangalore',
    coordinates: { lat: 12.9784, lng: 77.6408 },
    imageUrl: 'https://images.unsplash.com/photo-1569260171128-44e99a803738?q=80&w=800&auto=format&fit=crop',
    status: ReportStatus.VERIFIED,
    timestamp: Date.now() - 172800000, 
    upvotes: 89
  }
];

class MockBackendService {
  private users: User[] = [];
  private reports: DisasterReport[] = [];
  private donations: Donation[] = [];

  constructor() {
    this.loadData();
  }

  private loadData() {
    if (typeof window === 'undefined') return;

    const usersJson = localStorage.getItem(KEYS.USERS);
    if (usersJson) {
      this.users = JSON.parse(usersJson);
    } else {
      this.users = [...SEED_USERS];
      this.saveUsers();
    }

    const reportsJson = localStorage.getItem(KEYS.REPORTS);
    if (reportsJson) {
      this.reports = JSON.parse(reportsJson);
    } else {
      this.reports = [...SEED_REPORTS];
      this.saveReports();
    }

    const donationsJson = localStorage.getItem(KEYS.DONATIONS);
    if (donationsJson) {
      this.donations = JSON.parse(donationsJson);
    } else {
      this.donations = [];
      this.saveDonations();
    }
  }

  private saveUsers() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEYS.USERS, JSON.stringify(this.users));
    }
  }

  private saveReports() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEYS.REPORTS, JSON.stringify(this.reports));
    }
  }

  private saveDonations() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(KEYS.DONATIONS, JSON.stringify(this.donations));
    }
  }

  // User Methods
  getUser(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  upsertUser(user: User): void {
    const index = this.users.findIndex(u => u.id === user.id);
    if (index >= 0) {
      this.users[index] = user;
    } else {
      this.users.push(user);
    }
    this.saveUsers();
  }

  updateUser(user: User): void {
    this.upsertUser(user);
  }

  updateUserRole(userId: string, role: UserRole): void {
    const user = this.getUser(userId);
    if (user) {
      user.role = role;
      this.saveUsers();
    }
  }

  // Report Methods
  getReports(): DisasterReport[] {
    return [...this.reports].sort((a, b) => b.timestamp - a.timestamp);
  }

  addReport(reportData: Omit<DisasterReport, 'id' | 'status' | 'timestamp' | 'upvotes'>): DisasterReport {
    const newReport: DisasterReport = {
      ...reportData,
      id: `r${Date.now()}`,
      status: ReportStatus.PENDING,
      timestamp: Date.now(),
      upvotes: 0
    };
    this.reports.push(newReport);
    this.saveReports();
    return newReport;
  }

  updateReportStatus(id: string, status: ReportStatus): void {
    const report = this.reports.find(r => r.id === id);
    if (report) {
      report.status = status;
      this.saveReports();
    }
  }

  deleteReport(id: string): void {
    this.reports = this.reports.filter(r => r.id !== id);
    this.saveReports();
  }

  // Donation Methods
  getDonations(): Donation[] {
    return [...this.donations].sort((a, b) => b.timestamp - a.timestamp);
  }

  getUserDonations(userId: string): Donation[] {
    return this.donations.filter(d => d.userId === userId).sort((a, b) => b.timestamp - a.timestamp);
  }

  addDonation(donationData: Omit<Donation, 'id' | 'timestamp' | 'status'>): Donation {
    const newDonation: Donation = {
      ...donationData,
      id: `d${Date.now()}`,
      timestamp: Date.now(),
      status: 'Received'
    };
    this.donations.push(newDonation);
    this.saveDonations();
    return newDonation;
  }

  updateDonationStatus(id: string, status: string): void {
    const donation = this.donations.find(d => d.id === id);
    if (donation) {
      donation.status = status;
      this.saveDonations();
    }
  }
}

export const backend = new MockBackendService();