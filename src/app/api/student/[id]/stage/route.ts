import { NextResponse } from 'next/server';
import { updateStudentStage, getStudents } from '@/lib/google-sheets';

export const dynamic = 'force-dynamic';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: studentId } = await params;
        const body = await request.json();
        const { stage, mainCourse, notes, conversionAmount } = body;

        if (!stage || typeof stage !== 'string') {
            return NextResponse.json({ error: 'Invalid stage (must be a string)' }, { status: 400 });
        }

        // Get student name from 總表
        const students = await getStudents();
        const student = students.find((s: any) => s.studentId === studentId);

        if (!student) {
            return NextResponse.json({ error: 'Student not found' }, { status: 404 });
        }

        // Update stage with student name and supplementary data
        await updateStudentStage(studentId, stage, {
            mainCourse,
            contactNotes: notes, // Mapping notes to contactNotes as a fallback
            appointmentNotes: notes,
            visitNotes: notes,
            conversionNotes: notes,
            conversionAmount,
            name: student.name,
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating student stage:', error);
        return NextResponse.json({ error: 'Failed to update student stage' }, { status: 500 });
    }
}

// GET endpoint to retrieve student's funnel status
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: studentId } = await params;
        const { getStudentFunnel } = await import('@/lib/google-sheets');

        const funnelRecord = await getStudentFunnel(studentId);

        if (!funnelRecord) {
            return NextResponse.json({ error: 'Funnel record not found' }, { status: 404 });
        }

        return NextResponse.json(funnelRecord);
    } catch (error) {
        console.error('Error fetching student funnel:', error);
        return NextResponse.json({ error: 'Failed to fetch student funnel' }, { status: 500 });
    }
}
