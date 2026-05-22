import { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { loadBrevoConfig } from '../lib/brevo-config';
import { generateEmailHtml } from '../lib/email-template';
import type { CampaignFormData, SendEmailsResponse } from '../lib/types';

export default function CampaignPage() {
  const [form, setForm] = useState<CampaignFormData>({
    book_title: '',
    cover_url: '',
    amazon_url: '',
    description: '',
    subject: '',
  });
  const [contactCount, setContactCount] = useState(0);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const abortRef = useRef(false);

  useEffect(() => {
    supabase
      .from('promo_contacts')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setContactCount(count || 0));
  }, []);

  const updateField = (field: keyof CampaignFormData, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const brevoConfig = loadBrevoConfig();
    if (!brevoConfig || !brevoConfig.api_key) {
      setError('Veuillez configurer votre clé API Brevo dans l\'onglet Config.');
      return;
    }

    if (contactCount === 0) {
      setError('Aucun contact. Importez des contacts d\'abord.');
      return;
    }

    if (!confirm(`Envoyer cette campagne à ${contactCount} contacts ?`)) return;

    setSending(true);
    abortRef.current = false;
    setProgress({ sent: 0, failed: 0, total: contactCount });

    try {
      // 1. Créer la campagne en DB
      const { data: campaign, error: campError } = await supabase
        .from('promo_campaigns')
        .insert({
          title: `Promo: ${form.book_title}`,
          book_title: form.book_title,
          cover_url: form.cover_url,
          amazon_url: form.amazon_url,
          description: form.description,
          subject: form.subject,
          status: 'sending',
          total_emails: contactCount,
        })
        .select()
        .single();

      if (campError || !campaign) throw new Error(campError?.message || 'Erreur création campagne');

      // 2. Charger tous les contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('promo_contacts')
        .select('id, email');

      if (contactsError || !contacts) throw new Error(contactsError?.message || 'Erreur chargement contacts');

      // 3. Générer le HTML
      const htmlContent = generateEmailHtml({
        book_title: form.book_title,
        cover_url: form.cover_url,
        amazon_url: form.amazon_url,
        description: form.description,
      });

      // 4. Envoyer par batch de 10 via la Netlify Function
      const batchSize = 10;
      let totalSent = 0;
      let totalFailed = 0;

      for (let i = 0; i < contacts.length; i += batchSize) {
        if (abortRef.current) break;

        const batch = contacts.slice(i, i + batchSize).map(c => ({
          email: c.email,
          contact_id: c.id,
        }));

        try {
          const response = await fetch('/.netlify/functions/send-emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              campaign_id: campaign.id,
              brevo_api_key: brevoConfig.api_key,
              sender_name: brevoConfig.sender_name,
              sender_email: brevoConfig.sender_email,
              subject: form.subject,
              html_content: htmlContent,
              recipients: batch,
            }),
          });

          if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errText}`);
          }

          const result: SendEmailsResponse = await response.json();

          const logs = result.results.map(r => ({
            campaign_id: campaign.id,
            contact_id: r.contact_id,
            email: r.email,
            status: r.status,
            error_message: r.error || null,
            sent_at: r.status === 'sent' ? new Date().toISOString() : null,
          }));
          await supabase.from('promo_send_logs').insert(logs);

          const batchSent = result.results.filter(r => r.status === 'sent').length;
          const batchFailed = result.results.filter(r => r.status === 'failed').length;
          totalSent += batchSent;
          totalFailed += batchFailed;
          setProgress({ sent: totalSent, failed: totalFailed, total: contactCount });
        } catch (batchErr) {
          totalFailed += batch.length;
          setProgress({ sent: totalSent, failed: totalFailed, total: contactCount });
          const failLogs = batch.map(r => ({
            campaign_id: campaign.id,
            contact_id: r.contact_id,
            email: r.email,
            status: 'failed' as const,
            error_message: batchErr instanceof Error ? batchErr.message : 'Unknown error',
            sent_at: null,
          }));
          await supabase.from('promo_send_logs').insert(failLogs);
        }

        // Pause 1s entre batchs (rate limit Brevo)
        if (i + batchSize < contacts.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 5. Mettre à jour le statut campagne
      await supabase
        .from('promo_campaigns')
        .update({
          status: totalFailed === contactCount ? 'failed' : 'completed',
          sent_count: totalSent,
          failed_count: totalFailed,
          completed_at: new Date().toISOString(),
        })
        .eq('id', campaign.id);

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setSending(false);
    }
  };

  const handleAbort = () => {
    abortRef.current = true;
  };

  // L'aperçu se met à jour en temps réel quand on tape
  const previewHtml = generateEmailHtml({
    book_title: form.book_title || 'Titre du livre',
    cover_url: form.cover_url || 'https://via.placeholder.com/250x350/667eea/ffffff?text=Couverture',
    amazon_url: form.amazon_url || '#',
    description: form.description || 'Description de votre livre ici...',
  });

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-6">Nouvelle Campagne</h2>

      {/* ── Formulaire ── */}
      <form onSubmit={handleSend} className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Objet de l'email</label>
          <input
            type="text"
            value={form.subject}
            onChange={e => updateField('subject', e.target.value)}
            placeholder="Mon nouveau livre est disponible !"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Titre du livre</label>
          <input
            type="text"
            value={form.book_title}
            onChange={e => updateField('book_title', e.target.value)}
            placeholder="Mon Super Livre Air Fryer"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">URL de la couverture</label>
            <input
              type="url"
              value={form.cover_url}
              onChange={e => updateField('cover_url', e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">URL Amazon</label>
            <input
              type="url"
              value={form.amazon_url}
              onChange={e => updateField('amazon_url', e.target.value)}
              placeholder="https://amazon.fr/dp/..."
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description (corps de l'email)</label>
          <textarea
            value={form.description}
            onChange={e => updateField('description', e.target.value)}
            placeholder="Découvrez mon nouveau livre avec 131 recettes air fryer..."
            rows={4}
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm">
            <CheckCircle size={16} className="shrink-0" /> Campagne envoyée ! {progress.sent} envoyé{progress.sent !== 1 ? 's' : ''}, {progress.failed} échec{progress.failed !== 1 ? 's' : ''}
          </div>
        )}

        {sending && (
          <div className="p-4 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2 text-indigo-300 mb-2">
              <Loader2 size={16} className="animate-spin" /> Envoi en cours...
            </div>
            <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                style={{ width: `${((progress.sent + progress.failed) / Math.max(progress.total, 1)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-2">
              <span>{progress.sent} envoyé{progress.sent !== 1 ? 's' : ''}</span>
              <span>{progress.failed} échec{progress.failed !== 1 ? 's' : ''}</span>
              <span>{progress.sent + progress.failed} / {progress.total}</span>
            </div>
            <button
              type="button"
              onClick={handleAbort}
              className="mt-3 px-3 py-1 bg-red-600/30 hover:bg-red-600/50 text-red-300 text-xs rounded transition"
            >
              Annuler l'envoi
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
        >
          <Send size={16} />
          Envoyer à {contactCount} contact{contactCount !== 1 ? 's' : ''}
        </button>
      </form>

      {/* ── Aperçu en temps réel (toujours visible) ── */}
      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-lg font-semibold text-gray-300 mb-4">
          Aperçu de l'email
          <span className="text-sm font-normal text-gray-500 ml-2">
            (se met à jour en temps réel)
          </span>
        </h3>
        <div className="bg-white rounded-xl overflow-hidden shadow-2xl border border-gray-600">
          <iframe
            srcDoc={previewHtml}
            className="w-full border-0"
            style={{ height: '650px' }}
            title="Aperçu email"
          />
        </div>
      </div>
    </div>
  );
}
