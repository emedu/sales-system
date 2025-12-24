import { NextResponse } from 'next/server'
import { getStudents } from '@/lib/google-sheets'

export const dynamic = 'force-dynamic'

export async function GET() {
    try {
        const students = await getStudents()
        return NextResponse.json(students)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 })
    }
}
