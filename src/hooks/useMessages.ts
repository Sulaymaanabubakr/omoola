import { useState, useEffect } from 'react';
import { Message } from '@/types';
import { subscribeToMessages } from '@/services/messages';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToMessages((data) => {
      setMessages(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { messages, loading };
}
