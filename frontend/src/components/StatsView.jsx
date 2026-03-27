import React from 'react';

export default function StatsView({ hierarchy, onSelectNode }) {
    const subjects = hierarchy.length;
    const chapters = hierarchy.reduce((a, s) => a + (s.chapters?.length || 0), 0);
    const topics = hierarchy.reduce((a, s) =>
        a + (s.chapters || []).reduce((b, c) => b + (c.topics?.length || 0), 0), 0);
    const completedTopics = hierarchy.reduce((a, s) =>
        a + (s.chapters || []).reduce((b, c) =>
            b + (c.topics || []).filter(t => t.isCompleted).length, 0), 0);
    const pct = topics > 0 ? Math.round((completedTopics / topics) * 100) : 0;

    // Recently modified topics
    const allTopics = hierarchy.flatMap(s =>
        (s.chapters || []).flatMap(c =>
            (c.topics || []).map(t => ({
                ...t,
                type: 'TOPIC',
                chapterName: c.name,
                subjectName: s.name,
            }))
        )
    ).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10);

    const statItems = [
        { label: 'Subjects', value: subjects },
        { label: 'Chapters', value: chapters },
        { label: 'Topics', value: topics },
        { label: 'Completed', value: `${completedTopics} / ${topics}` },
    ];

    return (
        <div>
            <h1 style={{ marginBottom: '0.25rem' }}>Overview</h1>
            <p style={{ marginBottom: '2rem' }}>Your study materials at a glance.</p>

            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                {statItems.map(({ label, value }) => (
                    <div key={label} className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
                        <div style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>{value}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                    </div>
                ))}
            </div>

            {/* Progress bar */}
            {topics > 0 && (
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 500 }}>Overall Progress</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '99px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-color)', borderRadius: '99px', transition: 'width 0.5s ease' }} />
                    </div>
                </div>
            )}

            {/* Recent topics */}
            {allTopics.length > 0 && (
                <div>
                    <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>Recently Modified</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {allTopics.map(t => (
                            <button 
                                key={t._id} 
                                onClick={() => onSelectNode(t, t.type)}
                                className="card" 
                                style={{ 
                                    padding: '1rem 1.25rem', 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    textAlign: 'left',
                                    width: '100%',
                                    marginBottom: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    cursor: 'pointer'
                                }}
                            >
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '0.15rem' }}>{t.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', opacity: 0.8 }}>{t.subjectName} › {t.chapterName}</div>
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', marginLeft: '1rem', background: 'var(--bg-surface-hover)', padding: '0.25rem 0.6rem', borderRadius: '4px' }}>
                                    {new Date(t.updatedAt).toLocaleDateString()}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {hierarchy.length === 0 && (
                <div className="empty-state" style={{ padding: '3rem 0' }}>
                    <p>No subjects yet. Create one from the sidebar to get started.</p>
                </div>
            )}
        </div>
    );
}
