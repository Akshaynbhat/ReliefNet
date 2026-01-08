import React, { useEffect, useState } from 'react';
import { AlertTriangle, Heart, Shield, ArrowRight, LayoutDashboard, MapPin, Navigation, Loader2, ExternalLink, Clock, Play } from 'lucide-react';
import { firestoreService } from '../services/firestoreService';
import { User, UserRole, DisasterReport, ReportStatus } from '../types';
import { useTranslation } from '../components/LanguageContext';

interface LandingProps {
  onNavigate: (page: string) => void;
  user: User | null;
}

const Landing: React.FC<LandingProps> = ({ onNavigate, user }) => {
  const { t } = useTranslation();
  const [allReports, setAllReports] = useState<DisasterReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [nearbyReports, setNearbyReports] = useState<DisasterReport[]>([]);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const isVideo = (url?: string) => url?.startsWith('data:video/') || url?.includes('video');

  useEffect(() => {
    const loadReports = async () => {
      const reports = await firestoreService.getReports();
      setAllReports(reports);
      setLoadingReports(false);
    };
    loadReports();
  }, []);

  const verifiedCount = allReports.filter(r => r.status === ReportStatus.VERIFIED).length;

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; 
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    const d = R * c; 
    return d;
  };

  useEffect(() => {
    if (user && !loadingReports) {
      setLoadingLocation(true);
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const currentLoc = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            setUserLocation(currentLoc);
            
            const nearby = allReports.filter(report => {
              if (report.status !== ReportStatus.VERIFIED || !report.coordinates) return false;
              const distance = calculateDistance(currentLoc.lat, currentLoc.lng, report.coordinates.lat, report.coordinates.lng);
              return distance <= 10;
            });
            
            setNearbyReports(nearby);
            setLoadingLocation(false);
          },
          (error) => {
            console.error("Error getting location:", error);
            setLocationError(t("Unable to access your location. Please enable GPS."));
            setLoadingLocation(false);
          }
        );
      } else {
        setLocationError(t("Geolocation is not supported by your browser."));
        setLoadingLocation(false);
      }
    }
  }, [user, allReports, loadingReports, t]);

  return (
    <div className="flex flex-col min-h-screen w-full">
      <section className="bg-slate-900 text-white pt-32 pb-24 px-6 relative overflow-hidden w-full">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80')`,
            opacity: 0.3
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/60 to-slate-900/95 z-0"></div>
        
        <div className="relative z-10 text-center w-full">
          <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-8 drop-shadow-lg">
            {t('Disaster Relief &')} <span className="text-blue-400">{t('Rapid Response')}</span>
          </h1>
          <p className="max-w-3xl mx-auto text-2xl text-slate-200 mb-12 drop-shadow-md">
            {t('ReliefNet connects communities in crisis with rapid assistance. Report incidents, verify data, and track donations transparently.')}
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {user ? (
              <button 
                onClick={() => onNavigate(user.role === UserRole.ADMIN ? 'admin-dashboard' : 'user-dashboard')} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all shadow-2xl flex items-center"
              >
                {t('Go to Dashboard')} <LayoutDashboard className="ml-2 h-6 w-6" />
              </button>
            ) : (
              <button 
                onClick={() => onNavigate('login')} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all shadow-2xl flex items-center"
              >
                {t('Get Started')} <ArrowRight className="ml-2 h-6 w-6" />
              </button>
            )}
            <button 
              onClick={() => onNavigate('donations')} 
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm border-2 border-white/30 text-white px-10 py-5 rounded-2xl font-bold text-xl transition-all shadow-xl"
            >
              {t('Donate Now')}
            </button>
          </div>
        </div>
      </section>

      {user && (
        <section className="bg-slate-50 border-b border-slate-200 py-16 w-full px-6">
          <div className="w-full">
            <div className="flex items-center justify-between mb-12">
               <div className="text-left">
                  <h2 className="text-3xl font-black text-slate-900 flex items-center">
                    <Navigation className="h-8 w-8 text-blue-600 mr-3" />
                    {t('Alerts Near You')}
                  </h2>
                  <p className="text-slate-600 text-lg mt-2 font-medium">
                    {t('Verified incidents within 10km of your current location.')}
                  </p>
               </div>
               {loadingLocation && (
                 <div className="flex items-center text-blue-600 font-bold">
                   <Loader2 className="h-5 w-5 animate-spin mr-2" /> {t('Locating...')}
                 </div>
               )}
            </div>

            {locationError ? (
               <div className="bg-amber-50 border-l-8 border-amber-400 p-6 text-amber-700 rounded-r-2xl text-left">
                 <p className="font-black text-lg">{t('Location Access Required')}</p>
                 <p className="text-base">{locationError}</p>
               </div>
            ) : !userLocation && !loadingLocation ? (
               <div className="bg-slate-100 rounded-[2rem] p-16 text-center text-slate-500 border border-slate-200">
                 <MapPin className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                 <p className="text-xl font-bold">{t('Waiting for location permission...')}</p>
               </div>
            ) : nearbyReports.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-fade-in-up text-left">
                 {nearbyReports.map(report => (
                   <div key={report.id} className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden hover:shadow-2xl transition-all flex flex-col h-full group">
                      <div className="h-48 overflow-hidden relative bg-slate-900">
                        {isVideo(report.imageUrl) ? (
                          <video src={report.imageUrl} className="w-full h-full object-cover" muted autoPlay loop />
                        ) : (
                          <img src={report.imageUrl} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-[10px] font-black uppercase text-blue-600 border border-blue-100 shadow-sm">
                           {isVideo(report.imageUrl) ? 'Video Evidence' : 'Photo Evidence'}
                        </div>
                      </div>
                      <div className="p-8 flex-1 flex flex-col">
                         <h3 className="text-xl font-black text-slate-900 leading-tight mb-4">{report.title}</h3>
                         <div className="flex items-center gap-3 mb-6">
                            <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 flex items-center">
                              <Navigation className="h-4 w-4 mr-2 rotate-45" />
                              {userLocation && report.coordinates 
                                ? `${calculateDistance(userLocation.lat, userLocation.lng, report.coordinates.lat, report.coordinates.lng).toFixed(1)} km ${t('away')}` 
                                : t('Nearby')}
                            </span>
                            <span className="text-xs text-slate-400 font-bold flex items-center uppercase tracking-widest">
                               <Clock className="h-4 w-4 mr-1.5"/>
                              {new Date(report.timestamp).toLocaleDateString()}
                            </span>
                         </div>
                         <p className="text-base text-slate-500 mb-8 flex-grow leading-relaxed font-medium line-clamp-4">{report.description}</p>
                         <div className="flex items-start text-sm text-slate-400 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-bold">
                           <MapPin className="h-5 w-5 mr-3 text-blue-500 mt-0.5 shrink-0" /> 
                           <span className="line-clamp-2">{report.location}</span>
                         </div>
                         {report.coordinates && (
                           <a 
                             href={`https://www.google.com/maps/dir/?api=1&destination=${report.coordinates.lat},${report.coordinates.lng}`}
                             target="_blank" rel="noreferrer"
                             className="w-full mt-auto bg-blue-600 text-white hover:bg-blue-700 py-4 rounded-2xl text-base font-black flex items-center justify-center transition-all shadow-xl shadow-blue-500/10"
                           >
                             {t('Get Directions')} <ExternalLink className="ml-2 h-4 w-4" />
                           </a>
                         )}
                      </div>
                   </div>
                 ))}
               </div>
            ) : userLocation ? (
               <div className="bg-green-50 border-2 border-green-200 rounded-[3rem] p-20 text-center shadow-inner">
                 <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-md">
                   <Shield className="h-12 w-12" />
                 </div>
                 <h3 className="text-3xl font-black text-green-900">{t('Safety Confirmed')}</h3>
                 <p className="text-xl text-green-700 mt-4 max-w-2xl mx-auto font-medium">
                   {t('No verified disaster reports within a 10km radius. Your area is currently stable.')}
                 </p>
               </div>
            ) : null}
          </div>
        </section>
      )}

      <div className="bg-blue-600 py-16 w-full px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center text-white w-full">
          <div>
            <div className="text-5xl font-black mb-2 tracking-tighter">{loadingReports ? <Loader2 className="h-10 w-10 animate-spin mx-auto" /> : `${verifiedCount}+`}</div>
            <div className="text-blue-100 font-bold uppercase tracking-widest text-sm">{t('Verified Incidents')}</div>
          </div>
          <div>
            <div className="text-5xl font-black mb-2 tracking-tighter">₹50K+</div>
            <div className="text-blue-100 font-bold uppercase tracking-widest text-sm">{t('Aid Distributed')}</div>
          </div>
          <div>
            <div className="text-5xl font-black mb-2 tracking-tighter">24/7</div>
            <div className="text-blue-100 font-bold uppercase tracking-widest text-sm">{t('AI Support')}</div>
          </div>
        </div>
      </div>

      <section className="py-24 bg-white w-full px-6">
        <div className="w-full text-center mb-20">
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">{t('How ReliefNet Works')}</h2>
          <p className="mt-4 text-xl text-slate-500 font-medium">{t('Empowering communities through technology and transparency.')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full text-left">
          <div className="p-12 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:shadow-2xl transition-all hover:scale-[1.02]">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-8 shadow-sm">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{t('Report Incidents')}</h3>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">{t('Instantly upload geo-tagged photos and videos of disasters. Your reports are verified in real-time by admins and AI to guide first responders.')}</p>
          </div>
          <div className="p-12 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:shadow-2xl transition-all hover:scale-[1.02]">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-8 shadow-sm">
              <Heart className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{t('Direct Impact')}</h3>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">{t('Track your donations with full transparency. See when supplies are purchased and delivered to the specific regions you supported.')}</p>
          </div>
          <div className="p-12 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:shadow-2xl transition-all hover:scale-[1.02]">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-8 shadow-sm">
              <Shield className="h-8 w-8" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-4">{t('Expert Verification')}</h3>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">{t('Our platform filters noise from reality. We use verified data sources and regional oversight to ensure integrity across the network.')}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;