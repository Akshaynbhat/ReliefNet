import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, SupportedLanguage } from '../types';
import { Activity, Menu, X, LogOut, Globe, ChevronDown, Maximize, Minimize } from 'lucide-react';
import { useTranslation } from './LanguageContext';

interface NavbarProps {
  user: User | null;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  currentPage: string;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onNavigate, currentPage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { language, setLanguage, t } = useTranslation();
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const navItemClass = (page: string) => 
    `px-4 py-2 rounded-xl text-sm font-black transition-all ${
      currentPage === page 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-blue-600'
    }`;

  const languages: { code: SupportedLanguage; label: string; native: string }[] = [
    { code: 'en', label: 'English', native: 'English' },
    { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'hi', label: 'Hindi', native: 'हिंदी' }
  ];

  const handleDashboardClick = () => {
    if (user) {
      onNavigate(user.role === UserRole.ADMIN ? 'admin-dashboard' : 'user-dashboard');
    }
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print w-full">
      <div className="w-full px-6">
        <div className="flex justify-between h-20">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('landing')}>
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/30">
              <Activity className="h-6 w-6 text-white" />
            </div>
            <span className="ml-3 text-2xl font-black text-slate-900 tracking-tighter">ReliefNet</span>
          </div>

          <div className="hidden md:flex items-center space-x-2">
            <button onClick={() => onNavigate('landing')} className={navItemClass('landing')}>{t('Home')}</button>
            <button onClick={() => onNavigate('donations')} className={navItemClass('donations')}>{t('Donations')}</button>
            
            {user && (
              <button 
                onClick={handleDashboardClick}
                className={navItemClass(user.role === UserRole.ADMIN ? 'admin-dashboard' : 'user-dashboard')}
              >
                {user.role === UserRole.ADMIN ? t('Admin Panel') : t('Dashboard')}
              </button>
            )}

            <div className="h-6 w-px bg-slate-200 mx-4"></div>

            {/* Globe Language Dropdown */}
            <div className="relative" ref={langMenuRef}>
              <button 
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 transition-all flex items-center space-x-1"
                title={t("Switch Language")}
              >
                <Globe className="h-5 w-5 text-blue-600" />
                <ChevronDown className={`h-3 w-3 transition-transform ${isLangOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLangOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden py-2 animate-fade-in-up">
                  <div className="px-5 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">
                    {t('Select Language')}
                  </div>
                  {languages.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setIsLangOpen(false);
                      }}
                      className={`w-full text-left px-5 py-3 text-sm font-bold transition-colors flex items-center justify-between ${
                        language === l.code ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span>{l.label}</span>
                      <span className="text-[10px] opacity-60 font-medium">{l.native}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center space-x-4 ml-4">
                <div 
                  className="flex items-center space-x-3 cursor-pointer p-1.5 pr-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                  onClick={handleDashboardClick}
                >
                  <img src={user.avatar || "https://ui-avatars.com/api/?name=User"} alt="Avatar" className="h-9 w-9 rounded-xl border-2 border-white shadow-sm object-cover" />
                  <span className="text-sm font-black text-slate-900">{user.name}</span>
                </div>
                <button onClick={onLogout} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title={t("Sign Out")}>
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => onNavigate('login')} 
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-black tracking-widest uppercase transition-all shadow-xl shadow-slate-900/20"
              >
                {t('Sign In')}
              </button>
            )}

            <button 
              onClick={toggleFullScreen} 
              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 p-6 space-y-4 animate-fade-in-up">
          <div className="grid grid-cols-3 gap-2 pb-4 border-b border-slate-100">
            {languages.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLanguage(l.code); setIsOpen(false); }}
                className={`py-3 rounded-xl text-xs font-black uppercase tracking-tighter ${
                  language === l.code ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {l.native}
              </button>
            ))}
          </div>
          <button onClick={() => { onNavigate('landing'); setIsOpen(false); }} className="block w-full text-left py-3 font-black text-slate-900">{t('Home')}</button>
          <button onClick={() => { onNavigate('donations'); setIsOpen(false); }} className="block w-full text-left py-3 font-black text-slate-900">{t('Donations')}</button>
          {user ? (
            <>
              <button onClick={() => { handleDashboardClick(); setIsOpen(false); }} className="block w-full text-left py-3 font-black text-blue-600">{t('Dashboard')}</button>
              <button onClick={onLogout} className="block w-full text-left py-3 font-black text-red-600">{t('Log out')}</button>
            </>
          ) : (
            <button onClick={() => { onNavigate('login'); setIsOpen(false); }} className="block w-full text-left py-3 font-black text-blue-600">{t('Sign In')}</button>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;