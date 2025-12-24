"use client"

import { useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DateRangePicker } from "@/components/date-range-picker"
import { Loader2, Users, Target, UserCheck, BarChart3, PieChart as PieIcon, Award, DollarSign } from "lucide-react"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, LabelList
} from 'recharts';
import { cn } from "@/lib/utils"

interface DimStats {
    name: string;
    inquiryCount: number;
    conversionCount: number;
    conversionRate: number;
}

interface PerformanceData {
    name: string;
    total: number;
    stage2Count: number;
    stage3Count: number;
    stage4Count: number;
    stage5Count: number;
    contactRate: number;
    appointmentRate: number;
    visitRate: number;
    conversionRate: number;
    overallRate: number;
}

interface FunnelData {
    totalStudents: number;
    totalConversionAmount: number;
    bySource: DimStats[];
    byMethod: DimStats[];
    byCourse: DimStats[];
    byConversionCourse: { course: string; count: number }[];
}

export default function PerformancePage() {
    const [performanceData, setPerformanceData] = useState<PerformanceData[] | null>(null);
    const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState<{ from?: string, to?: string }>({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const query = new URLSearchParams();
                if (dateRange.from) query.set("from", dateRange.from);
                if (dateRange.to) query.set("to", dateRange.to);
                const queryString = query.toString() ? `?${query.toString()}` : "";

                const [perfRes, funnelRes] = await Promise.all([
                    fetch(`/api/analytics/consultant${queryString}`),
                    fetch(`/api/funnel${queryString}`)
                ]);

                if (!perfRes.ok || !funnelRes.ok) throw new Error("Failed to fetch statistics");

                const perfResult = await perfRes.json();
                const funnelResult = await funnelRes.json();

                setPerformanceData(perfResult);
                setFunnelData(funnelResult);
            } catch (error) {
                console.error("Error fetching analytics data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [dateRange]);

    if (loading && !performanceData) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const totalConversions = performanceData?.reduce((acc, curr) => acc + curr.stage5Count, 0) || 0;

    return (
        <div className="space-y-8 p-8 max-w-[1600px] mx-auto pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-2">全維度績效與市場分析</h2>
                    <p className="text-slate-500 font-medium">深入分析諮詢師表現與市場獲客效率</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-xl border shadow-sm">
                    <DateRangePicker from={dateRange.from} to={dateRange.to} onRangeChange={(f, t) => setDateRange({ from: f, to: t })} />
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 text-slate-500 italic">
                        <CardTitle className="text-sm font-bold">總洽詢人數 (Inquiries)</CardTitle>
                        <Users className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{funnelData?.totalStudents || 0} <span className="text-xs text-slate-400 font-normal ml-1">人</span></div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-600 shadow-sm hover:shadow-md transition-shadow bg-green-50/10">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 text-green-700">
                        <CardTitle className="text-sm font-bold">總成交人數 (Conversions)</CardTitle>
                        <Target className="h-4 w-4" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-black">{totalConversions} <span className="text-xs text-slate-400 font-normal ml-1">人</span></div>
                    </CardContent>
                </Card>

                <Card className="border-l-4 border-l-rose-500 bg-rose-50/20 shadow-sm hover:shadow-md transition-shadow md:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 text-rose-700">
                        <CardTitle className="text-sm font-bold">總成交金額</CardTitle>
                        <DollarSign className="h-5 w-5" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black">
                            <span className="text-xl mr-1">$</span>
                            {(funnelData?.totalConversionAmount || 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Performance Table */}
            <Card className="shadow-lg border-none overflow-hidden">
                <CardHeader className="bg-slate-900 text-white">
                    <CardTitle className="flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-blue-400" />
                        諮詢師績效對比排行
                    </CardTitle>
                    <CardDescription className="text-slate-400">分析個別人員在此時段內的漏斗各階段表現</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50">
                                <TableRow>
                                    <TableHead className="w-[150px] font-bold text-slate-900 px-6">諮詢師</TableHead>
                                    <TableHead className="font-bold text-slate-900 text-center">總接洽</TableHead>
                                    <TableHead className="font-bold text-slate-900 text-center">聯繫成功</TableHead>
                                    <TableHead className="font-bold text-slate-900 text-center">邀約成功</TableHead>
                                    <TableHead className="font-bold text-slate-900 text-center">到訪成功</TableHead>
                                    <TableHead className="font-bold text-slate-900 text-center px-6 bg-slate-100">成交 (最終率)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {performanceData?.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20 text-slate-400 font-medium">該時段尚無數據記錄</TableCell>
                                    </TableRow>
                                ) : (
                                    performanceData?.map((consultant) => (
                                        <TableRow key={consultant.name} className="hover:bg-slate-50 transition-colors">
                                            <TableCell className="font-bold text-slate-800 px-6">{consultant.name}</TableCell>
                                            <TableCell className="text-center font-mono font-bold text-slate-600">{consultant.total}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold">{consultant.stage2Count}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">{consultant.contactRate}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold">{consultant.stage3Count}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">{consultant.appointmentRate}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center">
                                                    <span className="font-bold">{consultant.stage4Count}</span>
                                                    <span className="text-[10px] text-slate-400 font-bold">{consultant.visitRate}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center px-6 bg-slate-50/50">
                                                <div className="flex justify-center">
                                                    <Badge className={cn(
                                                        "px-3 py-1 font-black text-sm border-none",
                                                        consultant.overallRate >= 20 ? "bg-green-500 text-white" :
                                                            consultant.overallRate >= 10 ? "bg-blue-500 text-white" : "bg-slate-200 text-slate-700"
                                                    )}>
                                                        {consultant.stage5Count} 件 ({consultant.overallRate}%)
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Comparison Charts */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Source Comparison */}
                <Card className="shadow-md border-none overflow-hidden">
                    <CardHeader className="bg-indigo-600 text-white">
                        <div className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5" />
                            <CardTitle className="text-lg font-bold">來源品質對比 (洽詢 vs 成交)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-10">
                        <div className="h-[350px] w-full">
                            {funnelData?.bySource && funnelData.bySource.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={funnelData.bySource} margin={{ top: 30, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(val, name) => [val, name === 'inquiryCount' ? '洽詢件數' : '成交件數']} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="inquiryCount" name="洽詢" fill="#818CF8" radius={[4, 4, 0, 0]} barSize={25}>
                                            <LabelList dataKey="inquiryCount" position="top" offset={10} style={{ fontSize: '10px', fontWeight: 600, fill: '#6366F1' }} />
                                        </Bar>
                                        <Bar dataKey="conversionCount" name="成交" fill="#10B981" radius={[4, 4, 0, 0]} barSize={25}>
                                            <LabelList
                                                dataKey="conversionCount"
                                                position="top"
                                                content={(props: any) => {
                                                    const { x, y, value, index } = props;
                                                    const rate = funnelData.bySource[index]?.conversionRate;
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
                            ) : <div className="flex h-full items-center justify-center text-slate-400">尚無來源數據</div>}
                        </div>
                    </CardContent>
                </Card>

                {/* Method Comparison */}
                <Card className="shadow-md border-none overflow-hidden">
                    <CardHeader className="bg-pink-600 text-white">
                        <div className="flex items-center gap-2">
                            <PieIcon className="w-5 h-5" />
                            <CardTitle className="text-lg font-bold">管道品質對比 (洽詢 vs 成交)</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-10">
                        <div className="h-[350px] w-full">
                            {funnelData?.byMethod && funnelData.byMethod.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={funnelData.byMethod} margin={{ top: 30, bottom: 20 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ borderRadius: '12px' }} formatter={(val, name) => [val, name === 'inquiryCount' ? '洽詢件數' : '成交件數']} />
                                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                        <Bar dataKey="inquiryCount" name="洽詢" fill="#F472B6" radius={[4, 4, 0, 0]} barSize={25}>
                                            <LabelList dataKey="inquiryCount" position="top" offset={10} style={{ fontSize: '10px', fontWeight: 600, fill: '#DB2777' }} />
                                        </Bar>
                                        <Bar dataKey="conversionCount" name="成交" fill="#10B981" radius={[4, 4, 0, 0]} barSize={25}>
                                            <LabelList
                                                dataKey="conversionCount"
                                                position="top"
                                                content={(props: any) => {
                                                    const { x, y, value, index } = props;
                                                    const rate = funnelData.byMethod[index]?.conversionRate;
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
                            ) : <div className="flex h-full items-center justify-center text-slate-400">尚無管道數據</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
