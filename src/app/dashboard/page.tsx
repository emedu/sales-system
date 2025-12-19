"use client"

import { useEffect, useState } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

type DashboardData = {
    students: {
        id: string
        studentId: string
        name: string
        source: string | null
        isConverted: boolean
        sales: Record<string, number>
        phone: string
    }[]
    products: {
        id: string
        name: string
        price: number
    }[]
}

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null)
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState("")

    useEffect(() => {
        fetch('/api/dashboard')
            .then(res => res.json())
            .then(d => {
                setData(d)
                setLoading(false)
            })
            .catch(err => console.error(err))
    }, [])

    if (loading) return <div className="p-8">載入中...</div>
    if (!data) return <div className="p-8">無資料</div>

    const filteredStudents = data.students.filter(s =>
        s.name.includes(filter) || s.studentId.includes(filter)
    )

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">戰情儀表板</h2>
                    <p className="text-muted-foreground">成交率分析與報表</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>學生列表 ({filteredStudents.length})</CardTitle>
                    <CardDescription>
                        搜尋學生以查看詳細成交
                    </CardDescription>
                    <div className="pt-4 max-w-sm">
                        <Input
                            placeholder="搜尋姓名或學號..."
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">學號</TableHead>
                                    <TableHead>姓名</TableHead>
                                    <TableHead>來源</TableHead>
                                    <TableHead>狀態</TableHead>
                                    {/* Dynamic Product Columns */}
                                    {data.products.map(p => (
                                        <TableHead key={p.id}>{p.name}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredStudents.map((student) => (
                                    <TableRow key={student.id}>
                                        <TableCell className="font-medium">{student.studentId}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span>{student.name}</span>
                                                <span className="text-xs text-muted-foreground">{student.phone}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{student.source}</TableCell>
                                        <TableCell>
                                            {student.isConverted ? (
                                                <Badge className="bg-green-600">已成交</Badge>
                                            ) : (
                                                <Badge variant="outline">未成交</Badge>
                                            )}
                                        </TableCell>
                                        {/* Dynamic Sales Counts */}
                                        {data.products.map(p => (
                                            <TableCell key={p.id}>
                                                {student.sales[p.id] > 0 ? (
                                                    <span className="font-bold text-green-600">{student.sales[p.id]}</span>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
