import { useEffect, useId, useRef, useState } from 'react';
import { useAppSelector } from '../app/hooks';
import { selectCurrentUser } from '../shared/auth/authSlice';
import { useOrderMessages, useSendOrderMessage } from '../shared/orders/ordersHooks';

export default function OrderMessages({ orderId, channel, label }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className="mt-3">
      <button type="button" aria-expanded={open} aria-controls={open ? id : undefined}
        className="text-sm font-semibold text-orange-700" onClick={() => setOpen(value => !value)}>
        {label}
      </button>
      {open && <MessageThread key={`${orderId}:${channel}`} id={id} orderId={orderId} channel={channel} label={label} />}
    </div>
  );
}

function MessageThread({ id, orderId, channel, label }) {
  const userId = useAppSelector(selectCurrentUser)?.id;
  const [body, setBody] = useState('');
  const [sendError, setSendError] = useState('');
  const list = useRef(null);

  const {
    data: fetchedMessages,
    isLoading,
    error: queryError,
  } = useOrderMessages({ id: orderId, channel }, { pollingInterval: 5000 });
  const [triggerSendMessage, { isLoading: sending }] = useSendOrderMessage();

  const loadError = queryError?.message || '';
  const messages = loadError ? null : fetchedMessages;
  const latestMessageId = messages?.at(-1)?.id;

  useEffect(() => {
    if (list.current) list.current.scrollTop = list.current.scrollHeight;
  }, [latestMessageId]);

  async function send(event) {
    event.preventDefault();
    if (!body.trim() || sending) return;
    setSendError('');
    try {
      await triggerSendMessage({ id: orderId, channel, body: body.trim() }).unwrap();
      setBody('');
    } catch (err) {
      setSendError(err.message);
    }
  }

  return (
    <section id={id} aria-label={label} className="mt-2 space-y-3 rounded-lg border border-gray-200 bg-white p-3 text-sm">
      {loadError && <p role="alert" className="text-red-700">{loadError}</p>}
      {(isLoading || (!messages && !loadError)) && <p role="status">Loading messages…</p>}
      {messages?.length === 0 && <p className="text-gray-600">No messages yet.</p>}
      {messages?.length > 0 && <ol ref={list} tabIndex={0} aria-label="Conversation history" className="max-h-56 space-y-2 overflow-y-auto">
        {messages.map(message => <li key={message.id} className="rounded-lg bg-gray-50 p-2">
          <div className="flex flex-wrap gap-x-2 text-xs text-gray-600">
            <strong>{message.senderId === userId ? 'You' : message.senderName}</strong>
            <time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString('en-IN')}</time>
          </div>
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        </li>)}
      </ol>}
      <form onSubmit={send} className="space-y-2">
        <label className="block">
          <span className="font-medium">Message</span>
          <textarea rows={2} value={body} maxLength={1000} onChange={event => setBody(event.target.value)}
            disabled={sending || !messages} required className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5" />
        </label>
        {sendError && <p role="alert" className="text-red-700">{sendError}</p>}
        <button type="submit" disabled={sending || !messages || !body.trim()}
          className="rounded-md bg-orange-600 px-3 py-1.5 font-semibold text-white disabled:opacity-50">
          {sending ? 'Sending…' : 'Send message'}
        </button>
      </form>
    </section>
  );
}
