import { useState, useEffect } from 'react';
import { History, ChevronDown, ChevronUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Campaign, SendLog } from '../lib/types';

export default function HistoryPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<SendLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    supabase.from('promo_campaigns').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setCampaigns(data || []); setLoading(false); });
  }, []);

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    setLogsLoading(true);
    const { data } = await supabase.from('promo_send_logs').select('*').eq('campaign_id', id).order('created_at', { ascending: true });
    setLogs(data || []);
    setLogsLoading(false);
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case 'completed': return <span className="flex items-center gap-1 text-green-400 text-xs font-medium"><CheckCircle size={12} /> Terminée</span>;
      case 'failed': return <span className="flex items-center gap-1 text-red-400 text-xs font-medium"><XCircle size={12} /> Échouée</span>;
      case 'sending': return <span className="flex items-center gap-1 text-yellow-400 text-xs font-medium"><Clock size={12} /> En cours</span>;
      default: return <span className="text-gray-400 text-xs">{status}</span>;
    }
  };

  if (loading) return <div className="flex items-center gap-3 text-gray-400 py-12 justify-center"><History size={20} className="animate-pulse" /> Chargement...</div>;
  if (campaigns.length === 0) return <div className="text-center py-12"><History size={48} className="mx-auto text-gray-600 mb-4" /><p className="text-gray-400">Aucune campagne envoyée pour l'instant.</p></div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Historique des campagnes</h2>
      <div className="space-y-3">
        {campaigns.map(campaign => (
          <div key={campaign.id} className="bg-gray-800 rounded-lg overflow-hidden">
            <button onClick={() => toggleExpand(campaign.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-700/50 transition text-left">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-white font-medium">{campaign.book_title}</h3>
                  {statusBadge(campaign.status)}
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  {new Date(campaign.created_at).toLocaleString('fr-FR')} — {campaign.sent_count} envoyé{campaign.sent_count !== 1 ? 's' : ''}, {campaign.failed_count} échec{campaign.failed_count !== 1 ? 's' : ''}
                </p>
              </div>
              {expandedId === campaign.id ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>
            {expandedId === campaign.id && (
              <div className="border-t border-gray-700 px-5 py-4">
                {logsLoading ? <p className="text-gray-400 text-sm">Chargement des logs...</p>
                : logs.length === 0 ? <p className="text-gray-500 text-sm">Aucun log disponible.</p>
                : (
                  <div className="max-h-64 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="text-gray-400 border-b border-gray-700"><th className="text-left py-2 px-2">Email</th><th className="text-left py-2 px-2">Statut</th><th className="text-left py-2 px-2">Erreur</th></tr></thead>
                      <tbody>
                        {logs.map(log => (
                          <tr key={log.id} className="border-b border-gray-700/30">
                            <td className="py-1.5 px-2 text-gray-300">{log.email}</td>
                            <td className="py-1.5 px-2">{log.status === 'sent' ? <span className="text-green-400">Envoyé</span> : log.status === 'failed' ? <span className="text-red-400">Échec</span> : <span className="text-gray-400">En attente</span>}</td>
                            <td className="py-1.5 px-2 text-red-300 max-w-[200px] truncate">{log.error_message || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
