import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMaterials, createMaterial, updateMaterial, deleteMaterial, fetchUrlTitle } from '../api';
import { Plus, Trash2, ExternalLink, FileText, Link as LinkIcon, Pencil, Code, ChevronUp, ChevronDown as ChevronDownIcon, X, Maximize2, Minimize2, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Breadcrumb from './Breadcrumb';
import StatsView from './StatsView';
import ConfirmModal from './ConfirmModal';

import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import MaterialCard from './MaterialCard';

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
    const [formData, setFormData] = useState({ title: '', text: '', code: '', link: '', tags: '' });
    const [tagFilter, setTagFilter] = useState('');
    const [deletingMaterial, setDeletingMaterial] = useState(null);
    const [isFetchingTitle, setIsFetchingTitle] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleFetchTitle = async () => {
        if (!formData.link) return;
        setIsFetchingTitle(true);
        try {
            const data = await fetchUrlTitle(formData.link);
            if (data.title) {
                setFormData(prev => ({ ...prev, title: data.title }));
            }
        } catch (e) {
            console.error(e);
        }
        setIsFetchingTitle(false);
    };

    const { data: materials = [], isLoading } = useQuery({
        queryKey: ['materials', activeNode?._id],
        queryFn: () => getMaterials(activeNode._id), // Fetch all materials for this node
        enabled: !!activeNode,
    });



    const addMutation = useMutation({
        mutationFn: (data) => createMaterial(data),
        onMutate: async (newMaterial) => {
            await queryClient.cancelQueries({ queryKey: ['materials', activeNode._id] });
            const previousMaterials = queryClient.getQueryData(['materials', activeNode._id]);
            
            // Generate a temporary ID for the optimistic item
            const tempId = `temp-${Date.now()}`;
            const optimisticMaterial = {
                ...newMaterial,
                _id: tempId,
                tags: newMaterial.tags || [],
                createdAt: new Date().toISOString()
            };

            queryClient.setQueryData(['materials', activeNode._id], (old) => [...(old || []), optimisticMaterial]);
            cancelForm();
            return { previousMaterials };
        },
        onError: (err, newMaterial, context) => {
            if (context?.previousMaterials) {
                queryClient.setQueryData(['materials', activeNode._id], context.previousMaterials);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['materials', activeNode._id] });
        }
    });

    const editMutation = useMutation({
        mutationFn: ({ id, data }) => updateMaterial(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: ['materials', activeNode._id] });
            const previousMaterials = queryClient.getQueryData(['materials', activeNode._id]);
            
            queryClient.setQueryData(['materials', activeNode._id], (old) => {
                if (!old) return old;
                return old.map(m => m._id === id ? { 
                    ...m, 
                    ...data,
                    tags: typeof data.tags === 'string' ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : data.tags
                } : m);
            });
            cancelForm();
            return { previousMaterials };
        },
        onError: (err, variables, context) => {
            if (context?.previousMaterials) {
                queryClient.setQueryData(['materials', activeNode._id], context.previousMaterials);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['materials', activeNode._id] });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: (id) => deleteMaterial(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['materials', activeNode._id] });
            const previousMaterials = queryClient.getQueryData(['materials', activeNode._id]);
            
            queryClient.setQueryData(['materials', activeNode._id], (old) => {
                if (!old) return old;
                return old.filter(m => m._id !== id);
            });
            setDeletingMaterial(null);
            return { previousMaterials };
        },
        onError: (err, id, context) => {
            if (context?.previousMaterials) {
                queryClient.setQueryData(['materials', activeNode._id], context.previousMaterials);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['materials', activeNode._id] });
        }
    });

    const reorderMutation = useMutation({
        mutationFn: ({ id, orderIndex }) => updateMaterial(id, { orderIndex }),
        onMutate: async ({ id, orderIndex }) => {
            await queryClient.cancelQueries({ queryKey: ['materials', activeNode._id] });
            const previousMaterials = queryClient.getQueryData(['materials', activeNode._id]);

            // Optimistically reorder in UI
            queryClient.setQueryData(['materials', activeNode._id], (old) => {
                if (!old) return old;
                // Simple logic: we are either moving up (-1) or down (+1) which swaps with adjacent
                const newMaterials = [...old];
                const currentIndex = newMaterials.findIndex(m => m._id === id);
                if (currentIndex === -1) return newMaterials;
                
                // Fine-tune the sorting based on provided new orderIndex roughly (assuming standard +1/-1 swaps)
                // Actually since the API expects orderIndex update, just modifying the orderIndex 
                // and sorting is safest.
                const updatedMaterials = newMaterials.map(m => 
                    m._id === id ? { ...m, orderIndex } : m
                );
                
                // We also need to swap the adjacent item's orderIndex if we are doing a direct swap 
                // (which moveUp and moveDown do conceptually) to make the generic update look right.
                // It's easier: moveUp/moveDown are adjacent swaps. 
                const originalOrder = newMaterials[currentIndex].orderIndex;
                const otherIndex = newMaterials.findIndex(m => m._id !== id && m.orderIndex === orderIndex);
                if (otherIndex !== -1) {
                    updatedMaterials[otherIndex] = { ...updatedMaterials[otherIndex], orderIndex: originalOrder };
                }

                return updatedMaterials.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
            });

            return { previousMaterials };
        },
        onError: (err, variables, context) => {
            if (context?.previousMaterials) {
                queryClient.setQueryData(['materials', activeNode._id], context.previousMaterials);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['materials', activeNode._id] });
        }
    });

    const cancelForm = () => { 
        setEditingId(null); 
        setFormData({ title: '', text: '', code: '', link: '', tags: '' }); 
        setShowAddForm(false); 
    };

    const startEdit = (m) => {
        setEditingId(m._id);
        
        const unifiedData = { ...m, text: m.text || '', code: m.code || '', link: m.link || '' };
        
        // Backwards compatibility for legacy materials that strictly relied on type/content
        if (m.type === 'TEXT' && m.content) unifiedData.text = m.content;
        if (m.type === 'CODE' && m.content) unifiedData.code = m.content;
        if (m.type === 'LINK' && m.content) unifiedData.link = m.content;

        setFormData({ 
            title: unifiedData.title, 
            text: unifiedData.text, 
            code: unifiedData.code, 
            link: unifiedData.link, 
            tags: (unifiedData.tags || []).join(', ') 
        });
        setShowAddForm(true);
        window.scrollTo(0, 0);
    };

    const moveUp = (i) => { 
        if (i === 0) return; 
        const currentOrder = materials[i].orderIndex || i;
        const prevOrder = materials[i - 1].orderIndex || (i - 1);
        reorderMutation.mutate({ id: materials[i]._id, orderIndex: prevOrder }); 
        reorderMutation.mutate({ id: materials[i - 1]._id, orderIndex: currentOrder });
    };

    const moveDown = (i) => { 
        if (i === materials.length - 1) return; 
        const currentOrder = materials[i].orderIndex || i;
        const nextOrder = materials[i + 1].orderIndex || (i + 1);
        reorderMutation.mutate({ id: materials[i]._id, orderIndex: nextOrder }); 
        reorderMutation.mutate({ id: materials[i + 1]._id, orderIndex: currentOrder });
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const activeIndex = materials.findIndex(m => m._id === active.id);
        const overIndex = materials.findIndex(m => m._id === over.id);
        
        const newMaterials = arrayMove(materials, activeIndex, overIndex);
        
        // We optimistically update the state so Drag & Drop feels instant, 
        // bypassing the complex original reorderMutation logic which does direct swaps.
        queryClient.setQueryData(['materials', activeNode._id], newMaterials.map((m, i) => ({ ...m, orderIndex: i })));

        // Send all updates lazily to network
        const changed = newMaterials.filter((m, i) => m.orderIndex !== i);
        // We just reuse the editMutation to silently update orderIndex sequentially
        changed.forEach((m) => {
            const newIndex = newMaterials.findIndex(nm => nm._id === m._id);
            updateMaterial(m._id, { orderIndex: newIndex }).catch(console.error);
        });
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        
        if (!formData.text && !formData.code && !formData.link) {
            alert('Please fill in at least one of: Notes, Code Snippet, or URL Link.');
            return;
        }

        const nodeType = activeNode.type 
            ? activeNode.type.toUpperCase() 
            : 'TOPIC';

        const payload = { 
            title: formData.title || 'Untitled',
            text: formData.text || '',
            code: formData.code || '',
            link: formData.link || '',
            tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
            nodeId: activeNode._id,
            nodeType,
        };

        if (editingId) {
            editMutation.mutate({ id: editingId, data: payload });
        } else {
            addMutation.mutate(payload);
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
                <form onSubmit={handleFormSubmit} className="card" style={{ background: 'var(--bg-surface)', padding: isFullscreen ? '2rem 3rem' : '1.5rem', borderRadius: isFullscreen ? 0 : 'var(--radius-lg)', border: isFullscreen ? 'none' : '1px solid var(--border-color)', marginBottom: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', position: isFullscreen ? 'fixed' : 'relative', top: isFullscreen ? 0 : 'auto', left: isFullscreen ? 0 : 'auto', right: isFullscreen ? 0 : 'auto', bottom: isFullscreen ? 0 : 'auto', zIndex: isFullscreen ? 1000 : 1, overflowY: isFullscreen ? 'auto' : 'visible' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{editingId ? 'Edit Material' : 'Add Material'}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-ghost" onClick={() => setIsFullscreen(!isFullscreen)} title="Toggle Fullscreen" style={{ padding: '0.4rem' }}>
                                {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                            </button>
                            {!editingId && <button className="btn-ghost" onClick={cancelForm} style={{ padding: '0.4rem' }}><X size={16} /></button>}
                        </div>
                    </div>

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
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.5rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 500 }}>URL Link <span style={{ opacity: 0.6 }}>(optional)</span></label>
                                <button type="button" onClick={handleFetchTitle} disabled={!formData.link || isFetchingTitle} style={{ fontSize: '0.75rem', color: 'var(--accent-color)', background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem', padding: 0, opacity: (!formData.link || isFetchingTitle) ? 0.5 : 1 }}>
                                    {isFetchingTitle ? <Loader2 size={12} className="spin" /> : <RefreshCw size={12} />} Auto-Fill Title From URL
                                </button>
                            </div>
                            <input type="url" className="input-field" value={formData.link} placeholder="https://youtube.com/..." onChange={e => setFormData({ ...formData, link: e.target.value })} style={{ marginBottom: 0 }} />
                        </div>
                        
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>Markdown Notes <span style={{ opacity: 0.6 }}>(optional)</span></label>
                            <textarea className="input-field" rows={isFullscreen ? "15" : "5"} placeholder="Write your notes in Markdown..." value={formData.text} onChange={e => setFormData({ ...formData, text: e.target.value })} style={{ marginBottom: 0 }} />
                        </div>

                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 500, display: 'block', marginBottom: '0.4rem' }}>Code Snippet <span style={{ opacity: 0.6 }}>(optional)</span></label>
                            <textarea className="input-field" rows={isFullscreen ? "15" : "5"} placeholder="Paste your code here..." value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} style={{ fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: 0 }} />
                        </div>
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
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={filteredMaterials.map(m => m._id)} strategy={verticalListSortingStrategy}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {filteredMaterials.map((material) => (
                                <MaterialCard 
                                    key={material._id} 
                                    material={material} 
                                    onEdit={(id, data) => editMutation.mutate({ id, data })}
                                    onDelete={setDeletingMaterial}
                                    setTagFilter={setTagFilter}
                                    currentTagFilter={tagFilter}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
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
