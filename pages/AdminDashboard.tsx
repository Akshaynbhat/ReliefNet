import React, { useState, useEffect } from 'react';
import { DisasterReport, ReportStatus, Donation, User, UserRole } from '../types';
import { firestoreService } from '../services/firestoreService';
import { 
  Check, X, Trash2, ShieldCheck, Loader2, Info, Users, 
  IndianRupee, MapPin, Edit3, ArrowLeft, Camera, Save, User as UserIcon,
  TrendingUp, Activity, CheckCircle2, AlertCircle, BarChart3, PieChart,
  Clock, Globe, RotateCcw, Calendar, Play, Eye, ExternalLink, Navigation
} from 'lucide-react';

interface AdminDashboardProps {
  user: User;
  onUserUpdate: (user: User) => void;
  onNavigate: (page: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onUserUpdate, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'reports' | 'donations' | 'analytics' | 'profile'>('reports');
  const [reports, setReports] = useState<DisasterReport[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DisasterReport | null>(null);

  const [editingDonationId, setEditingDonationId] = useState<string | null>(null);
  const [tempStatus, setTempStatus] = useState('');

  const [profileName, setProfileName] = useState(user.name);
  const [profileAvatar, setProfileAvatar] = useState(user.avatar);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const isVideo = (url?: string) => url?.startsWith('data:video/') || url?.includes('video');

  useEffect(() => {
    refreshData();
  }, [activeTab]);

  const refreshData = async () => {
    setLoading(true);
    try {
      const [allReports, allDonations] = await Promise.all([
        firestoreService.getReports(),
        firestoreService.getAllDonations()
      ]);
      setReports(allReports);
      setDonations(allDonations);
    } catch (e) {
      console.error("Data fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  const handleReportStatusUpdate = async (reportId: string, status: ReportStatus) => {
    const remarks = window.prompt(`Update status to ${status.toUpperCase()}. Any remarks for the user?`) || '';
    
    try {
      await firestoreService.updateReportStatus(reportId, status, remarks);
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status, remarks } : r));
      if (selectedReport?.id === reportId) {
        setSelectedReport(prev => prev ? { ...prev, status, remarks } : null);
      }
    } catch(e) { 
      console.error("Update failed", e);
    }
  };

  const handleDonationStatusUpdate = async (id: string) => {
    if (!tempStatus.trim()) return;
    try {
      await firestoreService.updateDonationStatus(id, tempStatus);
      setDonations(prev => prev.map(d => d.id === id ? { ...d, status: tempStatus } : d));
      setEditingDonationId(null);
    } catch (e) {
      console.error("Donation update failed", e);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (window.confirm('Permanently delete this report?')) {
      try {
        await firestoreService.deleteReport(id);
        setReports(prev => prev.filter(r => r.id !== id));
        if (selectedReport?.id === id) setSelectedReport(null);
      } catch (e) {
        console.error("Delete failed", e);
      }
    }
  };

  const handleUpdateProfile = async () => {
    setIsUpdatingProfile(true);
    try {
      const updatedUser = { ...user, name: profileName, avatar: profileAvatar };
      await firestoreService.upsertUser(updatedUser);
      onUserUpdate(updatedUser);
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const stats = {
    totalReports: reports.length,
    verified: reports.filter(r => r.status === ReportStatus.VERIFIED).length,
    pending: reports.filter(r => r.status === ReportStatus.PENDING).length,
    rejected: reports.filter(r => r.status === ReportStatus.REJECTED).length,
    activeDonors: new Set(donations.map(d => d.userId)).size,
    totalFunds: donations.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0)
  };

  const verificationRate = stats.totalReports > 0 ? (stats.verified / stats.totalReports) * 100 : 0;

  const donationsByCampaign = donations.reduce((acc: {[key: string]: number}, curr) => {
    const campaign = curr.campaign || 'Unknown';
    acc[campaign] = (acc[campaign] || 0) + (Number(curr.amount) || 0);
    return acc;
  }, {});

  const campaignStats = Object.entries(donationsByCampaign)
    .sort(([, a], [, b]) => Number(b) - Number(a));

  return (
    <div className="w-full px-6 py-10 min-h-screen">
      <div className="mb-10 text-left">
        <button onClick={() => onNavigate('landing')} className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-base transition-colors mb-6 group">
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </button>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="text-left"><h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Admin Command Center</h1></div>
          <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
            {(['reports', 'donations', 'analytics', 'profile'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 md:px-8 py-3 rounded-xl text-base font-black transition-all capitalize ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}>
                {tab === 'donations' ? 'Donations' : tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 text-left">
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm border-l-8 border-l-blue-500 flex justify-between items-start">
          <div className="text-left"><p className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Total Reports</p><h3 className="text-4xl font-black text-slate-900">{stats.totalReports}</h3></div>
          <div className="p-3 bg-blue-50 rounded-2xl"><Info className="h-6 w-6 text-blue-500" /></div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm border-l-8 border-l-emerald-500 flex justify-between items-start">
          <div className="text-left"><p className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Total Funds</p><h3 className="text-4xl font-black text-slate-900">₹{stats.totalFunds.toLocaleString()}</h3></div>
          <div className="p-3 bg-emerald-50 rounded-2xl"><IndianRupee className="h-6 w-6 text-emerald-500" /></div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm border-l-8 border-l-amber-500 flex justify-between items-start">
          <div className="text-left"><p className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Pending</p><h3 className="text-4xl font-black text-slate-900">{stats.pending}</h3></div>
          <div className="p-3 bg-amber-50 rounded-2xl"><Clock className="h-6 w-6 text-amber-500" /></div>
        </div>
        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm border-l-8 border-l-indigo-500 flex justify-between items-start">
          <div className="text-left"><p className="text-xs font-black text-slate-400 mb-2 uppercase tracking-widest">Active Donors</p><h3 className="text-4xl font-black text-slate-900">{stats.activeDonors}</h3></div>
          <div className="p-3 bg-indigo-50 rounded-2xl"><Users className="h-6 w-6 text-indigo-500" /></div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-12 w-12 animate-spin text-blue-600" /></div>
      ) : (
        <div className="animate-fade-in-up w-full text-left">
          {activeTab === 'reports' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100"><tr className="text-xs font-black uppercase tracking-widest text-slate-500"><th className="px-8 py-6">INCIDENT</th><th className="px-8 py-6">REPORTER</th><th className="px-8 py-6">STATUS</th><th className="px-8 py-6 text-right">ACTIONS</th></tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {reports.map(report => (
                      <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-7">
                          <div className="flex items-center">
                            <div className="h-14 w-14 rounded-2xl overflow-hidden mr-5 shadow-md shrink-0 bg-slate-900 flex items-center justify-center relative">
                              {isVideo(report.imageUrl) ? (
                                <>
                                  <video src={report.imageUrl} className="h-full w-full object-cover" />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                    <Play className="h-4 w-4 text-white fill-current" />
                                  </div>
                                </>
                              ) : (
                                <img src={report.imageUrl} className="h-full w-full object-cover" alt="" />
                              )}
                            </div>
                            <div><p className="font-black text-slate-900 text-lg leading-tight">{report.title}</p></div>
                          </div>
                        </td>
                        <td className="px-8 py-7"><p className="text-base font-black text-slate-800">{report.userName}</p><p className="text-[11px] font-bold text-slate-400 mt-1.5">{report.userEmail}</p></td>
                        <td className="px-8 py-7">
                          <span className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest border-2 ${
                            report.status === ReportStatus.VERIFIED ? 'bg-green-50 text-green-700 border-green-200' : 
                            report.status === ReportStatus.REJECTED ? 'bg-red-50 text-red-700 border-red-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {report.status}
                          </span>
                        </td>
                        <td className="px-8 py-7 text-right">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => setSelectedReport(report)} title="View Details" className="p-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-all active:scale-95"><Eye className="h-5 w-5" /></button>
                            {report.status === ReportStatus.PENDING && (
                              <>
                                <button onClick={() => handleReportStatusUpdate(report.id, ReportStatus.VERIFIED)} title="Verify Report" className="p-2.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-xl border border-green-200 transition-all active:scale-95"><Check className="h-5 w-5" /></button>
                                <button onClick={() => handleReportStatusUpdate(report.id, ReportStatus.REJECTED)} title="Reject Report" className="p-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-all active:scale-95"><X className="h-5 w-5" /></button>
                              </>
                            )}
                            <button onClick={() => handleDeleteReport(report.id)} title="Delete Forever" className="p-2.5 text-slate-400 bg-slate-50 hover:bg-slate-100 hover:text-slate-600 rounded-xl border border-slate-200 transition-all active:scale-95"><Trash2 className="h-5 w-5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'donations' && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
              <div className="hidden lg:grid lg:grid-cols-4 bg-slate-50 border-b border-slate-100 text-xs font-black uppercase tracking-widest text-slate-500">
                <div className="px-10 py-6">DONOR</div>
                <div className="px-10 py-6">AMOUNT</div>
                <div className="px-10 py-6">TRACKING STATUS</div>
                <div className="px-10 py-6 text-right">ACTION</div>
              </div>

              <div className="divide-y divide-slate-100">
                {donations.length === 0 ? (
                  <div className="p-20 text-center text-slate-400 font-bold">No donations found.</div>
                ) : (
                  donations.map(donation => (
                    <div 
                      key={donation.id} 
                      className={`flex flex-col lg:grid lg:grid-cols-4 p-6 lg:p-0 transition-colors ${editingDonationId === donation.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}
                    >
                      <div className="lg:px-10 lg:py-8 mb-4 lg:mb-0">
                        <p className="text-[10px] lg:hidden font-black text-slate-400 uppercase tracking-widest mb-1">Donor</p>
                        <p className="text-lg font-black text-slate-900">{donation.donorName}</p>
                      </div>

                      <div className="lg:px-10 lg:py-8 mb-4 lg:mb-0">
                        <p className="text-[10px] lg:hidden font-black text-slate-400 uppercase tracking-widest mb-1">Amount</p>
                        <p className="text-xl font-black text-slate-900 tracking-tighter flex items-center">
                          <IndianRupee className="h-4 w-4 mr-1 lg:hidden" />
                          ₹{donation.amount.toLocaleString()}
                        </p>
                      </div>

                      <div className="lg:px-10 lg:py-8 mb-6 lg:mb-0">
                        <p className="text-[10px] lg:hidden font-black text-slate-400 uppercase tracking-widest mb-2">Tracking Status</p>
                        {editingDonationId === donation.id ? (
                          <div className="flex flex-col gap-2">
                             <input 
                              type="text" 
                              value={tempStatus} 
                              onChange={(e) => setTempStatus(e.target.value)} 
                              className="px-5 py-3.5 bg-white border-2 border-blue-600 rounded-2xl outline-none text-slate-900 font-bold text-sm shadow-md ring-4 ring-blue-100 transition-all w-full lg:max-w-xs"
                              placeholder="Update status..."
                              autoFocus 
                            />
                          </div>
                        ) : (
                          <span className="inline-block px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider bg-blue-100/50 border-2 border-blue-200 text-blue-800 leading-tight whitespace-normal max-w-full lg:max-w-[250px]">
                            {donation.status}
                          </span>
                        )}
                      </div>

                      <div className="lg:px-10 lg:py-8 flex lg:justify-end items-center">
                        {editingDonationId === donation.id ? (
                          <div className="flex gap-3 w-full lg:w-auto">
                            <button 
                              onClick={() => handleDonationStatusUpdate(donation.id)} 
                              className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-2xl font-black flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-xs uppercase tracking-widest"
                            >
                              <Save className="h-4 w-4 mr-2" /> Save
                            </button>
                            <button 
                              onClick={() => setEditingDonationId(null)} 
                              className="flex-1 lg:flex-none bg-white border border-slate-200 text-slate-500 hover:text-slate-800 px-6 py-3.5 rounded-2xl font-black flex items-center justify-center shadow-sm active:scale-95 transition-all text-xs uppercase tracking-widest"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" /> Cancel
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => { setEditingDonationId(donation.id); setTempStatus(donation.status); }} 
                            className="w-full lg:w-auto bg-slate-100 hover:bg-blue-600 hover:text-white text-blue-600 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all border border-transparent hover:border-blue-700 text-center"
                          >
                            Update Status
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-10 animate-fade-in-up">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center">
                      <BarChart3 className="h-6 w-6 text-blue-600 mr-3" /> Report Verification Health
                    </h3>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between text-sm font-black text-slate-600 mb-2 uppercase tracking-widest">
                        <span>Verified Reports</span>
                        <span>{stats.verified} ({Math.round(verificationRate)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${verificationRate}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-black text-slate-600 mb-2 uppercase tracking-widest">
                        <span>Pending Review</span>
                        <span>{stats.pending} ({Math.round((stats.pending/stats.totalReports)*100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                        <div className="bg-amber-400 h-full transition-all duration-1000" style={{ width: `${(stats.pending/stats.totalReports)*100}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm font-black text-slate-600 mb-2 uppercase tracking-widest">
                        <span>Rejected Reports</span>
                        <span>{stats.rejected} ({Math.round((stats.rejected/stats.totalReports)*100)}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden">
                        <div className="bg-red-400 h-full transition-all duration-1000" style={{ width: `${(stats.rejected/stats.totalReports)*100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center">
                      <TrendingUp className="h-6 w-6 text-emerald-600 mr-3" /> Financial Impact
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Avg Donation</p>
                      <p className="text-2xl font-black text-slate-900">₹{(stats.totalFunds / (donations.length || 1)).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Donor Retention</p>
                      <p className="text-2xl font-black text-slate-900">{Math.round((stats.activeDonors / (donations.length || 1)) * 100)}%</p>
                    </div>
                  </div>
                  <div className="mt-8">
                     <div className="p-6 bg-emerald-50 border border-emerald-100 rounded-3xl">
                        <p className="text-sm font-bold text-emerald-800 mb-1">Total Aid Distribution Pool</p>
                        <p className="text-3xl font-black text-emerald-900">₹{stats.totalFunds.toLocaleString()}</p>
                     </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-2xl font-black text-slate-900 flex items-center">
                      <Globe className="h-6 w-6 text-blue-600 mr-3" /> Distribution by Channel
                    </h3>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Target Campaigns</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaignStats.length === 0 ? (
                      <div className="col-span-full py-10 text-center text-slate-400 font-bold">No donation data available yet.</div>
                    ) : campaignStats.map(([name, amount]) => (
                      <div key={name} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl hover:bg-white hover:shadow-lg transition-all border-b-4 border-b-blue-500">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 line-clamp-1" title={name}>{name}</p>
                        <p className="text-2xl font-black text-slate-900">₹{amount.toLocaleString()}</p>
                        <div className="mt-4 w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-blue-600 h-full rounded-full" 
                            style={{ width: `${(Number(amount) / stats.totalFunds) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
                <div className="p-8 border-b border-slate-100 font-black text-slate-900 flex items-center">
                  <Activity className="h-6 w-6 text-slate-400 mr-3" /> Recent System Activity
                </div>
                <div className="divide-y divide-slate-50">
                  {reports.slice(0, 5).map(r => (
                    <div key={r.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-xl ${r.status === ReportStatus.VERIFIED ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                          {r.status === ReportStatus.VERIFIED ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{r.title}</p>
                          <p className="text-xs text-slate-400 font-medium">Reported by {r.userName} • {new Date(r.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{r.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="max-w-2xl mx-auto animate-fade-in-up">
              <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-10 md:p-14 text-left">
                <div className="flex items-center space-x-4 mb-12">
                  <UserIcon className="h-8 w-8 text-blue-600" />
                  <h2 className="text-3xl font-black text-slate-900">Admin Profile</h2>
                </div>
                <div className="flex flex-col items-center mb-12">
                  <div className="relative group">
                    <img src={profileAvatar || "https://ui-avatars.com/api/?name=Admin"} alt="Profile" className="w-40 h-40 rounded-full object-cover border-[6px] border-white shadow-2xl" />
                    <label className="absolute bottom-1 right-1 bg-blue-600 p-3.5 rounded-full text-white cursor-pointer shadow-2xl hover:bg-blue-700 hover:scale-110 transition-all border-4 border-white">
                      <Camera className="h-6 w-6" />
                      <input type="file" accept="image/*" onChange={(e) => {
                        if (e.target.files?.[0]) {
                          const reader = new FileReader();
                          reader.onloadend = () => setProfileAvatar(reader.result as string);
                          reader.readAsDataURL(e.target.files[0]);
                        }
                      }} className="hidden" />
                    </label>
                  </div>
                </div>
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Admin Name</label>
                    <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all font-bold text-slate-900 text-lg" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Role</label>
                    <input type="text" value="System Administrator" disabled className="w-full px-6 py-5 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-400 text-lg cursor-not-allowed" />
                  </div>
                  <div className="pt-8">
                    <button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="w-full px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all flex items-center justify-center shadow-2xl active:scale-95 disabled:opacity-50">
                      {isUpdatingProfile ? <Loader2 className="animate-spin h-6 w-6 mr-3" /> : <Save className="h-6 w-6 mr-3" />} Save Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TASK 2: Detailed Report View Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 animate-fade-in-up flex flex-col md:flex-row h-full md:max-h-[85vh]">
            {/* Left side: Media */}
            <div className="md:w-1/2 bg-slate-900 flex items-center justify-center relative overflow-hidden shrink-0 min-h-[300px] md:min-h-0">
               {isVideo(selectedReport.imageUrl) ? (
                 <video src={selectedReport.imageUrl} className="w-full h-full object-contain" controls autoPlay loop muted />
               ) : (
                 <img src={selectedReport.imageUrl} className="w-full h-full object-contain" alt="Disaster Evidence" />
               )}
               <div className="absolute top-6 left-6">
                 <span className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl border-2 ${
                    selectedReport.status === ReportStatus.VERIFIED ? 'bg-green-600 text-white border-green-400' : 
                    selectedReport.status === ReportStatus.REJECTED ? 'bg-red-600 text-white border-red-400' :
                    'bg-amber-500 text-white border-amber-300'
                  }`}>
                    {selectedReport.status}
                  </span>
               </div>
            </div>

            {/* Right side: Information */}
            <div className="md:w-1/2 flex flex-col overflow-y-auto bg-white">
              <div className="p-8 border-b border-slate-100 flex justify-between items-start text-left sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">{selectedReport.title}</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Submitted on {new Date(selectedReport.timestamp).toLocaleString()}
                  </p>
                </div>
                <button onClick={() => setSelectedReport(null)} className="p-3 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-8 space-y-8 text-left">
                {/* Reporter Info */}
                <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <UserIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Reporter Details</p>
                    <p className="font-black text-slate-900">{selectedReport.userName}</p>
                    <p className="text-sm font-medium text-slate-500">{selectedReport.userEmail}</p>
                  </div>
                </div>

                {/* Location Info */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Location Information</p>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-base font-bold text-slate-800 leading-relaxed">{selectedReport.location}</p>
                  </div>
                  {selectedReport.coordinates && (
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedReport.coordinates.lat},${selectedReport.coordinates.lng}`}
                      target="_blank" rel="noreferrer"
                      className="inline-flex items-center text-xs font-black text-blue-600 hover:text-blue-800 uppercase tracking-widest gap-2 bg-blue-50 px-4 py-2 rounded-xl transition-colors"
                    >
                      <Navigation className="h-4 w-4 rotate-45" /> View on Google Maps
                    </a>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incident Description</p>
                  <p className="text-slate-600 text-base leading-relaxed font-medium bg-slate-50/50 p-6 rounded-2xl border border-slate-100 italic">
                    "{selectedReport.description}"
                  </p>
                </div>

                {/* Remarks if any */}
                {selectedReport.remarks && (
                  <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Admin Remarks</p>
                    <p className="text-sm font-bold text-amber-900">{selectedReport.remarks}</p>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="mt-auto p-8 border-t border-slate-100 bg-slate-50/50 sticky bottom-0 z-10">
                <div className="flex flex-wrap gap-4">
                  {selectedReport.status === ReportStatus.PENDING && (
                    <>
                      <button 
                        onClick={() => handleReportStatusUpdate(selectedReport.id, ReportStatus.VERIFIED)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center shadow-xl shadow-emerald-500/20 active:scale-95 transition-all text-sm"
                      >
                        <Check className="h-5 w-5 mr-2" /> VERIFY REPORT
                      </button>
                      <button 
                        onClick={() => handleReportStatusUpdate(selectedReport.id, ReportStatus.REJECTED)}
                        className="flex-1 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border-2 border-red-100 px-6 py-4 rounded-2xl font-black flex items-center justify-center active:scale-95 transition-all text-sm"
                      >
                        <X className="h-5 w-5 mr-2" /> REJECT
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => handleDeleteReport(selectedReport.id)}
                    className="w-full md:w-auto p-4 text-slate-400 hover:text-slate-900 hover:bg-slate-200 rounded-2xl transition-all"
                    title="Delete Permanently"
                  >
                    <Trash2 className="h-6 w-6 mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;