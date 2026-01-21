import React from 'react';
import { Workshop } from "@/app/models/Workshop";
import { Participant } from "@/app/models/Participant";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { GlassCard } from "@/app/components/ui/GlassCard";

interface OverviewViewProps {
    userData: any;
    workshops: Workshop[];
    participants: Participant[];
    totalRevenue: number;
    participantsMap: Record<string, Participant[]>;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ userData, workshops, participants, totalRevenue, participantsMap }) => {

    // Stats Logic (Pure View Logic)
    const activeParticipants = participants.filter(p => ['paid', 'approved', 'pending'].includes(p.status || ''));

    const stats = [
        { label: 'Total Revenue', value: `Rs. ${totalRevenue.toLocaleString()}`, icon: 'fa-coins', color: 'from-amber-500 to-orange-600', sub: '+12% from last month' },
        { label: 'Active Workshops', value: workshops.length, icon: 'fa-rocket', color: 'from-blue-500 to-indigo-600', sub: '3 Pending Approval' },
        { label: 'Total Participants', value: activeParticipants.length, icon: 'fa-users', color: 'from-emerald-500 to-teal-600', sub: '+24 new this week' },
        { label: 'Avg. Rating', value: '4.9', icon: 'fa-star', color: 'from-purple-500 to-pink-600', sub: 'Based on 128 reviews' },
    ];

    const chartData = [
        { name: 'Mon', value: 4000 },
        { name: 'Tue', value: 3000 },
        { name: 'Wed', value: 2000 },
        { name: 'Thu', value: 2780 },
        { name: 'Fri', value: 1890 },
        { name: 'Sat', value: 2390 },
        { name: 'Sun', value: 3490 },
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-1">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                <div className="relative bg-[#0a0a0a]/90 backdrop-blur-xl rounded-[2.4rem] p-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="space-y-4 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/80">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            Live Dashboard
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                            Welcome back, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-pink-400">
                                {userData?.displayName || 'Vibe Creator'}
                            </span>
                        </h2>
                        <p className="text-white/60 font-medium max-w-lg">
                            Here's what's happening with your workshops today. You have <span className="text-white font-bold">12 new participants</span> waiting for approval.
                        </p>
                    </div>
                    {/* Mini Quick Action */}
                    <div className="flex gap-4">
                        <button className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all group">
                            <i className="fa-solid fa-plus text-xl group-hover:scale-110 transition-transform"></i>
                        </button>
                        <button className="w-16 h-16 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-all group">
                            <i className="fa-solid fa-bell text-xl group-hover:rotate-12 transition-transform"></i>
                        </button>
                    </div>
                </div>
            </div>

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
                                <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                    <i className="fa-solid fa-arrow-trend-up mr-1"></i> 12%
                                </span>
                            </div>
                            <h3 className="text-3xl font-black text-foreground tracking-tight mb-1">{stat.value}</h3>
                            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                            <p className="text-[10px] text-muted-foreground/60 mt-4 font-medium">{stat.sub}</p>
                        </div>
                    </GlassCard>
                ))}
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-3 gap-8">
                {/* Revenue Chart */}
                <GlassCard className="lg:col-span-2 !p-8 bg-secondary/30">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-foreground tracking-tight">Revenue Analytics</h3>
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">Last 7 Days Performance</p>
                        </div>
                        <button className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-muted-foreground transition-all">
                            <i className="fa-solid fa-ellipsis"></i>
                        </button>
                    </div>
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
                                <YAxis stroke="#666" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} dx={-10} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                                    itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                                    cursor={{ stroke: '#6366f1', strokeWidth: 1 }}
                                />
                                <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                {/* Popular Categories */}
                <GlassCard className="!p-8 bg-secondary/30">
                    <h3 className="text-xl font-black text-foreground tracking-tight mb-2">Category Spread</h3>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest mb-8">Workshop Distribution</p>
                    <div className="h-[250px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Music', value: 400 },
                                        { name: 'Art', value: 300 },
                                        { name: 'Tech', value: 300 },
                                        { name: 'Dance', value: 200 },
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#6366f1" />
                                    <Cell fill="#ec4899" />
                                    <Cell fill="#10b981" />
                                    <Cell fill="#f59e0b" />
                                </Pie>
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Ring Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-8">
                            <div className="text-center">
                                <span className="block text-2xl font-black text-foreground">12</span>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">Active</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
    );
};
