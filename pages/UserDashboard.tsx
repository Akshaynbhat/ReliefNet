
import React, { useState, useEffect, useRef } from 'react';
import { User, DisasterReport, ReportStatus, Donation } from '../types';
import { firestoreService } from '../services/firestoreService';
import { fetchWeather } from '../services/weather';
import { 
  MapPin, Camera, Send, Clock, AlertTriangle, Heart, Map as MapIcon, 
  Search, ShieldCheck, Cloud, Wind, Thermometer, Loader2, X, 
  Navigation, ExternalLink, Maximize2, CheckCircle2, User as UserIcon, 
  Save, ArrowLeft, RefreshCw, Maximize, UploadCloud, Calendar, IndianRupee,
  Play
} from 'lucide-react';
import { useTranslation } from '../components/LanguageContext';

interface UserDashboardProps {
  user: User;
  onUserUpdate: (user: User) => void;
  onNavigate: (page: string) => void;
}

const UserDashboard: React.FC<UserDashboardProps> = ({ user, onUserUpdate, onNavigate }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'reports' | 'new' | 'donations' | 'map' | 'profile' | 'safety'>('reports');
  const [reports, setReports] = useState<DisasterReport[]>([]);
  const [myDonations, setMyDonations] = useState<Donation[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{lat: number, lng: number} | undefined>(undefined);
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [profileName, setProfileName] = useState(user.name);
  const [profileAvatar, setProfileAvatar] = useState(user.avatar);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const pickerMapRef = useRef<any>(null);
  const pickerMapContainerRef = useRef<HTMLDivElement>(null);

  const [safetyQuery, setSafetyQuery] = useState('');
  const [safetyLocationData, setSafetyLocationData] = useState<{name: string, lat: number, lng: number} | null>(null);
  const [weather, setWeather] = useState<{ temp: number; wind: number; condition: string } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [searchedIncidents, setSearchedIncidents] = useState<DisasterReport[]>([]);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const safetyMapRef = useRef<any>(null);
  const safetyMapContainerRef = useRef<HTMLDivElement>(null);
  
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const isVideo = (url?: string) => url?.startsWith('data:video/') || url?.includes('video');

  useEffect(() => {
    refreshData();
  }, [user.id, activeTab]);

  useEffect(() => {
    if (activeTab === 'safety' && safetyMapRef.current) {
        setTimeout(() => {
            safetyMapRef.current.invalidateSize();
        }, 300);
    }
  }, [isMapFullscreen, activeTab]);

  useEffect(() => {
    if (activeTab === 'map' && mapContainerRef.current) {
      const L = (window as any).L;
      if (!L) return;
      if (mapRef.current) mapRef.current.remove();

      const map = L.map(mapContainerRef.current, {
        scrollWheelZoom: true,
        zoomControl: false
      }).setView([12.9716, 77.5946], 12);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      reports.forEach((report) => {
        if (report.coordinates) {
          const isVerified = report.status === ReportStatus.VERIFIED;
          const mediaHtml = isVideo(report.imageUrl) 
            ? `<video src="${report.imageUrl}" class="w-full h-full object-cover" autoplay muted loop></video>`
            : `<img src="${report.imageUrl}" class="w-full h-full object-cover" />`;
          
          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `
              <div class="relative flex items-center justify-center">
                <div class="absolute w-10 h-10 rounded-full ${isVerified ? 'bg-blue-600' : 'bg-amber-500'} opacity-20 animate-ping"></div>
                <div class="relative w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center ${isVerified ? 'bg-blue-600' : 'bg-amber-500'}">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                </div>
              </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
          });

          L.marker([report.coordinates.lat, report.coordinates.lng], { icon: customIcon })
            .addTo(map)
            .bindPopup(`
              <div class="p-0 text-left w-64 overflow-hidden rounded-xl border-0 shadow-none">
                <div class="relative h-32 overflow-hidden bg-slate-900">
                  ${mediaHtml}
                  <div class="absolute top-2 right-2 px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider bg-white/95 text-slate-900 shadow-sm border border-slate-100">${report.status}</div>
                </div>
                <div class="p-4 bg-white">
                  <h4 class="font-black text-base text-slate-900 leading-tight mb-2">${report.title}</h4>
                  <p class="text-[11px] text-slate-500 font-medium mb-3 flex items-start">
                    <svg class="w-3 h-3 mr-1 text-slate-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    ${report.location}
                  </p>
                  <a href="https://www.google.com/maps/dir/?api=1&destination=${report.coordinates.lat},${report.coordinates.lng}" 
                     target="_blank" 
                     class="block w-full text-center py-2 bg-slate-900 text-white text-[11px] font-black rounded-lg hover:bg-blue-600 transition-colors">
                     ${t('GET DIRECTIONS')}
                  </a>
                </div>
              </div>
            `, {
              maxWidth: 300,
              className: 'custom-popup'
            });
        }
      });
      mapRef.current = map;
    }
  }, [activeTab, reports, t]);

  // Safety Map Initialization
  useEffect(() => {
    if (activeTab === 'safety' && safetyMapContainerRef.current && safetyLocationData) {
      const L = (window as any).L;
      if (!L) return;

      if (safetyMapRef.current) {
        safetyMapRef.current.remove();
        safetyMapRef.current = null;
      }

      const map = L.map(safetyMapContainerRef.current, {
        scrollWheelZoom: true,
        zoomControl: false
      }).setView([safetyLocationData.lat, safetyLocationData.lng], 14);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      L.circle([safetyLocationData.lat, safetyLocationData.lng], {
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: 0.1,
        radius: 1000
      }).addTo(map);

      searchedIncidents.forEach(incident => {
        if (incident.coordinates) {
          L.marker([incident.coordinates.lat, incident.coordinates.lng])
            .addTo(map)
            .bindPopup(`<b>${incident.title}</b><br>${incident.location}`);
        }
      });

      safetyMapRef.current = map;
    }
  }, [activeTab, safetyLocationData, searchedIncidents]);

  // Picker Map Initialization
  useEffect(() => {
    if (showMapPicker && pickerMapContainerRef.current) {
      const L = (window as any).L;
      if (!L) return;
      
      if (pickerMapRef.current) {
        pickerMapRef.current.remove();
        pickerMapRef.current = null;
      }

      const map = L.map(pickerMapContainerRef.current, {
        scrollWheelZoom: true,
        zoomControl: false
      }).setView([12.9716, 77.5946], 12);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      let marker: any;
      map.on('click', (e: any) => {
        const { lat, lng } = e.latlng;
        if (marker) marker.remove();
        marker = L.marker([lat, lng]).addTo(map);
        setCoordinates({ lat, lng });
        setLocation(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
      });

      pickerMapRef.current = map;
      
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    }
  }, [showMapPicker]);

  const refreshData = async () => {
    setIsLoadingData(true);
    try {
      const [allReports, donations] = await Promise.all([
        firestoreService.getReports(),
        firestoreService.getUserDonations(user.id)
      ]);
      setReports(allReports);
      setMyDonations(donations);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleFetchWeather = async () => {
    if (!safetyQuery) return;
    setLoadingWeather(true);
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(safetyQuery)}&count=1&language=en&format=json`);
      const geoData = await geoRes.json();
      if (geoData.results && geoData.results.length > 0) {
        const loc = geoData.results[0];
        setSafetyLocationData({ name: loc.name, lat: loc.latitude, lng: loc.longitude });
        const weatherData = await fetchWeather(loc.name);
        if (weatherData) {
          setWeather({ temp: weatherData.temperature, wind: weatherData.windSpeed, condition: weatherData.conditionText });
        }
        const localIncidents = reports.filter(r => 
          r.status === ReportStatus.VERIFIED && 
          (r.location.toLowerCase().includes(safetyQuery.toLowerCase()) || 
           r.title.toLowerCase().includes(safetyQuery.toLowerCase()))
        );
        setSearchedIncidents(localIncidents);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handlePickerSearch = async () => {
    if (!pickerSearchQuery) return;
    try {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(pickerSearchQuery)}&count=1&language=en&format=json`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const loc = data.results[0];
        if (pickerMapRef.current) {
          pickerMapRef.current.setView([loc.latitude, loc.longitude], 15);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUseGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCoordinates({ lat, lng });
          setLocation(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
        },
        () => alert(t("Unable to retrieve your location."))
      );
    } else {
      alert(t("Geolocation is not supported by your browser."));
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

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim() || !previewUrl) {
      alert(t("Validation Error: Please fill all required fields and upload evidence."));
      return;
    }

    setIsSubmitting(true);
    try {
      await firestoreService.addReport({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        title,
        description,
        location,
        coordinates: coordinates,
        imageUrl: previewUrl,
        status: ReportStatus.PENDING,
        timestamp: Date.now(),
        upvotes: 0
      });
      setTitle(''); setDescription(''); setLocation('');
      setCoordinates(undefined); setImage(null); setPreviewUrl(null);
      setActiveTab('reports');
      refreshData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const myReports = reports.filter(r => r.userId === user.id);

  return (
    <div className="w-full px-6 py-10 min-h-screen">
      <div className="mb-10 text-left">
        <button onClick={() => onNavigate('landing')} className="flex items-center text-slate-500 hover:text-blue-600 font-bold text-base transition-colors mb-6 group">
          <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" /> {t('Back to Home')}
        </button>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{t('My Dashboard')}</h1>
            <p className="text-slate-500 text-lg mt-2 font-medium">{t('Manage your reports and track your impact')}</p>
          </div>
          <div className="flex flex-wrap bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200">
            {(['reports', 'new', 'safety', 'donations', 'map', 'profile'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`px-5 md:px-7 py-3 rounded-xl text-base font-black transition-all capitalize ${activeTab === tab ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'}`}>
                {tab === 'reports' ? t('My Reports') : tab === 'new' ? t('New Report') : tab === 'safety' ? t('Safety Check') : tab === 'donations' ? t('Track Donations') : tab === 'map' ? t('Live Map') : t('Profile')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="max-w-2xl mx-auto animate-fade-in-up">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 p-10 md:p-14 text-left">
            <div className="flex items-center space-x-4 mb-12">
              <UserIcon className="h-8 w-8 text-blue-600" />
              <h2 className="text-3xl font-black text-slate-900">{t('Edit Profile')}</h2>
            </div>
            <div className="flex flex-col items-center mb-12">
              <div className="relative group">
                <img src={profileAvatar || "https://ui-avatars.com/api/?name=User"} alt="Profile" className="w-40 h-40 rounded-full object-cover border-[6px] border-white shadow-2xl" />
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
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">{t('Full Name')}</label>
                <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white outline-none transition-all font-bold text-slate-900 text-lg" />
              </div>
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">{t('Email')}</label>
                <input type="text" value={user.email} disabled className="w-full px-6 py-5 bg-slate-100 border border-slate-200 rounded-2xl font-bold text-slate-400 text-lg cursor-not-allowed" />
              </div>
              <div className="pt-8">
                <button onClick={handleUpdateProfile} disabled={isUpdatingProfile} className="w-full px-10 py-5 bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 transition-all flex items-center justify-center shadow-2xl active:scale-95 disabled:opacity-50">
                  {isUpdatingProfile ? <Loader2 className="animate-spin h-6 w-6 mr-3" /> : <Save className="h-6 w-6 mr-3" />} {t('Save Changes')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'new' && (
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in-up max-w-7xl mx-auto">
          <div className="bg-blue-600 px-8 py-6 flex items-start space-x-4 text-white">
            <div className="bg-white/20 p-2 rounded-lg"><AlertTriangle className="h-8 w-8 text-white" /></div>
            <div className="text-left">
              <h2 className="text-2xl font-bold">{t('Report a Disaster')}</h2>
              <p className="text-blue-100 opacity-90 text-sm">{t('Provide accurate details for faster verification.')}</p>
            </div>
          </div>
          <form onSubmit={handleSubmitReport} className="p-10 space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">{t('Disaster Title')}</label>
                  <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('e.g., Heavy Street Flooding')} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">{t('Detailed Description')}</label>
                  <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={7} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder={t("Describe what's happening...")} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">{t('Location')}</label>
                  <input required type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl mb-6" placeholder={t('Address')} />
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={handleUseGPS} className="flex items-center justify-center py-4 px-4 bg-slate-50 text-slate-700 rounded-xl border border-slate-200 hover:bg-slate-100 font-bold text-sm transition-all">
                      <Navigation className="h-5 w-5 mr-3 text-blue-600" /> {t('Use My GPS')}
                    </button>
                    <button type="button" onClick={() => setShowMapPicker(true)} className="flex items-center justify-center py-4 px-4 bg-blue-50 text-blue-700 rounded-xl border border-blue-100 hover:bg-blue-100 font-bold text-sm transition-all">
                      <MapIcon className="h-5 w-5 mr-3" /> {t('Pin on Map')}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-col">
                <label className="block text-sm font-bold text-slate-600 mb-2">{t('Evidence (Photo or Video)')}</label>
                <div className="flex-1 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-slate-100/50 transition-all relative overflow-hidden group min-h-[400px] flex flex-col items-center justify-center cursor-pointer">
                  {previewUrl ? (
                    isVideo(previewUrl) ? (
                      <video src={previewUrl} className="absolute inset-0 w-full h-full object-cover" autoPlay muted loop />
                    ) : (
                      <img src={previewUrl} className="absolute inset-0 w-full h-full object-cover" />
                    )
                  ) : (
                    <div className="text-center p-8">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-6">
                        <Camera className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-bold text-base">{t('Click or Drop Media Here')}</p>
                      <p className="text-slate-400 text-xs mt-2 font-medium">{t('Supports Image or Video')}</p>
                    </div>
                  )}
                  <input type="file" accept="image/*,video/*" required onChange={(e) => { 
                    if (e.target.files?.[0]) { 
                      setImage(e.target.files[0]); 
                      const reader = new FileReader(); 
                      reader.onloadend = () => setPreviewUrl(reader.result as string); 
                      reader.readAsDataURL(e.target.files[0]); 
                    } 
                  }} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>
            <div className="flex justify-end pt-8 border-t border-slate-100">
              <button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-2xl font-black shadow-xl flex items-center transition-all disabled:opacity-50 active:scale-95 text-lg">
                {isSubmitting ? <Loader2 className="animate-spin h-6 w-6 mr-3" /> : null} {t('Submit for Verification')} <Send className="h-5 w-5 ml-3" />
              </button>
            </div>
          </form>
        </div>
      )}

      {activeTab === 'map' && (
        <div className="w-full animate-fade-in-up">
           <div className="bg-white rounded-[2.5rem] shadow-2xl border-[12px] border-white overflow-hidden h-[700px] relative">
              <div ref={mapContainerRef} className="w-full h-full z-0" />
              <div className="absolute top-8 left-8 z-[500] bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/20 max-w-sm text-left">
                  <div className="flex items-center mb-4">
                    <div className="p-3 bg-blue-600 rounded-2xl mr-4 shadow-lg shadow-blue-500/30">
                      <MapIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-900">{t('Live Crisis Map')}</h3>
                  </div>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{t('Verified reports across Bangalore. Click markers for evidence and status.')}</p>
                  <div className="mt-8 space-y-4">
                    <div className="flex items-center text-xs font-black text-slate-700 tracking-wider">
                      <div className="w-5 h-5 bg-blue-600 rounded-full mr-4 shadow-md border-4 border-white"></div> 
                      {t('VERIFIED INCIDENT')}
                    </div>
                    <div className="flex items-center text-xs font-black text-slate-700 tracking-wider">
                      <div className="w-5 h-5 bg-amber-500 rounded-full mr-4 shadow-md border-4 border-white"></div> 
                      {t('PENDING REVIEW')}
                    </div>
                  </div>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'safety' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 animate-fade-in-up text-left">
           <div className="space-y-10">
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
                 <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center"><ShieldCheck className="h-7 w-7 text-blue-600 mr-3" /> {t('Safety Analysis')}</h2>
                 <div className="flex gap-4 mb-10">
                    <input type="text" value={safetyQuery} onChange={e => setSafetyQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleFetchWeather()} placeholder={t("Enter area name...")} className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold focus:ring-2 focus:ring-blue-600 transition-all" />
                    <button onClick={handleFetchWeather} disabled={loadingWeather} className="bg-blue-600 text-white px-8 rounded-2xl font-black transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/20">{loadingWeather ? <Loader2 className="animate-spin h-6 w-6" /> : <Search className="h-6 w-6" />}</button>
                 </div>
                 {weather && (
                   <div className="grid grid-cols-3 gap-6 animate-fade-in-up">
                      <div className="bg-blue-50 p-6 rounded-3xl text-center border border-blue-100"><Thermometer className="h-8 w-8 text-blue-600 mx-auto mb-3" /><p className="text-sm font-bold text-blue-400 uppercase">{t('Temp')}</p><p className="text-2xl font-black text-blue-900">{weather.temp}°C</p></div>
                      <div className="bg-emerald-50 p-6 rounded-3xl text-center border border-emerald-100"><Wind className="h-8 w-8 text-emerald-600 mx-auto mb-3" /><p className="text-sm font-bold text-emerald-400 uppercase">{t('Wind')}</p><p className="text-2xl font-black text-emerald-900">{weather.wind} km/h</p></div>
                      <div className="bg-amber-50 p-6 rounded-3xl text-center border border-amber-100"><Cloud className="h-8 w-8 text-amber-600 mx-auto mb-3" /><p className="text-sm font-bold text-amber-400 uppercase">{t('Sky')}</p><p className="text-lg font-black text-amber-900 truncate">{t(weather.condition)}</p></div>
                   </div>
                 )}
              </div>
              <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-8 border-b border-slate-100 font-black text-slate-900 flex justify-between items-center"><h3>{t('Incidents in this Area')}</h3><span className="text-xs bg-slate-100 px-3 py-1 rounded-full">{searchedIncidents.length} {t('Found')}</span></div>
                <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-50">
                  {searchedIncidents.length === 0 ? <div className="p-10 text-center text-slate-400 font-medium">{t('No verified threats detected here.')}</div> : searchedIncidents.map(r => (
                    <div key={r.id} className="p-6 hover:bg-slate-50 transition-colors flex gap-5">
                       <img src={r.imageUrl} className="h-16 w-16 rounded-xl object-cover" />
                       <div><h4 className="font-bold text-slate-900">{r.title}</h4><p className="text-sm text-slate-500 line-clamp-2">{r.description}</p></div>
                    </div>
                  ))}
                </div>
              </div>
           </div>
           <div className={`relative rounded-[2.5rem] border-4 border-white overflow-hidden shadow-2xl transition-all ${isMapFullscreen ? 'fixed inset-10 z-[60]' : 'h-full min-h-[500px]'}`}>
              <div ref={safetyMapContainerRef} className="w-full h-full" />
              <button onClick={() => setIsMapFullscreen(!isMapFullscreen)} className="absolute top-6 right-6 z-10 bg-white/90 p-3 rounded-2xl shadow-xl border border-white/20 hover:scale-110 transition-all">{isMapFullscreen ? <X className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}</button>
           </div>
        </div>
      )}

      {activeTab === 'donations' && (
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-fade-in-up max-w-7xl mx-auto text-left">
          <div className="p-8 md:p-10 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center space-x-4 text-red-500 mb-3">
              <Heart className="h-8 w-8 fill-current" />
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{t('Your Contributions')}</h2>
            </div>
            <p className="text-slate-500 text-sm md:text-base font-medium">{t('Tracking the lifecycle of your donation from receipt to impact.')}</p>
          </div>

          <div className="w-full">
            <div className="hidden sm:grid sm:grid-cols-4 bg-slate-100/50 text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] border-b border-slate-100">
               <div className="px-10 py-6">{t('Target Campaign')}</div>
               <div className="px-10 py-6">{t('Date Logged')}</div>
               <div className="px-10 py-6">{t('Amount')}</div>
               <div className="px-10 py-6">{t('Live Status')}</div>
            </div>

            <div className="divide-y divide-slate-100">
              {myDonations.length === 0 ? (
                <div className="px-10 py-32 text-center text-slate-300 font-bold text-lg">{t("You haven't logged any donations yet.")}</div>
              ) : myDonations.map((donation) => (
                <div key={donation.id} className="grid grid-cols-1 sm:grid-cols-4 hover:bg-slate-50/60 transition-all group items-start sm:items-center p-6 sm:p-0">
                  <div className="sm:px-10 sm:py-8 mb-4 sm:mb-0">
                    <p className="text-[10px] sm:hidden font-black text-slate-400 uppercase tracking-widest mb-1">{t('Campaign')}</p>
                    <p className="font-black text-slate-700 text-lg group-hover:text-blue-600 transition-colors">{donation.campaign}</p>
                  </div>

                  <div className="sm:px-10 sm:py-8 mb-4 sm:mb-0">
                    <p className="text-[10px] sm:hidden font-black text-slate-400 uppercase tracking-widest mb-1">{t('Date')}</p>
                    <div className="flex items-center font-bold text-slate-400 text-sm">
                      <Calendar className="h-4 w-4 mr-2 sm:hidden" />
                      {new Date(donation.timestamp).toLocaleDateString('en-GB')}
                    </div>
                  </div>

                  <div className="sm:px-10 sm:py-8 mb-4 sm:mb-0">
                    <p className="text-[10px] sm:hidden font-black text-slate-400 uppercase tracking-widest mb-1">{t('Amount')}</p>
                    <div className="flex items-center font-black text-xl sm:text-2xl text-slate-800 tracking-tight">
                       <IndianRupee className="h-4 w-4 mr-1 sm:hidden" />
                       ₹{donation.amount.toLocaleString()}
                    </div>
                  </div>

                  <div className="sm:px-10 sm:py-8 mb-6 sm:mb-0">
                    <p className="text-[10px] sm:hidden font-black text-slate-400 uppercase tracking-widest mb-2">{t('Status')}</p>
                    <div className="inline-block px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider bg-blue-50/80 text-blue-700 border-2 border-blue-100 shadow-sm leading-tight w-full sm:max-w-[220px] whitespace-normal text-center sm:text-left">
                      {t(donation.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10 animate-fade-in-up">
          {myReports.length === 0 ? (
            <div className="col-span-full py-40 text-center bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
              <h3 className="text-3xl font-black text-slate-400">{t('No Reports Filed Yet')}</h3>
            </div>
          ) : (
            myReports.map(report => (
              <div key={report.id} className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden hover:shadow-2xl transition-all group text-left flex flex-col h-full">
                <div className="h-60 overflow-hidden relative bg-slate-900">
                  {isVideo(report.imageUrl) ? (
                    <>
                      <video src={report.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" muted />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Play className="h-10 w-10 text-white fill-current" />
                      </div>
                    </>
                  ) : (
                    <img src={report.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  )}
                  <div className={`absolute top-5 right-5 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white/95 shadow-xl border-2 ${report.status === ReportStatus.VERIFIED ? 'text-emerald-600 border-emerald-100' : 'text-amber-600 border-amber-100'}`}>{t(report.status)}</div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-xl font-black text-slate-900 mb-3 truncate">{report.title}</h3>
                  <p className="text-slate-500 text-sm line-clamp-3 mb-6 leading-relaxed font-medium">{report.description}</p>
                  
                  {report.coordinates && (
                     <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${report.coordinates.lat},${report.coordinates.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center w-full py-3 bg-slate-50 border border-slate-200 rounded-xl text-blue-600 text-xs font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all mb-6 group/btn"
                    >
                      <Navigation className="h-4 w-4 mr-2 group-hover/btn:rotate-12 transition-transform" /> 
                      {t('Get Directions')}
                    </a>
                  )}

                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <Clock className="h-4 w-4 mr-2" /> 
                    {new Date(report.timestamp).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showMapPicker && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xl">
          <div className="bg-white w-full max-w-5xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/20 animate-fade-in-up">
            <div className="p-8 bg-white border-b border-slate-100 flex justify-between items-center text-left">
              <div className="flex items-center"><MapPin className="h-8 w-8 text-blue-600 mr-4" /><div><h3 className="text-2xl font-black text-slate-900">{t('Pinpoint Accuracy')}</h3><p className="text-slate-500 font-medium text-sm">{t('Search or click to select the exact incident location.')}</p></div></div>
              <button onClick={() => setShowMapPicker(false)} className="p-4 hover:bg-slate-100 rounded-full transition-colors"><X className="h-7 w-7 text-slate-400" /></button>
            </div>
            <div className="p-4 bg-white border-b border-slate-100 flex gap-4"><input type="text" value={pickerSearchQuery} onChange={e => setPickerSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePickerSearch()} placeholder={t("Search for location...")} className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold" /><button onClick={handlePickerSearch} className="bg-blue-600 text-white px-8 rounded-2xl font-black">{t('Search')}</button></div>
            <div ref={pickerMapContainerRef} className="h-[500px] w-full" />
            <div className="p-8 bg-slate-50 flex justify-end gap-4"><button onClick={() => setShowMapPicker(false)} className="px-10 py-4 bg-white text-slate-700 rounded-2xl font-black border border-slate-200">{t('Cancel')}</button><button onClick={() => setShowMapPicker(false)} className="bg-blue-600 text-white px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-500/20">{t('Confirm Location')}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
