import React, { useState } from 'react';
import { PublicLayout } from '../components/PublicLayout';
import {
  Mail,
  ShieldAlert,
  Send,
  CheckCircle2,
  Sparkles,
  LifeBuoy,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { apiRequest } from '../api';

interface ContactViewProps {
  onNavigate: (page: string) => void;
  onGetStarted: () => void;
  isLoggedIn?: boolean;
  activeDomainName?: string;
  customHtml?: string;
  adConfig?: import('../components/PublicLayout').AdNetworkConfig;
}

export const ContactView: React.FC<ContactViewProps> = ({
  onNavigate,
  onGetStarted,
  isLoggedIn = false,
  activeDomainName,
  customHtml,
  adConfig,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState<'support' | 'api' | 'enterprise' | 'abuse'>('support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const formRef = React.useRef<HTMLDivElement>(null);

  const handleSelectBox = (cat: 'support' | 'api' | 'enterprise' | 'abuse') => {
    setCategory(cat);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiRequest('abuse-reports', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          category,
          subject: subject.trim(),
          message: message.trim(),
          reason: subject.trim(),
          details: message.trim(),
        }),
      });

      if (res.success) {
        setSubmitted(true);
        showToast('Thank you! Your inquiry has been sent to URLZ support.', 'success');
      } else {
        showToast(res.error || res.message || 'Failed to submit inquiry. Please try again.', 'error');
      }
    } catch {
      showToast('Network error submitting inquiry', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicLayout
      currentPage="contact"
      onNavigate={onNavigate}
      onGetStarted={onGetStarted}
      onGoToLogin={() => onNavigate('login')}
      onGoToDashboard={() => onNavigate('dashboard')}
      isLoggedIn={isLoggedIn}
      activeDomainName={activeDomainName}
      adConfig={adConfig}
    >
      {customHtml ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 w-full" dangerouslySetInnerHTML={{ __html: customHtml }} />
      ) : (
        <>
          {/* Main Form Content */}
          <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 flex-1 space-y-10">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-400 text-xs font-semibold">
                <LifeBuoy className="w-3.5 h-3.5" />
                <span>Help Desk &amp; Inquiries</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Get in Touch with URLZ
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                Choose an inquiry category below or submit a direct message to our support and engineering team.
              </p>
            </div>

            {/* 4 Topic Explanatory Boxes (No Display Emails) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Box 1: General Support */}
              <div
                onClick={() => handleSelectBox('support')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                  category === 'support'
                    ? 'bg-indigo-950/60 border-indigo-500/80 ring-1 ring-indigo-500/50 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs sm:text-sm">
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>General Support</span>
                    </div>
                    {category === 'support' && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Account assistance, billing inquiries, domain setup, or general guidance.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-indigo-300 transition-colors">
                  <span>General Customer Support</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Box 2: Developer & Enterprise API */}
              <div
                onClick={() => handleSelectBox('api')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                  category === 'api'
                    ? 'bg-purple-950/60 border-purple-500/80 ring-1 ring-purple-500/50 shadow-lg shadow-purple-500/10'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-purple-400 font-bold text-xs sm:text-sm">
                      <Sparkles className="w-4 h-4 shrink-0" />
                      <span>Developer &amp; Enterprise</span>
                    </div>
                    {category === 'api' && (
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    High-volume REST API limits, custom rate limiting, and programmatic API keys.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-purple-300 transition-colors">
                  <span>Programmatic REST API</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Box 3: Sales & Custom Plans */}
              <div
                onClick={() => handleSelectBox('enterprise')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                  category === 'enterprise'
                    ? 'bg-emerald-950/60 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs sm:text-sm">
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>Sales &amp; Enterprise</span>
                    </div>
                    {category === 'enterprise' && (
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Custom domain branding, white-label portals, and custom volume pricing.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-emerald-300 transition-colors">
                  <span>Custom Domain &amp; Enterprise</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Box 4: Abuse & DMCA */}
              <div
                onClick={() => handleSelectBox('abuse')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 group ${
                  category === 'abuse'
                    ? 'bg-rose-950/60 border-rose-500/80 ring-1 ring-rose-500/50 shadow-lg shadow-rose-500/10'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs sm:text-sm">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Abuse &amp; DMCA</span>
                    </div>
                    {category === 'abuse' && (
                      <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                    )}
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Immediate takedown requests for phishing, malware, or illegal destination links.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-semibold text-slate-400 group-hover:text-rose-300 transition-colors">
                  <span>Report Malicious Link</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Contact Form Section */}
            <div ref={formRef} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl mx-auto shadow-2xl">
              {submitted ? (
                <div className="py-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Inquiry Received!</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Thank you for contacting URLZ. Your message has been safely recorded in our support desk database. A representative will review your inquiry and follow up at <strong className="text-white">{email}</strong> within 24 business hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setMessage('');
                      setSubject('');
                    }}
                    className="mt-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold cursor-pointer transition-colors"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <Send className="w-4 h-4 text-indigo-400" />
                      <span>Send Direct Message</span>
                    </h3>
                    <span className="text-[11px] text-slate-500 font-mono">D1 Database Secured</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Jane Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="jane@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Inquiry Topic</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                    >
                      <option value="support">General Customer Support</option>
                      <option value="api">Programmatic REST API &amp; Quota Upgrade</option>
                      <option value="enterprise">Custom Domain &amp; Enterprise Plans</option>
                      <option value="abuse">Report Malicious Short Link (Abuse)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Brief summary of your inquiry"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Message Details</label>
                    <textarea
                      rows={5}
                      required
                      placeholder="Provide details about your inquiry, custom domain requirements, or short link in question..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      <span>{submitting ? 'Sending Message...' : 'Submit Inquiry'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </main>
        </>
      )}
    </PublicLayout>
  );
};
