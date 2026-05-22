import { useState, useEffect } from 'react';
import { Save, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { loadBrevoConfig, saveBrevoConfig } from '../lib/brevo-config';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [saved, setSaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    const config = loadBrevoConfig();
    if (config) {
      setApiKey(config.api_key);
      setSenderName(config.sender_name);
      setSenderEmail(config.sender_email);
    }
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveBrevoConfig({ api_key: apiKey, sender_name: senderName, sender_email: senderEmail });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-2xl font-bold text-white mb-6">Configuration Brevo</h2>
      <p className="text-gray-400 text-sm mb-6">
        Configurez votre clé API Brevo et les informations d'expéditeur.
        Ces données sont stockées localement dans votre navigateur.
      </p>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Clé API Brevo</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="xkeysib-..."
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Trouvable dans Brevo → SMTP &amp; API → Clés API
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Nom de l'expéditeur</label>
          <input
            type="text"
            value={senderName}
            onChange={e => setSenderName(e.target.value)}
            placeholder="Encre Magique"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Email expéditeur</label>
          <input
            type="email"
            value={senderEmail}
            onChange={e => setSenderEmail(e.target.value)}
            placeholder="contact@encremagique.org"
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Doit être vérifié dans Brevo (Senders &amp; IP)
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
        >
          {saved ? <CheckCircle size={18} /> : <Save size={18} />}
          {saved ? 'Enregistré !' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
}
