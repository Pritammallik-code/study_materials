import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../api';
import { Plus, Trash2, ExternalLink, FileText, Link as LinkIcon, Pencil, Code, ChevronUp, ChevronDown as ChevronDownIcon, X } from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import StatsView from './StatsView';
import ConfirmModal from './ConfirmModal';

const TYPE_ICON = { TEXT: FileText, LINK: LinkIcon, CODE: Code, FILE: FileText };
const labelStyle = { display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 500 };

export default function MainContent({ 
    activeNode, 
    ancestors, 
    onSelectNode, 
    focusMode, 
    onToggleFocus, 
    hierarchy,
    isLoadingHierarchy,
    isInitialSync
}) {
    const queryClient = useQueryClient();
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ title: '', type: 'TEXT', content: '', tags: '' });
    const [tagFilter, setTagFilter] = useState('');
    const [deletingMaterial, setDeletingMaterial] = useState(null);

    const { data: materials = [], isLoading } = useQuery({
        queryKey: ['materials', activeNode?._id],
        queryFn: () => getMaterials(activeNode._id), // Fetch all materials for this node
        enabled: !!activeNode,
    });



    const addMutation = useMutation({
        mutationFn: (fd) => createMaterial(fd),
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['materials', activeNode._id] }); 
            cancelForm(); 
        }
    });

    const editMutation = useMutation({
        mutationFn: ({ id, data }) => updateMaterial(id, data),
        onSuccess: () => { 
            queryClient.invalidateQueries({ queryKey: ['materials', activeNode._id] }); 
            cancelForm(); 
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteMaterial(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['materials', activeNode._id] });
            setDeletingMaterial(null);
        }
    });

    const reorderMutation = useMutation({
        mutationFn: ({ id, orderIndex }) => updateMaterial(id, { orderIndex }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['materials', activeNode._id] })
    });

    const cancelForm = () => { 
        setEditingId(null); 
        setFormData({ title: '', type: 'TEXT', content: '', tags: '' }); 
        setShowAddForm(false); 
    };

    const startEdit = (m) => { 
        setEditingId(m._id); 
        setFormData({ 
            title: m.title, 
            type: m.type, 
            content: m.content, 
            tags: (m.tags || []).join(', ') 
        }); 
        setShowAddForm(true); 
    };

    const moveUp = (i) => { 
        if (i === 0) return; 
        reorderMutation.mutate({ id: materials[i]._id, orderIndex: materials[i - 1].orderIndex - 1 }); 
    };

    const moveDown = (i) => { 
        if (i === materials.length - 1) return; 
        reorderMutation.mutate({ id: materials[i]._id, orderIndex: materials[i + 1].orderIndex + 1 }); 
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const fd = new FormData();
        fd.append('title', formData.title);
        fd.append('type', formData.type);
        fd.append('tags', formData.tags);
        fd.append('nodeId', activeNode._id);
        fd.append('nodeType', activeNode.type || 'TOPIC');
        fd.append('content', formData.content);

        if (editingId) {
            editMutation.mutate({ id: editingId, data: fd });
        } else {
            addMutation.mutate(fd);
        }
    };

    // Extract all unique, non-empty tags from all materials in this node
    const allTags = [...new Set(materials.flatMap(m => m.tags || []).filter(t => t.trim() !== ''))];
    
    // Filter materials locally for better UX (prevents filter bar from shrinking)
    const filteredMaterials = tagFilter 
        ? materials.filter(m => m.tags && m.tags.includes(tagFilter))
        : materials;

    if (isInitialSync || (isLoadingHierarchy && !activeNode)) {
        return (
            <main className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '50vh' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Synchronizing...</p>
            </main>
        );
    }

    if (!activeNode?.name) {
        return (
            <main className="main-content">
                <StatsView hierarchy={hierarchy} onSelectNode={onSelectNode} />
            </main>
        );
    }

    const typeLabel = activeNode.type.charAt(0) + activeNode.type.slice(1).toLowerCase();

    return (
        <main className="main-content" id="main-content-area">
            {focusMode && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 100 }}>
                    <Breadcrumb ancestors={ancestors} onSelect={onSelectNode} />
                    <button className="btn btn-ghost" onClick={onToggleFocus}><X size={16} /> Exit Focus</button>
                </div>
            )}
            {focusMode && <div style={{ height: '3rem' }} />}

            {!focusMode && <Breadcrumb ancestors={ancestors} onSelect={onSelectNode} />}

            <div className="section-header">
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.2rem', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>{typeLabel}</p>
                    <h1 style={{ margin: 0, lineHeight: 1 }}>{activeNode.name}</h1>
                </div>
                <div className="section-actions">
                    <button className="btn btn-ghost" onClick={onToggleFocus} style={{ border: '1px solid var(--border-color)', background: focusMode ? 'var(--accent-soft)' : 'transparent' }}>
                        {focusMode ? <X size={16} /> : <FileText size={16} />} 
                        {focusMode ? 'Exit Focus' : 'Focus Mode'}
                    </button>
                    <button className="btn btn-primary" onClick={() => { cancelForm(); setShowAddForm(v => !v); }}>
                        <Plus size={18} /> Add Material
                    </button>
                </div>
            </div>

            {showAddForm && (
                <form onSubmit={handleFormSubmit} className="card" style={{ marginBottom: '2.5rem', border: '1px solid var(--accent-soft)', background: 'var(--bg-card)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{editingId ? 'Edit Material' : 'New Material'}</h3>
                        <button type="button" onClick={cancelForm} className="btn-ghost" style={{ padding: '0.25rem' }}><X size={18} /></button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div>
                            <label style={labelStyle}>Material Title</label>
                            <input 
                                className="input-field" 
                                placeholder="e.g. Chapter 1 Summary"
                                value={formData.title} 
                                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                                required 
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Content Type</label>
                            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-surface-hover)', padding: '0.4rem', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                                {[
                                    { value: 'TEXT', icon: FileText, label: 'Note' },
                                    { value: 'LINK', icon: LinkIcon, label: 'Link' },
                                    { value: 'CODE', icon: Code, label: 'Code' }
                                ].map(t => (
                                    <button
                                        key={t.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: t.value })}
                                        style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: '0.5rem', 
                                            padding: '0.5rem 1rem', 
                                            borderRadius: '6px', 
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            transition: 'all 0.2s ease',
                                            background: formData.type === t.value ? 'var(--text-primary)' : 'transparent',
                                            color: formData.type === t.value ? 'var(--bg-surface)' : 'var(--text-secondary)',
                                            boxShadow: formData.type === t.value ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
                                            border: 'none',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <t.icon size={14} />
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={labelStyle}>{formData.type === 'LINK' ? 'Paste URL' : 'Content Details'}</label>
                        {formData.type === 'CODE' ? (
                            <textarea className="input-field" rows="8" placeholder="Paste your code here..." value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} />
                        ) : formData.type === 'TEXT' ? (
                            <textarea className="input-field" rows="5" placeholder="Write your notes..." value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required />
                        ) : (
                            <input type="url" className="input-field" value={formData.content} placeholder="https://youtube.com/..." onChange={e => setFormData({ ...formData, content: e.target.value })} required />
                        )}
                    </div>

                    <div className="responsive-flex" style={{ alignItems: 'flex-end', gap: '1.5rem' }}>
                        <div className="flex-1">
                            <label style={labelStyle}>Tags <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional, comma-separated)</span></label>
                            <input className="input-field" style={{ marginBottom: 0 }} value={formData.tags} placeholder="exam, important, review" onChange={e => setFormData({ ...formData, tags: e.target.value })} />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button type="button" className="btn btn-ghost" onClick={cancelForm}>Cancel</button>
                            <button type="submit" className="btn btn-primary" style={{ paddingLeft: '2rem', paddingRight: '2rem' }}>
                                {editingId ? 'Update Material' : 'Create Material'}
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {allTags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Filter:</span>
                    <button 
                        onClick={() => setTagFilter('')} 
                        style={{ 
                            fontSize: '0.75rem', 
                            padding: '0.25rem 0.8rem', 
                            borderRadius: '6px', 
                            border: '1px solid var(--border-color)', 
                            background: tagFilter === '' ? 'var(--text-primary)' : 'transparent', 
                            color: tagFilter === '' ? 'var(--bg-surface)' : 'var(--text-secondary)',
                            fontWeight: 600
                        }}
                    >
                        All
                    </button>
                    {allTags.map(tag => (
                        <button 
                            key={tag} 
                            onClick={() => setTagFilter(tag === tagFilter ? '' : tag)} 
                            style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.25rem 0.8rem', 
                                borderRadius: '6px', 
                                border: '1px solid var(--border-color)', 
                                background: tagFilter === tag ? 'var(--accent-color)' : 'transparent', 
                                color: tagFilter === tag ? 'white' : 'var(--text-secondary)',
                                fontWeight: 600
                            }}
                        >
                            #{tag}
                        </button>
                    ))}
                </div>
            )}

            {isLoading ? (
                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading...</p>
            ) : filteredMaterials.length === 0 ? (
                <div className="empty-state" style={{ padding: '3rem 0' }}>
                    <p style={{ fontSize: '0.9rem' }}>{tagFilter ? `No materials tagged "${tagFilter}".` : "No materials yet. Click 'Add' to get started."}</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filteredMaterials.map((material, index) => {
                        const Icon = TYPE_ICON[material.type] || FileText;
                        return (
                            <div key={material._id} className="card" style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingTop: '0.2rem', flexShrink: 0 }}>
                                    <button className="btn-ghost" onClick={() => moveUp(index)} disabled={index === 0} style={{ padding: '0.1rem', opacity: index === 0 ? 0.2 : 0.5 }}><ChevronUp size={13} /></button>
                                    <button className="btn-ghost" onClick={() => moveDown(index)} disabled={index === materials.length - 1} style={{ padding: '0.1rem', opacity: index === materials.length - 1 ? 0.2 : 0.5 }}><ChevronDownIcon size={13} /></button>
                                </div>
                                <div style={{ padding: '0.6rem', borderRadius: '50%', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)' }}>
                                    <Icon size={18} />
                                </div>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', gap: '0.5rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{material.title}</span>
                                        <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                                            <button className="btn-ghost" onClick={() => startEdit(material)} style={{ padding: '0.2rem' }}><Pencil size={12} /></button>
                                            <button className="btn-ghost" onClick={() => setDeletingMaterial(material)} style={{ padding: '0.2rem' }}><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                    {material.type === 'LINK' ? (
                                        <a href={material.content} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500, background: 'var(--accent-soft)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-md)', width: 'fit-content' }}>
                                            {material.content} <ExternalLink size={14} />
                                        </a>
                                    ) : material.type === 'CODE' ? (
                                        <div style={{ backgroundColor: 'var(--bg-surface-hover)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginTop: '0.75rem', overflowX: 'auto', border: '1px solid var(--border-color)', position: 'relative' }}>
                                            <pre style={{ margin: 0, fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}><code>{material.content}</code></pre>
                                        </div>
                                    ) : (
                                        <p style={{ fontSize: '0.925rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.7, opacity: 0.9 }}>{material.content}</p>
                                    )}
                                    {material.tags?.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                                            {material.tags.map(tag => (
                                                <span key={tag} onClick={() => setTagFilter(tag === tagFilter ? '' : tag)} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--accent-soft)', color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)' }}>
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmModal
                isOpen={!!deletingMaterial}
                onClose={() => setDeletingMaterial(null)}
                onConfirm={() => deleteMutation.mutate(deletingMaterial._id)}
                title="Delete Material?"
                message={`Are you sure you want to delete "${deletingMaterial?.title}"? This cannot be undone.`}
            />
        </main>
    );
}
