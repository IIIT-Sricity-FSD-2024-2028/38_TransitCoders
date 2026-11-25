import { useState } from 'react';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export default function ConfirmDeliveryModal({ isOpen, onClose, order, onConfirmDelivery, busy, error }) {
  const [photo, setPhoto] = useState(null);
  const [fileError, setFileError] = useState('');

  if (!isOpen || !order) return null;

  function selectPhoto(event) {
    const file = event.target.files[0];
    if (file && (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024 || !file.size)) {
      setFileError('Choose a JPEG, PNG, WebP, or GIF file up to 5 MB.');
      setPhoto(null);
      return;
    }
    setFileError('');
    setPhoto(file || null);
  }

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="delivery-confirmation" className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form className="w-full max-w-md space-y-4 rounded-xl border border-gray-100 bg-white p-6 shadow-xl" onSubmit={event => { event.preventDefault(); if (!busy && !fileError) onConfirmDelivery(photo); }}>
        <h2 id="delivery-confirmation" className="text-lg font-bold">Confirm delivery</h2>
        <p className="text-sm text-gray-600">{order.orderId} · {order.customer}</p>
        <p className="text-sm text-gray-600">{order.destination}</p>
        <label className="block space-y-2 text-sm font-semibold">
          <span>Proof of delivery photo (optional)</span>
          <input type="file" disabled={busy} accept={allowedTypes.join(',')} className="block w-full text-sm font-normal" onChange={selectPhoto} />
        </label>
        {(fileError || error) && <p role="alert" className="text-sm text-red-700">{fileError || error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-medium">Cancel</button>
          <button type="submit" disabled={busy || Boolean(fileError)} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Confirm delivery'}</button>
        </div>
      </form>
    </div>
  );
}
