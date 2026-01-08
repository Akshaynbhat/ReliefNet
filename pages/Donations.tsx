import React, { useState } from 'react';
import { ExternalLink, Heart, ShieldCheck, PlusCircle, X } from 'lucide-react';
import { User } from '../types';
import { firestoreService } from '../services/firestoreService';
import { ToastType } from '../components/Toast';
import { useTranslation } from '../components/LanguageContext';

interface DonationsProps {
  user: User | null;
  showToast?: (message: string, type: ToastType) => void;
}

const Donations: React.FC<DonationsProps> = ({ user, showToast }) => {
  const { t } = useTranslation();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const charities = [
    { name: "Karnataka CM Relief Fund", url: "https://cmrf.karnataka.gov.in/", description: t("The official government fund for disaster relief and emergency assistance in Karnataka.") },
    { name: "Bangalore One Donation", url: "https://www.bangaloreone.gov.in/", description: t("Support local municipal initiatives for urban flood relief and infrastructure repair.") },
    { name: "Rapid Response India", url: "https://www.rapidresponse.org.in/", description: t("India's premier disaster relief NGO providing immediate assistance during emergencies.") },
    { name: "Goonj", url: "https://goonj.org/", description: t("Turning urban surplus material into a tool for rural development and disaster relief.") },
    { name: "PM National Relief Fund", url: "https://pmnrf.gov.in/", description: t("National level fund used to render immediate relief to families of those killed in natural calamities.") },
    { name: "Akshaya Patra Foundation", url: "https://www.akshayapatra.org/", description: t("Providing food relief during disasters to affected communities across India.") },
    { name: "GiveIndia", url: "https://www.giveindia.org/", description: t("India's largest and most trusted giving platform with specific disaster relief campaigns.") },
    { name: "HelpAge India", url: "https://www.helpageindia.org/", description: t("Focusing on the needs of the elderly during disasters and relief operations.") }
  ];

  const handleLogDonation = async (charityName: string) => {
    if (!user) {
      if (showToast) showToast(t("Please sign in to log your donations."), "error");
      return;
    }
    
    const amountVal = parseFloat(amount);
    if (!amountVal || amountVal <= 0) {
      alert(t("Please enter a valid amount"));
      return;
    }

    try {
      await firestoreService.addDonation({
        userId: user.id,
        donorName: user.name,
        userEmail: user.email, 
        amount: amountVal,
        campaign: charityName,
        timestamp: Date.now(),
        status: 'Received'
      });

      if (showToast) showToast(`${t('Logged donation of')} ₹${amountVal} ${t('to')} ${charityName}`, "success");
      setActiveModal(null);
      setAmount('');
    } catch (error) {
      console.error("Donation log failed", error);
      if (showToast) showToast(t("Failed to log donation."), "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-slate-900">{t('Verified Donation Channels')}</h1>
        <p className="text-slate-600 mt-4 max-w-2xl mx-auto font-medium">
          {t('We only list verified organizations with a track record of effective disaster response.')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
        {charities.map((charity, index) => (
          <div key={index} className="bg-white border border-slate-200 rounded-2xl p-8 hover:shadow-2xl transition-all group flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors flex items-center">
                  {charity.name}
                  <ShieldCheck className="h-5 w-5 text-blue-500 ml-2" />
                </h3>
                <p className="text-slate-500 mt-3 font-medium leading-relaxed">{charity.description}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-2xl group-hover:bg-red-100 transition-colors shrink-0 ml-4">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-100 flex items-center justify-between">
              <a href={charity.url} target="_blank" rel="noreferrer" className="inline-flex items-center text-blue-600 font-black hover:text-blue-800 uppercase tracking-widest text-xs">
                {t('Donate Directly')} <ExternalLink className="ml-2 h-4 w-4" />
              </a>
              <button onClick={() => setActiveModal(charity.name)} className="inline-flex items-center px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-900/10 active:scale-95">
                <PlusCircle className="mr-2 h-4 w-4" /> {t('Log Donation')}
              </button>
            </div>
          </div>
        ))}
      </div>

      {activeModal && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full overflow-hidden animate-fade-in-up border border-white/20">
            <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white">
              <h3 className="font-black text-lg uppercase tracking-widest">{t('Log Donation')}</h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-white transition-colors"><X className="h-6 w-6" /></button>
            </div>
            <div className="p-10 text-left">
              <p className="text-slate-500 mb-6 font-medium">{t('Enter amount for')} <span className="font-black text-slate-900">{activeModal}</span>.</p>
              <div className="mb-8">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">{t('Amount (INR)')}</label>
                <div className="relative">
                  <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">₹</span>
                  <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full pl-10 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-xl focus:ring-4 focus:ring-blue-100 transition-all" placeholder="1000" autoFocus />
                </div>
              </div>
              <div className="flex space-x-4">
                <button onClick={() => setActiveModal(null)} className="flex-1 py-5 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors">{t('Cancel')}</button>
                <button onClick={() => handleLogDonation(activeModal)} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all active:scale-95">{t('Save Record')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Donations;