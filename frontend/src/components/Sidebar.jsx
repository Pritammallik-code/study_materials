import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getHierarchy,
    createSubject, updateSubject, deleteSubject,
    createChapter, updateChapter, deleteChapter,
    createTopic, updateTopic, deleteTopic,
    toggleTopicCompleted, toggleTopicPinned,
    searchEverything
} from '../api';
import { ChevronRight, ChevronDown, Plus, Trash2, LogOut, Check, Pin, X, ChevronsUpDown, Search, Book } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

// ----------------------------------------------------------------
// A single editable tree node
// ----------------------------------------------------------------
function TreeNode({ node, type, activeNode, onSelectNode, allExpanded, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [editing, setEditing] = useState(false);
    const [editName, setEditName] = useState(node.name);
    const editRef = useRef(null);
    const queryClient = useQueryClient();

    const isOpen = allExpanded !== undefined ? allExpanded : expanded;

    const updateMutationFn = useCallback(() => {
        if (type === 'SUBJECT') return updateSubject(node._id, { name: editName });
        if (type === 'CHAPTER') return updateChapter(node._id, { name: editName });
        if (type === 'TOPIC') return updateTopic(node._id, { name: editName });
    }, [type, node._id, editName]);

    const updateMutation = useMutation({
        mutationFn: updateMutationFn,
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['hierarchy'] });
            const previousHierarchy = queryClient.getQueryData(['hierarchy']);
            
            queryClient.setQueryData(['hierarchy'], (old) => {
                if (!old) return old;
                if (type === 'SUBJECT') return old.map(s => s._id === node._id ? { ...s, name: editName } : s);
                if (type === 'CHAPTER') return old.map(s => ({ ...s, chapters: s.chapters?.map(c => c._id === node._id ? { ...c, name: editName } : c) }));
                if (type === 'TOPIC') return old.map(s => ({ ...s, chapters: s.chapters?.map(c => ({ ...c, topics: c.topics?.map(t => t._id === node._id ? { ...t, name: editName } : t) })) }));
                return old;
            });
            setEditing(false);
            return { previousHierarchy };
        },
        onError: (err, vars, context) => { if (context?.previousHierarchy) queryClient.setQueryData(['hierarchy'], context.previousHierarchy); },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['hierarchy'] })
    });

    const addMutation = useMutation({
        mutationFn: (name) => {
            if (type === 'SUBJECT') return createChapter({ name, subjectId: node._id });
            if (type === 'CHAPTER') return createTopic({ name, chapterId: node._id });
        },
        onMutate: async (name) => {
            await queryClient.cancelQueries({ queryKey: ['hierarchy'] });
            const previousHierarchy = queryClient.getQueryData(['hierarchy']);
            
            queryClient.setQueryData(['hierarchy'], (old) => {
                if (!old) return old;
                const tempId = `temp-${Date.now()}`;
                
                if (type === 'SUBJECT') {
                    return old.map(s => s._id === node._id ? { ...s, chapters: [...(s.chapters || []), { _id: tempId, name, topics: [] }] } : s);
                }
                if (type === 'CHAPTER') {
                    return old.map(s => ({
                        ...s,
                        chapters: s.chapters?.map(c => c._id === node._id ? { ...c, topics: [...(c.topics || []), { _id: tempId, name, isCompleted: false, isPinned: false }] } : c)
                    }));
                }
                return old;
            });
            setNewName('');
            setShowAddForm(false);
            return { previousHierarchy };
        },
        onError: (err, vars, context) => { if (context?.previousHierarchy) queryClient.setQueryData(['hierarchy'], context.previousHierarchy); },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['hierarchy'] })
    });

    const deleteMutation = useMutation({
        mutationFn: () => {
            if (type === 'SUBJECT') return deleteSubject(node._id);
            if (type === 'CHAPTER') return deleteChapter(node._id);
            if (type === 'TOPIC') return deleteTopic(node._id);
        },
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['hierarchy'] });
            const previousHierarchy = queryClient.getQueryData(['hierarchy']);
            
            queryClient.setQueryData(['hierarchy'], (old) => {
                if (!old) return old;
                if (type === 'SUBJECT') return old.filter(s => s._id !== node._id);
                if (type === 'CHAPTER') return old.map(s => ({ ...s, chapters: s.chapters?.filter(c => c._id !== node._id) }));
                if (type === 'TOPIC') return old.map(s => ({ ...s, chapters: s.chapters?.map(c => ({ ...c, topics: c.topics?.filter(t => t._id !== node._id) })) }));
                return old;
            });
            if (activeNode?._id === node._id) onSelectNode(null, null);
            return { previousHierarchy };
        },
        onError: (err, vars, context) => { if (context?.previousHierarchy) queryClient.setQueryData(['hierarchy'], context.previousHierarchy); },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['hierarchy'] })
    });

    const toggleCompletedMutation = useMutation({
        mutationFn: () => toggleTopicCompleted(node._id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['hierarchy'] });
            const previousHierarchy = queryClient.getQueryData(['hierarchy']);
            queryClient.setQueryData(['hierarchy'], (old) => {
                if (!old) return old;
                return old.map(s => ({
                    ...s,
                    chapters: s.chapters?.map(c => ({
                        ...c,
                        topics: c.topics?.map(t => t._id === node._id ? { ...t, isCompleted: !t.isCompleted } : t)
                    }))
                }));
            });
            return { previousHierarchy };
        },
        onError: (err, vars, context) => { if (context?.previousHierarchy) queryClient.setQueryData(['hierarchy'], context.previousHierarchy); },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['hierarchy'] })
    });

    const togglePinnedMutation = useMutation({
        mutationFn: () => toggleTopicPinned(node._id),
        onMutate: async () => {
            await queryClient.cancelQueries({ queryKey: ['hierarchy'] });
            const previousHierarchy = queryClient.getQueryData(['hierarchy']);
            queryClient.setQueryData(['hierarchy'], (old) => {
                if (!old) return old;
                return old.map(s => ({
                    ...s,
                    chapters: s.chapters?.map(c => ({
                        ...c,
                        topics: c.topics?.map(t => t._id === node._id ? { ...t, isPinned: !t.isPinned } : t)
                    }))
                }));
            });
            return { previousHierarchy };
        },
        onError: (err, vars, context) => { if (context?.previousHierarchy) queryClient.setQueryData(['hierarchy'], context.previousHierarchy); },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['hierarchy'] })
    });

    const handleAdd = (e) => { e.preventDefault(); if (newName.trim()) addMutation.mutate(newName); };
    const handleEditSave = (e) => { e?.preventDefault(); if (editName.trim() && editName !== node.name) updateMutation.mutate(); else setEditing(false); };
    const handleEditKeyDown = (e) => { if (e.key === 'Enter') handleEditSave(); if (e.key === 'Escape') { setEditName(node.name); setEditing(false); } };
    const startEdit = (e) => { e.stopPropagation(); setEditing(true); setTimeout(() => editRef.current?.select(), 50); };

    // Move node support
    const [showMove, setShowMove] = useState(false);
    const { data: hierarchy = [] } = useQuery({ queryKey: ['hierarchy'], queryFn: getHierarchy });

    const moveMutation = useMutation({
        mutationFn: (parentId) => {
            if (type === 'CHAPTER') return updateChapter(node._id, { subjectId: parentId });
            if (type === 'TOPIC') return updateTopic(node._id, { chapterId: parentId });
        },
        onMutate: async (parentId) => {
            await queryClient.cancelQueries({ queryKey: ['hierarchy'] });
            const previousHierarchy = queryClient.getQueryData(['hierarchy']);
            
            queryClient.setQueryData(['hierarchy'], (old) => {
                if (!old) return old;
                const newHierarchy = JSON.parse(JSON.stringify(old)); // Deep clone is easiest for moving
                
                if (type === 'CHAPTER') {
                    let targetChapter = null;
                    // Remove from old location
                    newHierarchy.forEach(s => {
                        const idx = s.chapters?.findIndex(c => c._id === node._id);
                        if (idx > -1) {
                            targetChapter = s.chapters.splice(idx, 1)[0];
                        }
                    });
                    // Add to new
                    if (targetChapter) {
                        const targetSubject = newHierarchy.find(s => s._id === parentId);
                        if (targetSubject) {
                            if (!targetSubject.chapters) targetSubject.chapters = [];
                            targetSubject.chapters.push(targetChapter);
                        }
                    }
                } else if (type === 'TOPIC') {
                    let targetTopic = null;
                    // Remove from old
                    newHierarchy.forEach(s => s.chapters?.forEach(c => {
                        const idx = c.topics?.findIndex(t => t._id === node._id);
                        if (idx > -1) {
                            targetTopic = c.topics.splice(idx, 1)[0];
                        }
                    }));
                    // Add to new
                    if (targetTopic) {
                        newHierarchy.forEach(s => s.chapters?.forEach(c => {
                            if (c._id === parentId) {
                                if (!c.topics) c.topics = [];
                                c.topics.push(targetTopic);
                            }
                        }));
                    }
                }
                return newHierarchy;
            });
            setShowMove(false);
            return { previousHierarchy };
        },
        onError: (err, vars, context) => { if (context?.previousHierarchy) queryClient.setQueryData(['hierarchy'], context.previousHierarchy); },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['hierarchy'] })
    });

    // Possible move targets
    const moveTargets = type === 'CHAPTER'
        ? hierarchy.filter(s => s._id !== node.subjectId)
        : hierarchy.flatMap(s => (s.chapters || []).filter(c => c._id !== node.chapterId));

    const childNodes = type === 'SUBJECT' ? node.chapters : node.topics;
    const childType = type === 'SUBJECT' ? 'CHAPTER' : 'TOPIC';
    const isActive = activeNode?._id === node._id;
    const topicCount = type === 'SUBJECT' ? (node.chapters || []).reduce((acc, c) => acc + (c.topics?.length || 0), 0) : (node.topics?.length || 0);
    const completedCount = type === 'SUBJECT'
        ? (node.chapters || []).reduce((acc, c) => acc + (c.topics?.filter(t => t.isCompleted).length || 0), 0)
        : (node.topics?.filter(t => t.isCompleted).length || 0);

    return (
        <div>
            <div
                className={`tree-node ${isActive ? 'active' : ''} ${type === 'TOPIC' && node.isCompleted ? 'completed' : ''}`}
                onClick={() => {
                    if (String(node._id).startsWith('temp-')) return;
                    onSelectNode(node, type);
                }}
                style={{ 
                    opacity: String(node._id).startsWith('temp-') ? 0.6 : 1, 
                    cursor: String(node._id).startsWith('temp-') ? 'wait' : 'pointer' 
                }}
            >
                <div className="tree-node-content">
                    {type !== 'TOPIC' ? (
                        <button
                            className="btn-ghost"
                            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                            style={{ padding: '0.2rem' }}
                        >
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    ) : (
                        <button
                            className="btn-ghost"
                            onClick={(e) => { e.stopPropagation(); toggleCompletedMutation.mutate(); }}
                            style={{ padding: '0.2rem', marginLeft: '0.25rem', opacity: node.isCompleted ? 1 : 0.3 }}
                            title="Mark complete"
                        >
                            <Check size={13} />
                        </button>
                    )}

                    {editing ? (
                        <input
                            ref={editRef}
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            onBlur={handleEditSave}
                            onKeyDown={handleEditKeyDown}
                            onClick={e => e.stopPropagation()}
                            style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--accent-color)', outline: 'none', color: 'inherit', fontSize: 'inherit', padding: '0.1rem 0' }}
                        />
                    ) : (
                        <span
                            onDoubleClick={startEdit}
                            style={{ fontWeight: type === 'SUBJECT' ? 500 : 400, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: type === 'TOPIC' && node.isCompleted ? 0.5 : 1 }}
                            title="Double-click to rename"
                        >
                            {node.name}
                        </span>
                    )}

                    {type !== 'TOPIC' && topicCount > 0 && (
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '0.25rem', whiteSpace: 'nowrap' }}>
                            {completedCount}/{topicCount}
                        </span>
                    )}
                </div>

                <div className="tree-node-actions" style={{ display: 'flex', gap: '0.1rem', flexShrink: 0 }}>
                    {type === 'TOPIC' && (
                        <button className="btn-ghost" onClick={(e) => { e.stopPropagation(); togglePinnedMutation.mutate(); }}
                            style={{ padding: '0.2rem', opacity: node.isPinned ? 1 : 0.3 }} title={node.isPinned ? 'Unpin' : 'Pin'}>
                            <Pin size={12} />
                        </button>
                    )}
                    {type !== 'TOPIC' && (
                        <button className="btn-ghost" style={{ padding: '0.2rem' }}
                            onClick={(e) => { e.stopPropagation(); setShowAddForm(!showAddForm); setExpanded(true); }}>
                            <Plus size={13} />
                        </button>
                    )}
                    {type !== 'SUBJECT' && (
                        <button className="btn-ghost" style={{ padding: '0.2rem' }}
                            onClick={(e) => { e.stopPropagation(); setShowMove(!showMove); }} title="Move to...">
                            <ChevronsUpDown size={12} />
                        </button>
                    )}
                    <button className="btn-ghost" style={{ padding: '0.2rem' }}
                        onClick={(e) => { e.stopPropagation(); onDelete(node, type); }}
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>

            {showAddForm && (
                <form onSubmit={handleAdd} style={{ padding: '0.25rem 0.5rem 0.25rem 2.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input autoFocus className="input-field" placeholder={`New ${childType?.toLowerCase() || ''}...`}
                        value={newName} onChange={e => setNewName(e.target.value)}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', marginBottom: 0, flex: 1 }} />
                    <button type="button" className="btn-ghost" onClick={() => setShowAddForm(false)} style={{ padding: '0.25rem' }}><X size={12} /></button>
                </form>
            )}

            {showMove && moveTargets.length > 0 && (
                <div style={{ padding: '0.25rem 0.5rem 0.25rem 2.5rem' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Move to:</div>
                    {moveTargets.map(t => (
                        <button key={t._id} className="btn-ghost"
                            onClick={(e) => { e.stopPropagation(); moveMutation.mutate(t._id); }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}>
                            {t.name}
                        </button>
                    ))}
                </div>
            )}

            {isOpen && childNodes && childNodes.length > 0 && (
                <div className="tree-children">
                    {childNodes.map(child => (
                        <TreeNode key={child._id} node={child} type={childType}
                            activeNode={activeNode} onSelectNode={onSelectNode}
                            allExpanded={allExpanded} onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ----------------------------------------------------------------
// Root section — adds Subjects
// ----------------------------------------------------------------
function RootSection({ hierarchy, allExpanded, activeNode, onSelectNode }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const queryClient = useQueryClient();

    const addMutation = useMutation({
        mutationFn: (name) => createSubject({ name }),
        onMutate: async (name) => {
            await queryClient.cancelQueries({ queryKey: ['hierarchy'] });
            const previousHierarchy = queryClient.getQueryData(['hierarchy']);
            
            queryClient.setQueryData(['hierarchy'], (old) => {
                const tempId = `temp-${Date.now()}`;
                return [...(old || []), { _id: tempId, name, chapters: [] }];
            });
            setNewName('');
            setShowAddForm(false);
            return { previousHierarchy };
        },
        onError: (err, newName, context) => {
            if (context?.previousHierarchy) queryClient.setQueryData(['hierarchy'], context.previousHierarchy);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['hierarchy'] })
    });

    const handleAdd = (e) => { e.preventDefault(); if (newName.trim()) addMutation.mutate(newName); };

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 1rem 0.5rem', paddingBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subjects</span>
                <button className="btn-ghost" onClick={() => setShowAddForm(v => !v)} style={{ padding: '0.25rem' }} title="Add Subject"><Plus size={14} /></button>
            </div>
            {showAddForm && (
                <form onSubmit={handleAdd} style={{ padding: '0 1rem 0.75rem', display: 'flex', gap: '0.5rem' }}>
                    <input autoFocus className="input-field" placeholder="New Subject..."
                        value={newName} onChange={e => setNewName(e.target.value)}
                        style={{ padding: '0.4rem 0.75rem', marginBottom: 0, flex: 1, fontSize: '0.85rem' }} />
                    <button type="button" className="btn-ghost" onClick={() => setShowAddForm(false)} style={{ padding: '0' }}><X size={14} /></button>
                </form>
            )}
            {(hierarchy || []).map(subject => (
                <TreeNode key={subject._id} node={subject} type="SUBJECT"
                    activeNode={activeNode} onSelectNode={onSelectNode}
                    allExpanded={allExpanded}
                />
            ))}
            {(hierarchy || []).length === 0 && (
                <p style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>No subjects yet. Add one above!</p>
            )}
        </>
    );
}

// ----------------------------------------------------------------
// Main Sidebar Export
// ----------------------------------------------------------------
export default function Sidebar({ activeNode, onSelectNode, onLogout, user, recents }) {
    const [search, setSearch] = useState('');
    const [allExpanded, setAllExpanded] = useState(undefined);
    const [showAddForm, setShowAddForm] = useState(false);
    const [deletingNode, setDeletingNode] = useState(null);
    const queryClient = useQueryClient();

    const { data: hierarchy = [], isLoading, error } = useQuery({
        queryKey: ['hierarchy'],
        queryFn: getHierarchy
    });

    const { data: globalResults } = useQuery({
        queryKey: ['global-search', search],
        queryFn: () => searchEverything(search),
        enabled: search.trim().length > 1,
        staleTime: 500
    });

    // Collect all pinned topics
    const pinnedTopics = hierarchy.flatMap(s =>
        (s.chapters || []).flatMap(c =>
            (c.topics || []).filter(t => t.isPinned)
        )
    );

    // Filter hierarchy by search query
    const getFilteredHierarchy = () => {
        if (!search.trim()) return hierarchy;
        const q = search.toLowerCase();
        return hierarchy.reduce((acc, subject) => {
            const matchSubject = subject.name.toLowerCase().includes(q);
            const filteredChapters = (subject.chapters || []).reduce((ca, chapter) => {
                const matchChapter = chapter.name.toLowerCase().includes(q);
                const filteredTopics = (chapter.topics || []).filter(t => t.name.toLowerCase().includes(q));
                if (matchChapter || filteredTopics.length > 0) {
                    ca.push({ ...chapter, topics: matchChapter ? chapter.topics : filteredTopics });
                }
                return ca;
            }, []);
            if (matchSubject || filteredChapters.length > 0) {
                acc.push({ ...subject, chapters: matchSubject ? subject.chapters : filteredChapters });
            }
            return acc;
        }, []);
    };

    const displayHierarchy = getFilteredHierarchy();
    const forceExpanded = search.trim() ? true : allExpanded;

    const deleteMutation = useMutation({
        mutationFn: ({ id, type }) => {
            if (type === 'SUBJECT') return deleteSubject(id);
            if (type === 'CHAPTER') return deleteChapter(id);
            if (type === 'TOPIC') return deleteTopic(id);
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['hierarchy'] });
            
            if (data?.deletedIds) {
                if (activeNode?._id && data.deletedIds.includes(activeNode._id)) {
                    onSelectNode(null, null);
                }
                if (onNodeDeleted) {
                    onNodeDeleted(data.deletedIds);
                }
            } else {
                if (activeNode?._id === deletingNode?.node?._id) onSelectNode(null, null);
            }
            
            setDeletingNode(null);
        }
    });

    const handleExpandAll = () => setAllExpanded(true);
    const handleCollapseAll = () => setAllExpanded(false);
    const handleCollapseReset = () => setAllExpanded(undefined);

    return (
        <aside className="sidebar" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="sidebar-header" style={{ padding: '1.75rem 1.25rem', justifyContent: 'space-between', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                <button 
                    onClick={() => onSelectNode(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-primary)', fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    <div style={{ width: '32px', height: '32px', background: 'var(--text-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--bg-card)' }}>
                        <Book size={18} />
                    </div>
                    Study App
                </button>
                <button className="btn-ghost mobile-hide" onClick={onLogout} title="Logout" style={{ padding: '0.35rem' }}>
                    <LogOut size={16} />
                </button>
            </div>

            <div style={{ padding: '0 1.25rem 0.5rem' }}>
                <div style={{ position: 'relative' }}>
                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                    <input 
                        id="sidebar-search"
                        className="input-field" 
                        placeholder="Search materials/nodes... (/)" 
                        value={search} 
                        onChange={e => { setSearch(e.target.value); setAllExpanded(true); if (!e.target.value) setAllExpanded(undefined); }}
                        style={{ paddingLeft: '2.5rem', marginBottom: 0, fontSize: '0.85rem' }}
                    />
                </div>
            </div>

            {/* Recents */}
            {!search && recents?.length > 0 && (
                <div style={{ padding: '0.5rem 1rem 0' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Recents</div>
                    {recents.map(r => (
                        <button key={r._id} onClick={() => onSelectNode(r, r.type)}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.25rem 0.5rem', fontSize: '0.82rem', borderRadius: 'var(--radius-md)', background: activeNode?._id === r._id ? 'var(--accent-color)' : 'transparent', color: activeNode?._id === r._id ? 'white' : 'var(--text-primary)', cursor: 'pointer', border: 'none', fontFamily: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.name}
                        </button>
                    ))}
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.35rem 0 0' }} />
                </div>
            )}

            {/* Pinned Topics */}
            {pinnedTopics.length > 0 && (
                <div style={{ padding: '0.75rem 1rem 0' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.25rem' }}>Pinned</div>
                    {pinnedTopics.map(t => (
                        <button key={t._id} onClick={() => onSelectNode(t, 'TOPIC')}
                            style={{
                                display: 'block', width: '100%', textAlign: 'left',
                                padding: '0.3rem 0.5rem', fontSize: '0.85rem',
                                borderRadius: 'var(--radius-md)',
                                background: activeNode?._id === t._id ? 'var(--accent-color)' : 'transparent',
                                color: activeNode?._id === t._id ? 'white' : 'var(--text-primary)',
                                cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                            {t.name}
                        </button>
                    ))}
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />
                </div>
            )}

            {/* Search Results (Global) */}
            {search.trim().length > 1 && globalResults && (
                <div style={{ padding: '0.75rem 1rem 0' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Global Results</div>
                    
                    {/* Node Matches */}
                    {globalResults.nodes?.map(n => (
                        <button key={`${n.type}-${n._id}`} onClick={() => onSelectNode(n, n.type)}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.3rem 0.5rem', fontSize: '0.82rem', borderRadius: 'var(--radius-md)', background: activeNode?._id === n._id ? 'var(--accent-color)' : 'transparent', color: activeNode?._id === n._id ? 'white' : 'var(--text-primary)', cursor: 'pointer', border: 'none', fontFamily: 'inherit', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ opacity: 0.6, fontSize: '0.7rem', marginRight: '0.4rem' }}>[{n.type.charAt(0)}]</span> {n.name}
                        </button>
                    ))}

                    {/* Material Content Matches */}
                    {globalResults.materials?.map(m => (
                        <button key={`material-${m._id}`} 
                            onClick={() => {
                                // To show material, we must navigate to its parent node.
                                // The backend search sends nodeId and nodeType in the material object.
                                onSelectNode({ _id: m.nodeId, name: '...' }, m.nodeType);
                            }}
                            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '0.3rem 0.5rem', fontSize: '0.82rem', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', border: 'none', fontFamily: 'inherit', marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span style={{ opacity: 0.6, fontSize: '0.7rem', marginRight: '0.4rem' }}>[M]</span> {m.title}
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '1px', fontStyle: 'italic' }}>
                                {m.content?.substring(0, 40)}...
                            </div>
                        </button>
                    ))}

                    {!globalResults.nodes?.length && !globalResults.materials?.length && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', padding: '0 0.5rem' }}>No matches found.</p>
                    )}
                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.5rem 0' }} />
                </div>
            )}

            {/* Expand / Collapse controls */}
            <div style={{ padding: '0.5rem 1rem 0', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Subjects</span>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                    <button className="btn-ghost" onClick={handleExpandAll} style={{ padding: '0.2rem', fontSize: '0.7rem' }} title="Expand all">+All</button>
                    <button className="btn-ghost" onClick={handleCollapseAll} style={{ padding: '0.2rem', fontSize: '0.7rem' }} title="Collapse all">-All</button>
                    <button className="btn-ghost" onClick={() => setShowAddForm(v => !v)} style={{ padding: '0.2rem' }} title="Add Subject">
                        <Plus size={14} />
                    </button>
                </div>
            </div>

            {/* Tree */}
            <div className="sidebar-content" style={{ paddingTop: '0.25rem' }}>
                {isLoading ? (
                    <p style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Loading...</p>
                ) : error ? (
                    <p style={{ padding: '1rem', color: 'red', fontSize: '0.85rem' }}>Error loading data</p>
                ) : (
                    <RootAddButton 
                        hierarchy={displayHierarchy} 
                        allExpanded={forceExpanded} 
                        activeNode={activeNode} 
                        onSelectNode={onSelectNode}
                        showAddForm={showAddForm}
                        setShowAddForm={setShowAddForm}
                        onDelete={(node, type) => setDeletingNode({ node, type })}
                    />
                )}
            </div>

            <ConfirmModal
                isOpen={!!deletingNode}
                onClose={() => setDeletingNode(null)}
                onConfirm={() => deleteMutation.mutate({ id: deletingNode.node._id, type: deletingNode.type })}
                title={`Delete ${deletingNode?.type?.toLowerCase()}?`}
                message={`Are you sure you want to delete "${deletingNode?.node?.name}"? All nested data will be lost.`}
            />

            {/* Footer */}
            {user?.name && (
                <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: 'var(--bg-surface-hover)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.7rem', flexShrink: 0 }}>
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</span>
                </div>
            )}
        </aside>
    );
}

function RootAddButton({ hierarchy, allExpanded, activeNode, onSelectNode, showAddForm, setShowAddForm, onDelete }) {
    const [newName, setNewName] = useState('');
    const queryClient = useQueryClient();

    const addMutation = useMutation({
        mutationFn: (name) => createSubject({ name }),
        onMutate: async (name) => {
            await queryClient.cancelQueries({ queryKey: ['hierarchy'] });
            const previousHierarchy = queryClient.getQueryData(['hierarchy']);
            
            queryClient.setQueryData(['hierarchy'], (old) => {
                const tempId = `temp-${Date.now()}`;
                return [...(old || []), { _id: tempId, name, chapters: [] }];
            });
            setNewName('');
            setShowAddForm(false);
            return { previousHierarchy };
        },
        onError: (err, newName, context) => {
            if (context?.previousHierarchy) queryClient.setQueryData(['hierarchy'], context.previousHierarchy);
        },
        onSettled: () => queryClient.invalidateQueries({ queryKey: ['hierarchy'] })
    });

    const handleAdd = (e) => { e.preventDefault(); if (newName.trim()) addMutation.mutate(newName); };

    return (
        <>
            {showAddForm && (
                <form onSubmit={handleAdd} style={{ padding: '0 1rem 0.5rem', display: 'flex', gap: '0.5rem' }}>
                    <input autoFocus className="input-field" placeholder="New subject..."
                        value={newName} onChange={e => setNewName(e.target.value)}
                        style={{ padding: '0.4rem 0.75rem', marginBottom: 0, flex: 1, fontSize: '0.85rem' }} />
                    <button type="button" className="btn-ghost" onClick={() => setShowAddForm(false)} style={{ padding: '0' }}><X size={14} /></button>
                </form>
            )}
            {(hierarchy || []).length === 0 && !showAddForm && (
                <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>No subjects yet.</p>
                    <button className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }} onClick={() => setShowAddForm(true)}><Plus size={13} /> Add Subject</button>
                </div>
            )}
            {(hierarchy || []).map(subject => (
                <TreeNode key={subject._id} node={subject} type="SUBJECT"
                    activeNode={activeNode} onSelectNode={onSelectNode}
                    allExpanded={allExpanded} onDelete={onDelete}
                />
            ))}
        </>
    );
}
