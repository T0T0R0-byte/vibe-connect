import React from 'react';
import { Workshop } from "@/app/models/Workshop";
import { Registration } from "@/app/models/Registration";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { GlassCard } from "@/app/components/ui/GlassCard";
import dayjs from "dayjs";

interface OverviewViewProps {
    workshops: Workshop[];
    allParticipants: Registration[];
    onSwitchTab: (tab: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = React.memo(({ workshops, allParticipants, onSwitchTab }) => {

    const activeParticipants = allParticipants.filter(p =>
        ['paid', 'approved', 'pending', 'confirmed'].includes(p.status || '')
    );
    const pendingParticipants = allParticipants.filter(p => p.status === 'pending');
    const totalRevenue = activeParticipants.reduce((sum, p) => sum + ((p as any).workshopPrice || 0), 0);

    const stats = [
        { label: 'Total Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, icon: 'fa-coins', color: 'from-amber-500 to-orange-600', sub: 'Gross Earnings' },
        { label: 'Active Workshops', value: workshops.length, icon: 'fa-rocket', color: 'from-blue-500 to-indigo-600', sub: `${workshops.length} Listings Live` },
        { label: 'Total Participants', value: activeParticipants.length, icon: 'fa-users', color: 'from-emerald-500 to-teal-600', sub: `${pendingParticipants.length} Awaiting Approval` },
        { label: 'Avg. Rating', value: '5.0', icon: 'fa-star', color: 'from-purple-500 to-pink-600', sub: 'Verified Reviews' },
    ];

    const chartData = React.useMemo(() => {
        const days = Array.from({ length: 7 }, (_, i) => {
            const d = dayjs().subtract(6 - i, 'day');
            return { date: d.format('YYYY-MM-DD'), name: d.format('ddd'), value: 0 };
        });

        activeParticipants.forEach(p => {
            if ((p as any).createdAt) {
                const dateStr = dayjs((p as any).createdAt.seconds ? (p as any).createdAt.seconds * 1000 : (p as any).createdAt).format('YYYY-MM-DD');
                const dayData = days.find(d => d.date === dateStr);
                if (dayData) dayData.value += ((p as any).workshopPrice || 0);
            }
        });
        return days;
    }, [activeParticipants]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <GlassCard key={i} className="group relative !p-6 bg-secondary/30 hover:bg-secondary/50 overflow-hidden" hoverEffect>
                        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl -mr-10 -mt-10 group-hover:opacity-20 transition-opacity`}></div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                                    <i className={`fa-solid ${stat.icon} text-lg`}></i>
                                </div>
                            </div>
                            <h3 className="text-3xl font-black text-foreground tracking-tight mb-1">{stat.value}</h3>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-4 font-medium">{stat.sub}</p>
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <GlassCard className="lg:col-span-2 !p-8 bg-secondary/30">
                    <h3 className="text-xl font-black text-foreground tracking-tight mb-2">Revenue Analytics</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-8">Last 7 Days Performance</p>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                                <XAxis dataKey="name" stroke="#666" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dy={10} />
                                <YAxis stroke="#666" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(v) => `Rs.${v}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard className="!p-8 bg-secondary/30">
                    <h3 className="text-xl font-black text-foreground tracking-tight mb-2">Registration Status</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-8">Approval Overview</p>
                    <div className="h-[300px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Confirmed', value: activeParticipants.length - pendingParticipants.length },
                                        { name: 'Pending', value: pendingParticipants.length },
                                    ]}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#6366f1" />
                                    <Cell fill="#f59e0b" />
                                </Pie>
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
});

OverviewView.displayName = 'OverviewView';
