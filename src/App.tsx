import { Routes, Route, NavLink } from 'react-router-dom';
import { Mail, Users, History, Settings } from 'lucide-react';
import CampaignPage from './pages/CampaignPage';
import ContactsPage from './pages/ContactsPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { useState, useEffect } from 'react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const APP_PASSWORD = import.meta.env.VITE_APP_PASSWORD || 'bookpromo2026';

  useEffect(() => {
    const stored = sessionStorage.getItem('bp_auth');
    if (stored === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === APP_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('bp_auth', 'true');
    } else {
      alert('Mot de passe incorrect');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-xl shadow-xl max-w-sm w-full">
          <h1 className="text-2xl font-bold text-white mb-6 text-center">Book Promo</h1>
          <p className="text-gray-400 text-sm mb-4 text-center">Accès privé — entrez le mot de passe</p>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-4" autoFocus />
          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition">Entrer</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-3">
        <div className="max-w-6xl mx-auto flex items-center gap-6">
          <h1 className="text-xl font-bold text-indigo-400 mr-8">Book Promo</h1>
          <NavLink to="/" end className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            <Mail size={16} /> Nouvelle campagne
          </NavLink>
          <NavLink to="/contacts" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            <Users size={16} /> Contacts
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            <History size={16} /> Historique
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>
            <Settings size={16} /> Config
          </NavLink>
        </div>
      </nav>
      <main className="max-w-6xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<CampaignPage />} />
          <Route path="/contacts" element={<ContactsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
