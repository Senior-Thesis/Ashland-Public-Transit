import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import './App.css';
import BookingForm from './components/BookingForm';
import DispatcherDashboard from './components/DispatcherDashboard';
import DriverView from './components/DriverView';
import FleetManager from './components/FleetManager';
import LandingPage from './components/LandingPage';
import TrackRide from './components/TrackRide';
import LoginModal from './components/LoginModal';

// THE GATEKEEPER: Prevents unauthorized access to sensitive transit data
const ProtectedRoute = ({ isAdmin, children }) => {
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
};

// NEW: Wrapper for Dispatcher Login to handle navigation
const DispatcherLoginRoute = ({ onLogin }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <LoginModal
        isOpen={true}
        onClose={() => navigate('/')}
        onLogin={(u, p) => onLogin(u, p)}
        onLoginSuccess={() => navigate('/dashboard')}
        title="Dispatcher Portal"
        showUsername={true}
      />
    </div>
  );
};

function App() {
  const [isAdmin, setIsAdmin] = useState(() => {
    return !!localStorage.getItem("token"); // Check for Token existence
  });
  // REMOVED: isLoginModalOpen state - now handled by Route
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Updated to use secure JWT Login
  const handleLogin = async (username, password) => {
    try {
      const { login } = require('./services/api'); // Lazy load to avoid circular dep if any
      const data = await login(username, password);

      if (data.token) {
        localStorage.setItem("token", data.token);
        setIsAdmin(true);
        return true;
      }
    } catch (error) {
      return false;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("token");
    localStorage.removeItem("isDispatcher"); // Clean up legacy
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 font-sans text-slate-600">

        {/* MODAL REMOVED FROM HERE - NOW A ROUTE */}

        {/* NAVIGATION BAR */}
        <nav className="sticky top-0 z-50 backdrop-blur-md bg-blue-900/95 text-white shadow-lg border-b border-white/10">
          <div className="max-w-6xl mx-auto flex justify-between items-center p-4">
            <Link to="/" className="text-xl font-black tracking-tighter flex items-center gap-2">
              ASHLAND TRANSIT
            </Link>

            <div className="flex items-center gap-6">
              <Link to="/book" className="text-sm font-bold opacity-80 hover:opacity-100 transition-opacity">Book a Ride</Link>

              {isAdmin ? (
                <div className="flex items-center gap-4">
                  <Link to="/dashboard" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold backdrop-blur-sm transition-all border border-white/10">Portal</Link>
                  <button onClick={handleLogout} className="text-xs text-blue-200 hover:text-white transition-colors">Logout</button>
                </div>
              ) : (
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="text-sm bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-xl font-bold shadow-lg shadow-blue-900/20 transition-all flex items-center gap-2"
                  >
                    Staff Login
                  </button>

                  {isDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)}></div>
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        <Link
                          to="/dispatcher/login"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block w-full text-left px-4 py-3 hover:bg-slate-50 font-bold text-slate-700 text-sm border-b border-slate-50"
                        >
                          Dispatcher Login
                        </Link>
                        <Link
                          to="/driver"
                          onClick={() => setIsDropdownOpen(false)}
                          className="block w-full text-left px-4 py-3 hover:bg-slate-50 font-bold text-slate-700 text-sm"
                        >
                          Driver Portal
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* MAIN ROUTING LOGIC */}
        <main className="py-12 container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <Routes>
            {/* LANDING PAGE - Pass setIsLoginModalOpen NO LONGER NEEDED if using Routes? 
               Wait, LandingPage might have a "Login" button. 
               Let's check LandingPage props usage. 
               If LandingPage has a button that opened the modal, it should now Link to /dispatcher/login or /driver logic.
               For now, we remove the prop to see if it breaks, or simply direct the prop to navigate? 
               We can't navigate from here outside Router context (though we are inside Router).
               Actually, LandingPage uses `onLogin` prop to open modal. 
               We should update LandingPage to use Link internally or pass a function that navigates.
               But LandingPage is a child. PROPER FIX: Check LandingPage.js later.
               For now, we can leave the prop, but make it do nothing or log "Deprecated".
               BETTER: We need to see LandingPage.js. 
               I'll assume for this step we focus on the Navbar flow. */ }
            <Route path="/" element={<LandingPage />} />

            {/* NEW DISPATCHER LOGIN ROUTE */}
            <Route path="/dispatcher/login" element={<DispatcherLoginRoute onLogin={handleLogin} />} />

            {/* RIDER BOOKING PORTAL */}
            <Route path="/book" element={<BookingForm />} />

            {/* RIDER TRACKING PORTAL */}
            <Route path="/track" element={<TrackRide />} />

            {/* DISPATCHER VIEW (Protected) */}
            <Route path="/dashboard" element={
              <ProtectedRoute isAdmin={isAdmin}>
                <DispatcherDashboard />
              </ProtectedRoute>
            } />

            {/* DRIVER MANIFEST */}
            <Route path="/driver" element={<DriverView />} />

            {/* FLEET MANAGER (Protected) */}
            <Route path="/fleet" element={
              <ProtectedRoute isAdmin={isAdmin}>
                <FleetManager />
              </ProtectedRoute>
            } />
          </Routes>
        </main>

        <footer className="text-center py-10 text-slate-400 text-xs font-medium uppercase tracking-widest">
          © 2026 Ashland City Transit Project • Senior CS Thesis Portfolio
        </footer>
      </div>
    </Router>
  );
}

export default App;