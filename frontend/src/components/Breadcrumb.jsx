import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function Breadcrumb({ ancestors, onSelect }) {
    if (!ancestors || ancestors.length === 0) return null;
    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            marginBottom: '1rem',
            flexWrap: 'wrap',
        }}>
            {ancestors.map((crumb, i) => (
                <React.Fragment key={crumb._id}>
                    <button
                        onClick={() => onSelect(crumb, crumb.type)}
                        style={{
                            color: i === ancestors.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: i === ancestors.length - 1 ? 500 : 400,
                            cursor: i === ancestors.length - 1 ? 'default' : 'pointer',
                            padding: '0',
                            background: 'none',
                            border: 'none',
                            fontSize: '0.8rem',
                        }}
                        disabled={i === ancestors.length - 1}
                    >
                        {crumb.name}
                    </button>
                    {i < ancestors.length - 1 && <ChevronRight size={12} color="var(--text-secondary)" />}
                </React.Fragment>
            ))}
        </div>
    );
}
