import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import AuthPage from './pages/AuthPage';
import { getHierarchy } from './api';
import { Menu, X, LogOut } from 'lucide-react';

// ---- localStorage helper for recently visited ----
const RECENTS_KEY = 'study_recents';
const MAX_RECENTS = 5;
const getRecents = () => { try { return JSON.parse(localStorage.getItem(RECENTS_KEY)) || []; } catch { return []; } };
const saveRecents = (list) => localStorage.setItem(RECENTS_KEY, JSON.stringify(list));
const addToRecents = (node, type) => {
    const entry = { _id: node._id, name: node.name, type };
    const prev = getRecents().filter(r => r._id !== node._id);
    saveRecents([entry, ...prev].slice(0, MAX_RECENTS));
};

// ---- Breadcrumb helper ----
function computeAncestors(hierarchy, activeNode) {
    if (!activeNode || !hierarchy) return [];
    const { _id, type } = activeNode;
    if (type === 'SUBJECT') {
        const s = hierarchy.find(s => s._id === _id);
        return s ? [{ ...s, type: 'SUBJECT' }] : [];
    }
    if (type === 'CHAPTER') {
        for (const s of hierarchy) {
            const c = (s.chapters || []).find(c => c._id === _id);
            if (c) return [{ ...s, type: 'SUBJECT' }, { ...c, type: 'CHAPTER' }];
        }
    }
    if (type === 'TOPIC') {
        for (const s of hierarchy) {
            for (const c of (s.chapters || [])) {
                const t = (c.topics || []).find(t => t._id === _id);
                if (t) return [{ ...s, type: 'SUBJECT' }, { ...c, type: 'CHAPTER' }, { ...t, type: 'TOPIC' }];
            }
        }
    }
    return [];
}

function AppLayout() {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [recents, setRecents] = useState(getRecents);

    const { data: hierarchy = [], isLoading: isLoadingHierarchy } = useQuery({ queryKey: ['hierarchy'], queryFn: getHierarchy });
    
    // Derived state from URL
    const [activeNode, setActiveNode] = useState(null);
    const [isInitialSync, setIsInitialSync] = useState(location.pathname !== '/');

    // Sync activeNode with URL
    useEffect(() => {
        if (!hierarchy || hierarchy.length === 0) return;

        const parts = location.pathname.split('/').filter(Boolean);
        if (parts.length < 2) {
            setActiveNode(null);
            setIsInitialSync(false);
            return;
        }

        const [typeLabel, id] = parts;
        const type = typeLabel.toUpperCase(); // SUBJECT, CHAPTER, TOPIC

        let foundNode = null;
        if (type === 'SUBJECT') {
            foundNode = hierarchy.find(s => s._id === id);
        } else if (type === 'CHAPTER') {
            for (const s of hierarchy) {
                foundNode = (s.chapters || []).find(c => c._id === id);
                if (foundNode) break;
            }
        } else if (type === 'TOPIC') {
            for (const s of hierarchy) {
                for (const c of (s.chapters || [])) {
                    foundNode = (c.topics || []).find(t => t._id === id);
                    if (foundNode) break;
                }
                if (foundNode) break;
            }
        }

        if (foundNode) {
            setActiveNode({ ...foundNode, type });
        } else {
            setActiveNode(null);
        }
        setIsInitialSync(false);
    }, [location.pathname, hierarchy]);

    const ancestors = computeAncestors(hierarchy, activeNode);

    const handleNodeSelect = useCallback((node, type) => {
        setSidebarOpen(false);
        if (!node) {
            navigate('/');
            return;
        }
        const n = { ...node, type };
        navigate(`/${type.toLowerCase()}/${node._id}`);
        addToRecents(n, type);
        setRecents(getRecents());
    }, [navigate]);

    const handleLogout = () => { queryClient.clear(); logout(); };

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            if (e.key === '/') { e.preventDefault(); document.getElementById('sidebar-search')?.focus(); }
            if (e.key === 'f' || e.key === 'F') setFocusMode(v => !v);
            if (e.key === 'Escape') setFocusMode(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    return (
        <div className={`app-container ${focusMode ? 'focus-mode' : ''}`}>
            {/* Mobile header (hidden in focus mode) */}
            {!focusMode && (
                <div className="mobile-header" style={{ justifyContent: 'space-between', padding: '0.75rem 1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button className="btn-ghost" onClick={() => setSidebarOpen(true)} style={{ padding: '0.25rem' }}><Menu size={20} /></button>
                        <button 
                            onClick={() => handleNodeSelect(null)}
                            style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--accent-color)', letterSpacing: '-0.02em', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                            Study App
                        </button>
                    </div>
                    <button className="btn-ghost" onClick={handleLogout} title="Logout" style={{ padding: '0.35rem' }}>
                        <LogOut size={18} />
                    </button>
                </div>
            )}

            {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

            <div className={`sidebar-container ${sidebarOpen ? 'open' : ''} ${focusMode ? 'hidden' : ''}`}>
                {sidebarOpen && (
                    <button className="close-sidebar btn-ghost" onClick={() => setSidebarOpen(false)}>
                        <X size={22} color="var(--text-primary)" />
                    </button>
                )}
                <Sidebar activeNode={activeNode} onSelectNode={handleNodeSelect} onLogout={handleLogout} user={user} recents={recents} />
            </div>

            <MainContent
                activeNode={activeNode}
                ancestors={ancestors}
                onSelectNode={handleNodeSelect}
                focusMode={focusMode}
                onToggleFocus={() => setFocusMode(v => !v)}
                hierarchy={hierarchy}
                isLoadingHierarchy={isLoadingHierarchy}
                isInitialSync={isInitialSync}
            />
        </div>
    );
}

function App() {
    const { user, loading } = useAuth();
    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
    );
    return <Router>{user ? <AppLayout /> : <AuthPage />}</Router>;
}

export default App;
