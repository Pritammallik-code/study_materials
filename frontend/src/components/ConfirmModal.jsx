import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message }) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', width: '90%', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-1.5rem' }}>
                    <button className="btn-ghost" onClick={onClose} style={{ padding: '0.25rem' }}><X size={18} /></button>
                </div>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>{title || 'Are you sure?'}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
                        {message || 'This action cannot be undone. All related data will be permanently removed.'}
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                        <button className="btn btn-ghost" onClick={onClose} style={{ border: '1px solid var(--border-color)' }}>Cancel</button>
                        <button className="btn" onClick={onConfirm} style={{ background: '#ef4444', color: 'white' }}>Delete</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
