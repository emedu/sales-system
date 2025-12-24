import { NextResponse } from 'next/server'
import { getStudents, getProducts, getSalesRecords } from '@/lib/google-sheets'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Fetch all necessary data
        const [students, products, salesRecords] = await Promise.all([
            getStudents(),
            getProducts(),
            getSalesRecords()
        ])

        // Transform data for the dashboard table
        // Row: Student info + Counts per Course
        const tableData = students.map((student: any) => {
            // Calculate sales per product for this student
            const salesMap: Record<string, number> = {}

            // Initialize all products to 0
            products.forEach((p: any) => {
                salesMap[p.id] = 0
            })

            // Sum up actual sales for this student
            salesRecords
                .filter((r: any) => r.studentId === student.studentId)
                .forEach((sale: any) => {
                    if (salesMap[sale.productId] !== undefined) {
                        salesMap[sale.productId] += sale.quantity
                    }
                })

            // Check "Is Converted" (Any sale > 0)
            const totalSales = Object.values(salesMap).reduce((acc: number, curr: number) => acc + curr, 0)
            const isConverted = totalSales > 0

            return {
                id: student.studentId, // Use studentId as unique key
                studentId: student.studentId,
                name: student.name,
                phone: student.phone,
                source: student.source,
                isConverted,
                sales: salesMap // { [productId]: count }
            }
        })

        return NextResponse.json({
            students: tableData,
            products: products
        })

    } catch (error) {
        console.error('Dashboard error:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
    }
}
