import { useState } from 'react';
import { MessageSquare, Mail, Phone, CheckCheck, Circle } from 'lucide-react';
import { useMessages } from '@/hooks/useMessages';
import { markMessageRead } from '@/services/messages';
import { formatDate } from '@/utils';
import { cn } from '@/utils';

export default function AdminMessagesPage() {
  const { messages, loading } = useMessages();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filtered = messages.filter(m => {
    if (filter === 'unread') return !m.isRead;
    if (filter === 'read') return m.isRead;
    return true;
  });

  const unreadCount = messages.filter(m => !m.isRead).length;

  const handleExpand = async (id: string, isRead: boolean) => {
    if (expanded === id) {
      setExpanded(null);
      return;
    }
    setExpanded(id);
    if (!isRead) {
      try {
        await markMessageRead(id);
      } catch {
        // Silent fail — doesn't affect UX
      }
    }
  };

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
            {unreadCount > 0 && (
              <span className="ml-2 text-brand-600 font-semibold">· {unreadCount} unread</span>
            )}
          </p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: `All (${messages.length})` },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read', label: `Read (${messages.length - unreadCount})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key as typeof filter)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-semibold transition-colors border',
              filter === tab.key
                ? 'bg-brand-700 text-white border-brand-700'
                : 'border-border hover:bg-muted'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-start">
                <div className="skeleton w-10 h-10 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/4 rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center">
              <MessageSquare className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="font-semibold">No messages</p>
            <p className="text-muted-foreground text-sm">
              {filter !== 'all' ? 'No messages in this filter' : 'Customer messages will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(msg => (
              <div key={msg.id} className={cn('transition-colors', !msg.isRead && 'bg-brand-50/40')}>
                <button
                  onClick={() => handleExpand(msg.id, msg.isRead)}
                  className="w-full text-left px-5 py-4 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0',
                      msg.isRead ? 'bg-muted text-muted-foreground' : 'bg-brand-100 text-brand-700'
                    )}>
                      {msg.name.charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-sm">{msg.name}</span>
                        {!msg.isRead && (
                          <Circle className="w-2 h-2 fill-brand-600 text-brand-600 shrink-0" />
                        )}
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                      <p className={cn('text-sm text-muted-foreground flex items-center gap-1.5', !msg.isRead && 'font-medium text-foreground/80')}>
                        {msg.contact.includes('@') ? (
                          <Mail className="w-3 h-3 shrink-0" />
                        ) : (
                          <Phone className="w-3 h-3 shrink-0" />
                        )}
                        {msg.contact}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-1">{msg.message}</p>
                    </div>
                  </div>
                </button>

                {/* Expanded */}
                {expanded === msg.id && (
                  <div className="px-5 pb-5 pt-1 ml-13 animate-fade-in" style={{ marginLeft: '3.25rem' }}>
                    <div className="bg-background rounded-2xl border border-border p-4">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Full Message</p>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <a
                        href={
                          msg.contact.includes('@')
                            ? `mailto:${msg.contact}?subject=Re: Your message to Omoola Supermarket`
                            : `https://wa.me/${msg.contact.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${msg.name}, thanks for contacting Omoola Supermarket!`)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-4 py-2 rounded-xl transition-colors border border-brand-200"
                      >
                        {msg.contact.includes('@') ? (
                          <><Mail className="w-3.5 h-3.5" />Reply via Email</>
                        ) : (
                          <><Phone className="w-3.5 h-3.5" />Reply via WhatsApp</>
                        )}
                      </a>
                      {msg.isRead && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <CheckCheck className="w-3.5 h-3.5 text-brand-500" />
                          Read
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
