import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Chatbot from './components/Chatbot';
import Toast, { ToastType } from './components/Toast';
import Landing from './pages/Landing';
import UserDashboard from './pages/UserDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Auth from './pages/Auth';
import Donations from './pages/Donations';
import { User, UserRole } from './types';
import { auth } from './services/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { firestoreService } from './services/firestoreService';
import { LanguageProvider } from './components/LanguageContext';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Toast State
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);

  const showToast = (message: string, type: ToastType) => {
    setToast({ message, type });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let dbUser = await firestoreService.getUser(firebaseUser.uid);
          
          if (dbUser) {
            setUser(dbUser);
          } else {
            // New user case: Default to user role if not found in db
            const newUser: User = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              role: UserRole.USER,
              avatar: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${firebaseUser.displayName || 'User'}&background=random`
            };
            await firestoreService.upsertUser(newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
           setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || 'User',
              role: UserRole.USER,
              avatar: firebaseUser.photoURL || ''
           });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Strict Route Guard useEffect
  useEffect(() => {
    if (!loading) {
      // 1. Unauthenticated access check: Redirect to login without error if user is missing
      if ((currentPage === 'admin-dashboard' || currentPage === 'user-dashboard') && !user) {
        setCurrentPage('login');
        return;
      }

      // 2. Admin Route Protection: Only role "admin"
      if (currentPage === 'admin-dashboard' && user) {
        if (user.role !== UserRole.ADMIN) {
          showToast("Access denied. Admins only.", "error");
          setCurrentPage('login');
          // We sign out here because an unauthorized user hit a high-security admin route
          signOut(auth).then(() => setUser(null));
        }
      }
      
      // 3. User Dashboard Protection: Only role "user"
      if (currentPage === 'user-dashboard' && user) {
        // Only trigger the "Access restricted" message if a user is LOGGED IN but is NOT a 'user'
        if (user.role !== UserRole.USER) {
          showToast("Access restricted to standard users.", "info");
          setCurrentPage('login');
        }
      }
    }
  }, [currentPage, user, loading]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      showToast("Signed out successfully. See you soon!", 'info');
      setCurrentPage('landing');
    } catch (error) {
      console.error("Error signing out:", error);
      showToast("Error signing out. Please try again.", 'error');
    }
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    showToast("Profile updated successfully", 'success');
  };

  const renderPage = () => {
    if (loading) return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

    switch (currentPage) {
      case 'landing':
        return <Landing onNavigate={setCurrentPage} user={user} />;
      case 'login':
        return <Auth onNavigate={setCurrentPage} showToast={showToast} />;
      case 'user-dashboard':
        return user && user.role === UserRole.USER 
          ? <UserDashboard user={user} onUserUpdate={handleUserUpdate} onNavigate={setCurrentPage} /> 
          : <Auth onNavigate={setCurrentPage} showToast={showToast} />;
      case 'admin-dashboard':
        return user && user.role === UserRole.ADMIN 
          ? <AdminDashboard user={user} onUserUpdate={handleUserUpdate} onNavigate={setCurrentPage} /> 
          : <Auth onNavigate={setCurrentPage} showToast={showToast} />;
      case 'donations':
        return <Donations user={user} showToast={showToast} />;
      default:
        return <Landing onNavigate={setCurrentPage} user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full overflow-x-hidden">
      <Navbar 
        user={user} 
        onLogout={handleLogout} 
        onNavigate={setCurrentPage}
        currentPage={currentPage}
      />
      
      <main className="flex-grow w-full">
        {renderPage()}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm no-print w-full mt-auto">
        <div className="w-full px-6 text-center">
          <p>&copy; {new Date().getFullYear()} ReliefNet Bangalore. Disaster Relief Coordination Platform.</p>
          <p className="mt-2 text-xs">For emergency assistance, please dial 112 or 100 immediately.</p>
        </div>
      </footer>

      <Chatbot />
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
};

export default App;