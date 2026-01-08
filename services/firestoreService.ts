import { db, auth } from './firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, setDoc, getDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { DisasterReport, Donation, User, ReportStatus } from '../types';

const COLLECTIONS = {
  REPORTS: 'reports',
  DONATIONS: 'donations',
  USERS: 'users',
  MAIL: 'mail'
};

const formatDateTime = (ts: number) => {
  return new Date(ts).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'long',
    timeStyle: 'short'
  });
};

export const firestoreService = {
  // --- REPORTS ---
  async getReports(): Promise<DisasterReport[]> {
    try {
      const q = query(collection(db, COLLECTIONS.REPORTS), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DisasterReport));
    } catch (error) {
      console.error("Firestore Error (getReports):", error);
      return [];
    }
  },

  async addReport(report: Omit<DisasterReport, 'id'>): Promise<string> {
    const reportData = {
      ...report,
      timestamp: Date.now(),
      createdAt: serverTimestamp()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.REPORTS), reportData);
    const reportId = docRef.id;
    
    // 1. Report Submitted Confirmation
    try {
      if (report.userEmail) {
        await addDoc(collection(db, COLLECTIONS.MAIL), {
          to: report.userEmail,
          userId: auth.currentUser?.uid,
          message: {
            subject: 'Disaster Report Submitted – ReliefNet',
            html: `
              <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #2563eb;">Report Received</h2>
                <p>Hello <strong>${report.userName}</strong>,</p>
                <p>Thank you for your report. It has been successfully submitted to ReliefNet.</p>
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                  <p><strong>Report ID:</strong> ${reportId}</p>
                  <p><strong>Date & Time:</strong> ${formatDateTime(reportData.timestamp)}</p>
                  <p><strong>Disaster Type:</strong> ${report.title}</p>
                  <p><strong>Description:</strong> ${report.description}</p>
                  <p><strong>Location:</strong> ${report.location}</p>
                  <p><strong>Status:</strong> Pending</p>
                </div>
                <p>Our team is reviewing the information. We will notify you once verified.</p>
              </div>
            `
          }
        });
      }
    } catch (e) { console.error("Email trigger failed (addReport):", e); }

    return reportId;
  },

  async updateReportStatus(id: string, status: ReportStatus, remarks?: string) {
    const ref = doc(db, COLLECTIONS.REPORTS, id);
    
    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const report = snap.data() as DisasterReport;
        
        // 3. When admin updates report status
        if (report.status !== status && report.userEmail) {
          await addDoc(collection(db, COLLECTIONS.MAIL), {
            to: report.userEmail,
            userId: report.userId, 
            message: {
              subject: 'Update on Your Disaster Report – ReliefNet',
              html: `
                <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                  <h2 style="color: #2563eb;">Report Status Update</h2>
                  <p>Hello <strong>${report.userName}</strong>,</p>
                  <p>There has been an update to the status of your disaster report.</p>
                  <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 20px 0; background-color: #f9fafb;">
                    <p><strong>Report ID:</strong> ${id}</p>
                    <p><strong>Disaster Type:</strong> ${report.title}</p>
                    <p><strong>New Status:</strong> <span style="font-weight: bold; text-transform: uppercase; color: #1d4ed8;">${status}</span></p>
                    ${remarks ? `<p><strong>Admin Remarks:</strong> ${remarks}</p>` : ''}
                  </div>
                  <p>Thank you for helping us keep the community safe.</p>
                </div>
              `
            }
          });
        }
      }
    } catch (e) { console.error("Email trigger failed (updateReportStatus):", e); }

    await updateDoc(ref, { status, remarks: remarks || '' });
  },

  async deleteReport(id: string) {
    await deleteDoc(doc(db, COLLECTIONS.REPORTS, id));
  },

  // --- DONATIONS ---
  async addDonation(donation: Omit<Donation, 'id'>) {
    const donationData = {
      ...donation,
      timestamp: Date.now()
    };
    const docRef = await addDoc(collection(db, COLLECTIONS.DONATIONS), donationData);
    const donationId = docRef.id;
    
    // 2. Donation Confirmation
    try {
      if (donation.userEmail) {
        await addDoc(collection(db, COLLECTIONS.MAIL), {
          to: donation.userEmail,
          userId: auth.currentUser?.uid,
          message: {
            subject: 'Thank you for your Donation – ReliefNet',
            html: `
              <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                <h2 style="color: #e11d48;">Donation Received ❤️</h2>
                <p>Hello <strong>${donation.donorName}</strong>,</p>
                <p>Thank you for your generous contribution. Your support directly enables our relief efforts on the ground.</p>
                <div style="background: #fff1f2; padding: 15px; border-radius: 8px; border: 1px solid #fecdd3; margin: 20px 0;">
                  <p><strong>Donation ID:</strong> ${donationId}</p>
                  <p><strong>Amount:</strong> ₹${donation.amount.toLocaleString()}</p>
                  <p><strong>Date & Time:</strong> ${formatDateTime(donationData.timestamp)}</p>
                  <p><strong>Organization / Fund:</strong> ${donation.campaign}</p>
                </div>
                <p>We have logged your donation successfully and will keep you updated on its impact.</p>
              </div>
            `
          }
        });
      }
    } catch (e) { console.error("Email trigger failed (addDonation):", e); }
    
    return donationId;
  },

  async updateDonationStatus(id: string, status: string) {
    const ref = doc(db, COLLECTIONS.DONATIONS, id);

    try {
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const donation = snap.data() as Donation;
        
        // 4. When admin updates donation status
        if (donation.status !== status && donation.userEmail) {
          await addDoc(collection(db, COLLECTIONS.MAIL), {
            to: donation.userEmail,
            userId: donation.userId,
            message: {
              subject: 'Donation Status Update – ReliefNet',
              html: `
                <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
                  <h2 style="color: #2563eb;">Donation Progress Update</h2>
                  <p>Hello <strong>${donation.donorName}</strong>,</p>
                  <p>We are writing to update you on the status of your recent contribution.</p>
                  <div style="border: 1px solid #ddd; padding: 15px; border-radius: 8px; margin: 20px 0; background-color: #eff6ff;">
                    <p><strong>Donation ID:</strong> ${id}</p>
                    <p><strong>Campaign:</strong> ${donation.campaign}</p>
                    <p><strong>Amount:</strong> ₹${donation.amount.toLocaleString()}</p>
                    <p><strong>New Status:</strong> <span style="font-weight: bold; color: #1d4ed8; text-transform: uppercase;">${status}</span></p>
                  </div>
                  <p>Your support is making a real difference. Thank you for your trust in ReliefNet.</p>
                </div>
              `
            }
          });
        }
      }
    } catch (e) { console.error("Email trigger failed (updateDonationStatus):", e); }

    await updateDoc(ref, { status });
  },

  async getUserDonations(userId: string): Promise<Donation[]> {
    const q = query(collection(db, COLLECTIONS.DONATIONS), where("userId", "==", userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
  },

  async getAllDonations(): Promise<Donation[]> {
    const q = query(collection(db, COLLECTIONS.DONATIONS), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Donation));
  },

  // --- USERS ---
  async upsertUser(user: User) {
    const ref = doc(db, COLLECTIONS.USERS, user.id);
    await setDoc(ref, user, { merge: true });
  },

  async getUser(userId: string): Promise<User | null> {
    const ref = doc(db, COLLECTIONS.USERS, userId);
    const snap = await getDoc(ref);
    return snap.exists() ? (snap.data() as User) : null;
  }
};