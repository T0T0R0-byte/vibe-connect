import React from 'react';

interface StatusBadgeProps {
    status: string;
    type?: 'payment' | 'refund' | 'general';
    className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'general', className = '' }) => {
    const getStyles = () => {
        const s = status?.toLowerCase() || '';

        // Refund Statuses
        if (s === 'refunded') return 'bg-red-500/10 text-red-500 border-red-500/20';
        if (s === 'refund_requested' || s === 'refund requested') return 'bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse';
        if (s === 'refund_processing') return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
        if (s === 'vendor_proof_uploaded') return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
        if (s === 'participant_confirmed') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        if (s === 'participant_disputed') return 'bg-rose-500/10 text-rose-500 border-rose-500/20 font-black';

        // Payment Statuses
        if (s === 'paid') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
        if (s === 'pending') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
        if (s === 'failed' || s === 'rejected') return 'bg-red-500/10 text-red-500 border-red-500/20';

        return 'bg-secondary text-muted-foreground border-white/10';
    };

    const getLabel = () => {
        if (!status) return 'Unknown';
        return status.replace(/_/g, ' ');
    };

    return (
        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStyles()} ${className}`}>
            {getLabel()}
        </span>
    );
};

export default StatusBadge;
