import { useState } from 'react';
import { MapPin, Phone, Clock, MessageCircle, Send, CheckCircle2 } from 'lucide-react';
import { sendMessage } from '@/services/messages';
import toast from 'react-hot-toast';
import { cn } from '@/utils';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', contact: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.contact.trim()) e.contact = 'Phone or email is required';
    if (!form.message.trim()) e.message = 'Message is required';
    else if (form.message.trim().length < 10) e.message = 'Message too short';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSubmitting(true);
    try {
      await sendMessage(form.name.trim(), form.contact.trim(), form.message.trim());
      setSent(true);
      setForm({ name: '', contact: '', message: '' });
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    if (errors[field]) setErrors(er => { const n = { ...er }; delete n[field]; return n; });
  };

  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER || '2348000000000';

  return (
    <div className="page-enter">
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-950 to-brand-800 text-white py-16">
        <div className="container-app text-center">
          <h1 className="font-display text-4xl sm:text-5xl font-bold mb-4">Get in Touch</h1>
          <p className="text-brand-200 text-lg max-w-xl mx-auto">
            Have a question or want to place a custom order? We'd love to hear from you.
          </p>
        </div>
      </section>

      <div className="container-app py-14">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Info */}
          <div>
            <h2 className="font-display text-2xl font-bold mb-6">Store Information</h2>

            <div className="space-y-5 mb-8">
              {[
                {
                  icon: MapPin,
                  label: 'Address',
                  value: 'Owode Yewa, Ogun State, Nigeria',
                  href: 'https://maps.google.com?q=Owode+Yewa+Ogun+State+Nigeria',
                },
                {
                  icon: Phone,
                  label: 'Phone / WhatsApp',
                  value: `+${whatsappNumber}`,
                  href: `tel:+${whatsappNumber}`,
                },
                {
                  icon: Clock,
                  label: 'Opening Hours',
                  value: 'Mon–Sat: 7:00 AM – 9:00 PM\nSunday: 9:00 AM – 7:00 PM',
                },
              ].map(item => (
                <div key={item.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-brand-700" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground hover:text-brand-700 transition-colors whitespace-pre-line">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm text-foreground whitespace-pre-line">{item.value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* WhatsApp CTA */}
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] rounded-2xl p-5">
              <p className="font-semibold text-[#166534] mb-2 flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                Prefer WhatsApp?
              </p>
              <p className="text-sm text-[#16a34a] mb-4 leading-relaxed">
                For fastest response, chat with us directly on WhatsApp. We typically reply within minutes during business hours.
              </p>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-[#20b558] transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Form */}
          <div>
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
              {sent ? (
                <div className="py-10 flex flex-col items-center text-center gap-4 animate-fade-in">
                  <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-display text-xl font-bold mb-2">Message Sent!</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      Thank you for reaching out. We'll get back to you as soon as possible.
                    </p>
                  </div>
                  <button
                    onClick={() => setSent(false)}
                    className="text-sm text-brand-700 hover:underline"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="font-display text-2xl font-bold mb-6">Send a Message</h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Your Name <span className="text-destructive">*</span>
                      </label>
                      <input
                        value={form.name}
                        onChange={set('name')}
                        placeholder="Adebayo Okafor"
                        className={cn('input-field', errors.name && 'border-destructive ring-1 ring-destructive')}
                      />
                      {errors.name && <p className="text-destructive text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Phone or Email <span className="text-destructive">*</span>
                      </label>
                      <input
                        value={form.contact}
                        onChange={set('contact')}
                        placeholder="08012345678 or email@example.com"
                        className={cn('input-field', errors.contact && 'border-destructive ring-1 ring-destructive')}
                      />
                      {errors.contact && <p className="text-destructive text-xs mt-1">{errors.contact}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">
                        Message <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        value={form.message}
                        onChange={set('message')}
                        placeholder="How can we help you?"
                        rows={5}
                        className={cn('input-field resize-none', errors.message && 'border-destructive ring-1 ring-destructive')}
                      />
                      {errors.message && <p className="text-destructive text-xs mt-1">{errors.message}</p>}
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-sm transition-all',
                        submitting
                          ? 'bg-brand-300 cursor-not-allowed text-white'
                          : 'bg-brand-700 text-white hover:bg-brand-800 hover:shadow-lg'
                      )}
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
