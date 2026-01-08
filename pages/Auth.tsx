import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signOut } from 'firebase/auth';
import { UserRole } from '../types';
import { AlertCircle, Lock, Mail, ArrowRight, User as UserIcon, Loader2, ShieldAlert, ArrowLeft } from 'lucide-react';
import { ToastType } from '../components/Toast';
import { firestoreService } from '../services/firestoreService';

interface AuthProps {
  onNavigate: (page: string) => void;
  showToast: (message: string, type: ToastType) => void;
}

const Auth: React.FC<AuthProps> = ({ onNavigate, showToast }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'admin'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (!email.includes('@')) throw new Error("Please enter a valid email");
      if (password.length < 6) throw new Error("Password must be at least 6 characters");
      if (mode === 'signup' && !name) throw new Error("Please enter your full name");
      
      let finalTargetRole = UserRole.USER;
      
      if (mode === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await updateProfile(user, { displayName: name });
        await firestoreService.upsertUser({
          id: user.uid,
          name: name,
          email: user.email || '',
          role: UserRole.USER,
          avatar: `https://ui-avatars.com/api/?name=${name}&background=random`
        });
        showToast("Account created successfully!", 'success');
        finalTargetRole = UserRole.USER;
      } else {
        // 1. Authenticate with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // 2. Fetch User Metadata from Firestore immediately
        const dbUser = await firestoreService.getUser(firebaseUser.uid);
        
        if (mode === 'admin') {
           // Requirement: Only allow users whose role is "admin" to log in here.
           if (!dbUser || dbUser.role !== UserRole.ADMIN) {
             await signOut(auth); // Immediately sign the user out
             throw new Error("You are not authorized to access the admin panel.");
           }
           finalTargetRole = UserRole.ADMIN;
           showToast("Welcome to the Admin Portal", 'success');
        } else {
           // Requirement: If an account with role "admin" tries to log in using this form, block it.
           if (dbUser && dbUser.role === UserRole.ADMIN) {
             await signOut(auth); // Immediately sign the user out
             throw new Error("Admins must log in through the Admin Portal.");
           }
           
           // Standard User or new profile check
           if (dbUser) finalTargetRole = dbUser.role;
           showToast(`Welcome back, ${firebaseUser.displayName || 'User'}!`, 'success');
        }
      }
      
      // 3. Navigation: Redirect users to their specific dashboard
      onNavigate(finalTargetRole === UserRole.ADMIN ? 'admin-dashboard' : 'user-dashboard');

    } catch (err: any) {
      console.error("Auth Error:", err);
      let msg = "Authentication failed";
      
      if (err.code === 'auth/invalid-credential') msg = "Invalid credentials. Please check your email and password.";
      else if (err.code === 'auth/user-not-found') msg = "User not found.";
      else if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
      else if (err.code === 'auth/email-already-in-use') msg = "Email already registered.";
      else if (err.message) msg = err.message; // Capture custom throw messages
      
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === 'admin') return 'Admin Portal';
    if (mode === 'signup') return 'Create Account';
    return 'Welcome Back';
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-50 w-full text-left">
      <div className="w-full px-6 py-6 md:py-10">
        <button 
          onClick={() => onNavigate('landing')}
          className="flex items-center text-slate-500 hover:text-blue-600 font-bold transition-colors text-base"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </button>
      </div>

      <div className="flex-grow flex items-center justify-center px-6 pb-20">
        <div className="max-w-md w-full">
          <div className={`bg-white rounded-3xl shadow-2xl p-10 border ${mode === 'admin' ? 'border-red-200 ring-8 ring-red-50/50' : 'border-slate-100'} animate-fade-in-up transition-all`}>
            <div className="text-center mb-10">
              {mode === 'admin' && <ShieldAlert className="h-14 w-14 text-red-600 mx-auto mb-4" />}
              <h2 className={`text-4xl font-black tracking-tight ${mode === 'admin' ? 'text-red-900' : 'text-slate-900'}`}>{getTitle()}</h2>
              <p className="text-slate-500 mt-3 text-lg">
                {mode === 'admin' ? 'Secure access for relief coordinators' : (mode === 'signup' ? 'Join the relief network today' : 'Sign in to access your dashboard')}
              </p>
            </div>

            {error && (
              <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center rounded-r-xl shadow-sm">
                <AlertCircle className="h-5 w-5 mr-3 shrink-0" />
                <span className="text-sm font-bold leading-snug">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                      placeholder="e.g. Akshay Bhat"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wide">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:bg-white focus:border-blue-500 outline-none transition-all font-bold text-slate-900"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 text-lg
                  ${mode === 'admin' ? 'bg-red-700 hover:bg-red-800 shadow-red-500/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}
              >
                {isLoading ? <Loader2 className="animate-spin h-6 w-6" /> : (mode === 'admin' ? 'Access Admin Panel' : (mode === 'signin' ? 'Sign In' : 'Create Account'))}
                {!isLoading && <ArrowRight className="ml-2 h-6 w-6" />}
              </button>
            </form>

            {mode !== 'admin' && (
              <div className="mt-8 text-center">
                <button 
                  onClick={() => {
                    setMode(mode === 'signin' ? 'signup' : 'signin');
                    setError('');
                    setEmail('');
                    setPassword('');
                  }} 
                  className="text-blue-600 hover:text-blue-800 text-sm font-black uppercase tracking-widest transition-colors"
                >
                  {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            )}
            
            {mode === 'admin' && (
              <div className="mt-8 text-center border-t border-slate-100 pt-6">
                 <button 
                  onClick={() => {
                    setMode('signin');
                    setError('');
                    setEmail('');
                    setPassword('');
                  }} 
                  className="text-slate-500 hover:text-slate-800 text-sm font-bold flex items-center justify-center mx-auto"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Back to User Login
                </button>
              </div>
            )}
          </div>

          {mode !== 'admin' && (
            <div className="mt-10 text-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="inline-flex items-center space-x-3 bg-white px-8 py-4 rounded-2xl shadow-lg border border-slate-100">
                <ShieldAlert className="h-6 w-6 text-red-500" />
                <span className="text-sm font-bold text-slate-500">Authorized Personnel Only:</span>
                <button 
                  onClick={() => {
                    setMode('admin');
                    setError('');
                    setEmail('');
                    setPassword('');
                  }}
                  className="text-sm font-black text-slate-900 hover:text-blue-600 underline underline-offset-4 decoration-2"
                >
                  Admin Portal Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;