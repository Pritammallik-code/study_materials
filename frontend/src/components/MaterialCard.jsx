import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Trash2, ExternalLink, FileText, Link as LinkIcon, Pencil, Code, GripVertical, Check, X } from 'lucide-react';

const TYPE_ICON = { TEXT: FileText, LINK: LinkIcon, CODE: Code, FILE: FileText };

export default function MaterialCard({ material, onEdit, onDelete, setTagFilter, currentTagFilter }) {
    let unifiedText = material.text || '';
    let unifiedCode = material.code || '';
    let unifiedLink = material.link || '';
    
    // Legacy support: map old exclusive content to unified fields
    if (material.type === 'TEXT' && material.content && !unifiedText) unifiedText = material.content;
    if (material.type === 'CODE' && material.content && !unifiedCode) unifiedCode = material.content;
    if (material.type === 'LINK' && material.content && !unifiedLink) unifiedLink = material.content;

    const [isInlineEditing, setIsInlineEditing] = useState(false);
    const [editData, setEditData] = useState({ 
        title: material.title, 
        text: unifiedText,
        code: unifiedCode,
        link: unifiedLink,
        tags: material.tags?.join(', ') || '' 
    });

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: material._id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 100 : 1
    };

    const handleSave = () => {
        onEdit(material._id, {
            title: editData.title,
            text: editData.text,
            code: editData.code,
            link: editData.link,
            tags: editData.tags.split(',').map(t => t.trim()).filter(Boolean)
        });
        setIsInlineEditing(false);
    };

    const Icon = TYPE_ICON[material.type] || FileText;

    if (isInlineEditing) {
        return (
            <div ref={setNodeRef} style={style} className="card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }}>
                    <input 
                        className="input-field" 
                        value={editData.title} 
                        onChange={e => setEditData(d => ({ ...d, title: e.target.value }))} 
                        placeholder="Title..." 
                        style={{ marginBottom: 0, fontWeight: 600, fontSize: '1rem' }} 
                    />
                    
                    <input type="url" className="input-field" placeholder="Link URL (optional)" value={editData.link} onChange={e => setEditData(d => ({ ...d, link: e.target.value }))} style={{ marginBottom: 0 }} />
                    <textarea className="input-field" rows="4" placeholder="Markdown Notes (optional)" value={editData.text} onChange={e => setEditData(d => ({ ...d, text: e.target.value }))} style={{ marginBottom: 0 }} />
                    <textarea className="input-field" rows="4" placeholder="Code block (optional)" value={editData.code} onChange={e => setEditData(d => ({ ...d, code: e.target.value }))} style={{ fontFamily: 'monospace', fontSize: '0.85rem', marginBottom: 0 }} />

                    <input 
                        className="input-field" 
                        value={editData.tags} 
                        onChange={e => setEditData(d => ({ ...d, tags: e.target.value }))} 
                        placeholder="Tags (comma-separated)..." 
                        style={{ marginBottom: 0, fontSize: '0.85rem' }} 
                    />
                    
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                        <button className="btn btn-ghost" onClick={() => { setIsInlineEditing(false); setEditData({ title: material.title, text: unifiedText, code: unifiedCode, link: unifiedLink, tags: material.tags?.join(', ') || '' }); }}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleSave}>Save</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} className="card" id={`mat-${material._id}`}>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div 
                    {...attributes} 
                    {...listeners} 
                    style={{ paddingTop: '0.2rem', cursor: 'grab', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', opacity: 0.5, ':hover': { opacity: 1 } }}
                    title="Drag to reorder"
                >
                    <GripVertical size={16} />
                </div>
                
                <div style={{ padding: '0.6rem', borderRadius: '50%', background: 'var(--bg-surface-hover)', color: 'var(--text-primary)', flexShrink: 0 }}>
                    <Icon size={18} />
                </div>
                
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem', gap: '0.5rem' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{material.title}</span>
                        <div style={{ display: 'flex', gap: '0.2rem', flexShrink: 0 }}>
                            <button className="btn-ghost" onClick={() => setIsInlineEditing(true)} style={{ padding: '0.2rem' }}><Pencil size={12} /></button>
                            <button className="btn-ghost" onClick={() => onDelete(material)} style={{ padding: '0.2rem' }}><Trash2 size={12} /></button>
                        </div>
                    </div>
                    
                    {unifiedLink && (
                        <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-surface-hover)', width: 'fit-content', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                            <a href={unifiedLink} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-color)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, textDecoration: 'none' }}>
                                <ExternalLink size={14} /> 
                                {(() => {
                                    try { return new URL(unifiedLink).hostname; }
                                    catch (e) { return unifiedLink.substring(0, 30); }
                                })()}
                            </a>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '300px' }}>{unifiedLink}</span>
                        </div>
                    )}
                    
                    {unifiedText && (
                        <div className="markdown-body" style={{ fontSize: '0.925rem', color: 'var(--text-primary)', lineHeight: 1.7, opacity: 0.9, marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{unifiedText}</ReactMarkdown>
                        </div>
                    )}
                    
                    {unifiedCode && (
                        <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)', fontSize: '0.85rem', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                            <SyntaxHighlighter language="javascript" style={vscDarkPlus} customStyle={{ margin: 0, padding: '1.25rem', backgroundColor: 'var(--bg-card)' }}>
                                {unifiedCode}
                            </SyntaxHighlighter>
                        </div>
                    )}
                    
                    {material.tags?.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                            {material.tags.map(tag => (
                                <span key={tag} onClick={() => setTagFilter(tag === currentTagFilter ? '' : tag)} style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '6px', background: 'var(--accent-soft)', color: 'var(--accent-color)', fontWeight: 600, cursor: 'pointer', transition: 'var(--transition)' }}>
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
