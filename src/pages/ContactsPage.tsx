import { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, Users, Search, AlertCircle } from 'lucide-react';
import { parseCSV } from '../lib/csv-parser';
import { supabase } from '../lib/supabase';
import type { Contact } from '../lib/types';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ added: number; duplicates: number } | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('promo_contacts')
      .select('*')
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
    } else {
      setContacts(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const rows = parseCSV(text);

        if (rows.length === 0) {
          setError('Fichier CSV vide ou invalide');
          setImporting(false);
          return;
        }

        // Trouver la colonne email (flexible)
        const emailKey = Object.keys(rows[0]).find(
          k => k.toLowerCase().includes('email') || k.toLowerCase().includes('mail')
        );

        if (!emailKey) {
          setError('Aucune colonne "email" trouvée dans le CSV');
          setImporting(false);
          return;
        }

        // Extraire et nettoyer les emails
        const emails = rows
          .map(row => row[emailKey]?.trim().toLowerCase())
          .filter((email): email is string => {
            if (!email) return false;
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
          });

        // Dédupliquer
        const uniqueEmails = [...new Set(emails)];

        // Insérer par batch de 50 (upsert pour ignorer doublons)
        let added = 0;
        const batchSize = 50;

        for (let i = 0; i < uniqueEmails.length; i += batchSize) {
          const batch = uniqueEmails.slice(i, i + batchSize).map(email => ({
            email,
            source: file.name.replace('.csv', ''),
          }));

          const { data, error: insertError } = await supabase
            .from('promo_contacts')
            .upsert(batch, { onConflict: 'email', ignoreDuplicates: true })
            .select();

          if (insertError) {
            console.error('Insert error:', insertError);
          } else {
            added += (data || []).length;
          }
        }

        const duplicates = uniqueEmails.length - added;
        setImportResult({ added, duplicates });
        setImporting(false);
        fetchContacts();
      } catch (err) {
        setError(`Erreur parsing CSV: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
        setImporting(false);
      }
    };
    reader.onerror = () => {
      setError('Erreur de lecture du fichier');
      setImporting(false);
    };
    reader.readAsText(file);

    // Reset input
    e.target.value = '';
  };

  const handleDeleteAll = async () => {
    if (!confirm('Supprimer TOUS les contacts ? Cette action est irréversible.')) return;
    const { error: err } = await supabase.from('promo_contacts').delete().neq('id', '');
    if (err) {
      setError(err.message);
    } else {
      setContacts([]);
    }
  };

  const handleDeleteOne = async (id: string) => {
    const { error: err } = await supabase.from('promo_contacts').delete().eq('id', id);
    if (err) {
      setError(err.message);
    } else {
      setContacts(prev => prev.filter(c => c.id !== id));
    }
  };

  const filtered = contacts.filter(c =>
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Contacts</h2>
          <p className="text-gray-400 text-sm mt-1">
            {contacts.length} contact{contacts.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg cursor-pointer transition">
            <Upload size={16} />
            {importing ? 'Import en cours...' : 'Importer CSV'}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileImport}
              className="hidden"
              disabled={importing}
            />
          </label>
          {contacts.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm font-medium rounded-lg transition"
            >
              <Trash2 size={16} /> Tout supprimer
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 mb-4 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {importResult && (
        <div className="p-4 mb-4 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm">
          Import terminé : {importResult.added} ajouté{importResult.added !== 1 ? 's' : ''}, {importResult.duplicates} doublon{importResult.duplicates !== 1 ? 's' : ''} ignoré{importResult.duplicates !== 1 ? 's' : ''}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un email..."
          className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
        />
      </div>

      {/* Contact list */}
      {loading ? (
        <div className="flex items-center gap-3 text-gray-400 py-12 justify-center">
          <Users size={20} className="animate-pulse" /> Chargement...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {search ? 'Aucun résultat' : 'Aucun contact. Importez un fichier CSV pour commencer.'}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-gray-700">
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Source</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(contact => (
                <tr key={contact.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                  <td className="px-4 py-3 text-white">{contact.email}</td>
                  <td className="px-4 py-3 text-gray-400">{contact.source}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(contact.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDeleteOne(contact.id)}
                      className="text-gray-500 hover:text-red-400 transition"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
