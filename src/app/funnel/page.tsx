'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2, Users, Target, DollarSign, TrendingUp, HelpCircle } from 'lucide-react';
import { DateRangePicker } from '@/components/date-range-picker';

interface DimStats {
    name: string;
    inquiryCount: number;
    conversionCount: number;
    conversionRate: number;
}

interface FunnelData {
    totalStudents: number;
    totalConversionAmount: number;
    stages: {
        stage: string;
        count: number;
        percentage: number;
        conversionRate: number | null;
    }[];
    byCourse: DimStats[];
    bySource: DimStats[];
    byMethod: DimStats[];
    byConversionCourse: {
        course: string;
        count: number;
    }[];
}

export default function FunnelPage() {
    const [data, setData] = useState<FunnelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<{ from?: string, to?: string }>({});

    const COLORS = ['#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#172554', '#0f172a'];

    useEffect(() => {
        const calculateFunnel = async () => {
            setLoading(true);
            try {
                let url = '/api/funnel';
                const params = new URLSearchParams();
                if (dateRange.from) params.set('from', dateRange.from);
                if (dateRange.to) params.set('to', dateRange.to);
                if (params.toString()) url += `?${params.toString()}`;

                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch data');
                const result = await response.json();
                setData(result);
            } catch (error) {
                console.error('Error fetching funnel data:', error);
            } finally {
                setLoading(false);
            }
        };

        calculateFunnel();
    }, [dateRange]);

    if (loading && !data) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!data) return <div className="p-8 text-center text-slate-500">查無數據，請調整篩選條件</div>;

    const chartData = data.stages.map(s => ({
        name: s.stage.split(' ').slice(1).join(' '),
        fullName: s.stage,
        count: s.count,
        percentage: s.percentage
    }));

    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">銷售漏斗戰情室</h2>
                    <p className="text-slate-500 font-medium">即時監測各階段轉換數據與成交分析</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border shadow-sm">
                    <DateRangePicker from={dateRange.from} to={dateRange.to} onRangeChange={(f, t) => setDateRange({ from: f, to: t })} />
                    <div className="w-px h-6 bg-slate-200 hidden md:block" />
                    <Button onClick={() => window.location.href = '/funnel/performance'} variant="outline">查看績效</Button>
                    <Button onClick={() => window.location.href = '/funnel/update'}>+ 回報進度</Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardDescription className="font-semibold text-slate-500 flex items-center gap-2 italic">
                            <Users className="w-4 h-4" /> 總洽詢人數 (Inquiries)
                        </CardDescription>
                        <CardTitle className="text-3xl font-black">{data.totalStudents} <span className="text-sm font-normal text-slate-400">人</span></CardTitle>
                    </CardHeader>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-600 bg-green-50/10">
                    <CardHeader className="pb-2">
                        <CardDescription className="font-semibold text-green-700 flex items-center gap-2">
                            <Target className="w-4 h-4" /> 總成交人數 (Conversions)
                        </CardDescription>
                        <CardTitle className="text-3xl font-black text-green-700">
                            {data.stages.find(s => s.stage.includes('成交'))?.count || 0} <span className="text-sm font-normal text-slate-400 font-bold">人</span>
                        </CardTitle>
                    </CardHeader>
                </Card>

                <Card className="hover:shadow-md transition-shadow border-l-4 border-l-rose-500 bg-rose-50/20 md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardDescription className="font-semibold text-rose-700 flex items-center gap-2">
                            <DollarSign className="w-4 h-4" /> 總成交金額
                        </CardDescription>
                        <CardTitle className="text-4xl font-black text-rose-700">
                            <span className="text-xl mr-1">$</span>
                            {(data.totalConversionAmount || 0).toLocaleString()}
                        </CardTitle>
                    </CardHeader>
                </Card>
            </div>

            {/* Main Funnel Chart */}
            <Card className="shadow-lg border-none overflow-hidden">
                <CardHeader className="bg-slate-900 border-none pb-8 text-white">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-400" />
                        全流程漏斗轉換率
                    </CardTitle>
                    <CardDescription className="text-slate-400">顯示各階段從洽詢到成交的留存狀況</CardDescription>
                </CardHeader>
                <CardContent className="bg-white pt-10">
                    <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 80, left: 60, bottom: 5 }} barSize={35}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" hide />
                                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 13, fontWeight: 500, fill: '#64748B' }} axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: '#F8FAFC' }} />
                                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                                    {chartData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                    <LabelList dataKey="count" position="right" offset={10} style={{ fontSize: '13px', fontWeight: 700, fill: '#1E293B' }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Multi-Dimensional Comparison Grid */}
            <div className="grid gap-8 md:grid-cols-2">
                {/* 1. 來源分析 */}
                <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="bg-blue-600 text-white">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            顧客來源品質對比 (洽詢 vs 成交)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-10">
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.bySource} margin={{ top: 30, right: 20, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={11} tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        formatter={(val, name) => [val, name === 'inquiryCount' ? '洽詢件數' : '成交件數']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="inquiryCount" name="洽詢" fill="#93C5FD" radius={[4, 4, 0, 0]} barSize={25}>
                                        <LabelList dataKey="inquiryCount" position="top" offset={10} style={{ fontSize: '10px', fontWeight: 600, fill: '#64748B' }} />
                                    </Bar>
                                    <Bar dataKey="conversionCount" name="成交" fill="#10B981" radius={[4, 4, 0, 0]} barSize={25}>
                                        <LabelList
                                            dataKey="conversionCount"
                                            position="top"
                                            content={(props: any) => {
                                                const { x, y, value, index } = props;
                                                const rate = data.bySource[index]?.conversionRate;
                                                return (
                                                    <g>
                                                        <text x={x + 12.5} y={y - 22} fill="#059669" textAnchor="middle" style={{ fontSize: '9px', fontWeight: 700 }}>{rate}%</text>
                                                        <text x={x + 12.5} y={y - 8} fill="#059669" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 800 }}>{value}</text>
                                                    </g>
                                                );
                                            }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 2. 管道分析 */}
                <Card className="border-none shadow-md overflow-hidden">
                    <CardHeader className="bg-purple-600 text-white">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            首洽管道品質對比 (洽詢 vs 成交)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-10">
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.byMethod} margin={{ top: 30, right: 20, left: 0, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={11} tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} />
                                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        formatter={(val, name) => [val, name === 'inquiryCount' ? '洽詢件數' : '成交件數']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="inquiryCount" name="洽詢" fill="#C084FC" radius={[4, 4, 0, 0]} barSize={25}>
                                        <LabelList dataKey="inquiryCount" position="top" offset={10} style={{ fontSize: '10px', fontWeight: 600, fill: '#64748B' }} />
                                    </Bar>
                                    <Bar dataKey="conversionCount" name="成交" fill="#10B981" radius={[4, 4, 0, 0]} barSize={25}>
                                        <LabelList
                                            dataKey="conversionCount"
                                            position="top"
                                            content={(props: any) => {
                                                const { x, y, value, index } = props;
                                                const rate = data.byMethod[index]?.conversionRate;
                                                return (
                                                    <g>
                                                        <text x={x + 12.5} y={y - 22} fill="#059669" textAnchor="middle" style={{ fontSize: '9px', fontWeight: 700 }}>{rate}%</text>
                                                        <text x={x + 12.5} y={y - 8} fill="#059669" textAnchor="middle" style={{ fontSize: '10px', fontWeight: 800 }}>{value}</text>
                                                    </g>
                                                );
                                            }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. 課程轉化排行 */}
                <Card className="border-none shadow-md overflow-hidden md:col-span-2">
                    <CardHeader className="bg-orange-600 text-white">
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                            課程轉化效率對比 (洽詢熱度 vs 真實成交)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.byCourse} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tick={{ fill: '#64748B' }} axisLine={false} tickLine={false} />
                                    <YAxis yAxisId="left" fontSize={11} tickLine={false} axisLine={false} label={{ value: '洽詢與成交(人)', angle: -90, position: 'insideLeft', offset: -10 }} />
                                    <YAxis yAxisId="right" orientation="right" unit="%" fontSize={11} axisLine={false} tickLine={false} label={{ value: '平均成交率(%)', angle: 90, position: 'insideRight' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px' }} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar yAxisId="left" dataKey="inquiryCount" name="洽詢人數" fill="#FFD6A5" radius={[4, 4, 0, 0]} barSize={35} />
                                    <Bar yAxisId="left" dataKey="conversionCount" name="成交人數" fill="#10B981" radius={[4, 4, 0, 0]} barSize={35} />
                                    <Bar yAxisId="right" dataKey="conversionRate" name="成交轉化率" fill="#FFB7B2" radius={[4, 4, 0, 0]} barSize={10} opacity={0.3} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Detail Table */}
            <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden">
                <CardHeader className="bg-slate-50 border-b">
                    <CardTitle className="text-xl font-bold">全流程數據詳情</CardTitle>
                    <CardDescription>總體洽詢轉化為各階段的詳細數據</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-100/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 text-left font-bold text-slate-600">階段名稱</th>
                                    <th className="px-6 py-4 text-right font-bold text-slate-600">階段人數</th>
                                    <th className="px-6 py-4 text-right font-bold text-slate-600">總體佔比</th>
                                    <th className="px-6 py-4 text-right font-bold text-slate-600">狀態與進度</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {data.stages.map((stage) => (
                                    <tr key={stage.stage} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 font-semibold text-slate-800">{stage.stage}</td>
                                        <td className="px-6 py-4 text-right font-mono font-bold">{stage.count}人</td>
                                        <td className="px-6 py-4 text-right font-mono text-slate-500">{stage.percentage}%</td>
                                        <td className="px-6 py-4 text-right min-w-[200px]">
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="h-2 w-32 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${stage.percentage}%` }} />
                                                </div>
                                                <span className="w-10 text-xs font-bold text-blue-600">{stage.percentage}%</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
