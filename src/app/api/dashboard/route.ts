import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        // Fetch students with their sales records
        const students = await prisma.student.findMany({
            include: {
                sales: {
                    include: {
                        product: true
                    }
                }
            },
            orderBy: {
                createdAt: 'asc' // Maintain original order like a spreadsheet usually
            }
        })

        // Fetch all products to know columns
        const products = await prisma.product.findMany()

        // Transform data for the dashboard table
        // Row: Student info + Counts per Course
        const tableData = students.map((student: any) => {
            // Calculate sales per product for this student
            const salesMap: Record<string, number> = {}

            // Initialize all products to 0
            products.forEach((p: any) => {
                salesMap[p.id] = 0
            })

            // Sum up actual sales
            student.sales.forEach((sale: any) => {
                if (salesMap[sale.productId] !== undefined) {
                    salesMap[sale.productId] += sale.quantity
                }
            })

            // Check "Is Converted" (Any sale > 0)
            const totalSales = student.sales.reduce((acc: number, curr: any) => acc + curr.quantity, 0)
            const isConverted = totalSales > 0

            return {
                id: student.id,
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
