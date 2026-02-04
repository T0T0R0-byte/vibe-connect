import React from 'react';

interface StatusBadgeProps {
    status: string;
    type?: 'payment' | 'refund' | 'general';
    className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'general', className = '' }) => {
    const getStyles = () => {
        const s = status?.toLowerCase() || '';

        // Base Statuses (Unified for User Clarity)
        if (['approved', 'confirmed', 'paid', 'participant_confirmed'].includes(s))
            return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';

        if (s === 'pending' || s === 'refund_requested') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        if (s === 'failed' || s === 'rejected' || s === 'refund_rejected') return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (s === 'refunded') return 'bg-purple-500/10 text-purple-500 border-purple-500/20';

        return 'bg-secondary text-muted-foreground border-white/10';
    };

    const getLabel = () => {
        if (!status) return 'Unknown';
        const s = status.toLowerCase();
        if (['approved', 'confirmed', 'paid', 'participant_confirmed'].includes(s)) return 'PAID';
        return status.replace(/_/g, ' ');
    };

    return (
        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStyles()} ${className}`}>
            {getLabel()}
        </span>
    );
};

export default StatusBadge;
