import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Book, LogIn, UserPlus } from 'lucide-react';

export default function AuthPage() {
    const { login, register } = useAuth();
    const [tab, setTab] = useState('login');
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            if (tab === 'login') {
                await login(form.email, form.password);
            } else {
                await register(form.name, form.email, form.password);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-color)',
            padding: '1rem',
        }}>
            <div style={{ width: '100%', maxWidth: '420px' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                        <Book size={36} color="var(--accent-color)" />
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em' }}>Study App</h1>
                    </div>
                    <p>Your personal knowledge base</p>
                </div>

                {/* Tab switcher */}
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.25rem',
                    marginBottom: '1.5rem',
                    boxShadow: 'var(--shadow-sm)',
                }}>
                    {['login', 'register'].map(t => (
                        <button
                            key={t}
                            onClick={() => { setTab(t); setError(''); }}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                borderRadius: '6px',
                                fontWeight: 500,
                                fontSize: '0.875rem',
                                transition: 'var(--transition)',
                                background: tab === t ? 'var(--accent-color)' : 'transparent',
                                color: tab === t ? 'white' : 'var(--text-secondary)',
                            }}
                        >
                            {t === 'login' ? 'Login' : 'Register'}
                        </button>
                    ))}
                </div>

                {/* Form Card */}
                <form onSubmit={handleSubmit} className="card" style={{ boxShadow: 'var(--shadow-md)', transform: 'none' }}>
                    {tab === 'register' && (
                        <div style={{ marginBottom: '0.25rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Full Name</label>
                            <input
                                className="input-field"
                                type="text"
                                placeholder="John Doe"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                    )}
                    <div style={{ marginBottom: '0.25rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Email</label>
                        <input
                            className="input-field"
                            type="email"
                            placeholder="you@example.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                            required
                        />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 500 }}>Password</label>
                        <input
                            className="input-field"
                            type="password"
                            placeholder="Min. 6 characters"
                            value={form.password}
                            onChange={e => setForm({ ...form, password: e.target.value })}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div style={{
                            padding: '0.75rem 1rem',
                            marginBottom: '1rem',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 'var(--radius-md)',
                            color: '#ef4444',
                            fontSize: '0.875rem',
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '1rem' }}
                    >
                        {loading ? 'Please wait...' : (
                            <>
                                {tab === 'login' ? <LogIn size={18} /> : <UserPlus size={18} />}
                                {tab === 'login' ? 'Login' : 'Create Account'}
                            </>
                        )}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
                    {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button
                        onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); }}
                        style={{ color: 'var(--accent-color)', fontWeight: 500, cursor: 'pointer' }}
                    >
                        {tab === 'login' ? 'Register' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}
