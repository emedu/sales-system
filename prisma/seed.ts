import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: "file:./dev.db",
        },
    },
})

async function main() {
    console.log('Start seeding ...')

    // Create Products (Courses)
    const courses = [
        { name: 'Python 基礎班', price: 3000 },
        { name: 'React 實戰營', price: 5000 },
        { name: 'AI 應用大全', price: 4500 },
    ]

    for (const c of courses) {
        const course = await prisma.product.create({
            data: c,
        })
        console.log(`Created course with id: ${course.id}`)
    }

    // Create Students
    const students = [
        { studentId: 'S001', name: '張三', phone: '0912345678', source: 'FB' },
        { studentId: 'S002', name: '李四', phone: '0923456789', source: 'Line' },
        { studentId: 'S003', name: '王五', phone: '0934567890', source: '官網' },
        { studentId: 'S004', name: '趙六', phone: '0945678901', source: '介紹' },
        { studentId: 'S005', name: '孫七', phone: '0956789012', source: 'FB' },
    ]

    for (const s of students) {
        const student = await prisma.student.create({
            data: s,
        })
        console.log(`Created student with id: ${student.id}`)
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
