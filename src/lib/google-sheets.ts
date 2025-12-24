import { google } from 'googleapis';
import path from 'path';

// Spreadsheet ID provided by the user
const SPREADSHEET_ID = '1fK0xueG93NLxEJx7GL5KCnM-Zoh1OkpaoZRSQjXmlSE';

// Authenticate
const getAuth = async () => {
    // Priority: 1. ENV Variable (for Vercel), 2. Local File (for Dev)
    if (process.env.GOOGLE_CREDENTIALS_JSON) {
        return new google.auth.GoogleAuth({
            credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }

    // Local development fallback
    return new google.auth.GoogleAuth({
        keyFile: path.join(process.cwd(), 'google-key.json'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
};

const getSheets = async () => {
    const auth = await getAuth();
    const client = await auth.getClient();
    return google.sheets({ version: 'v4', auth: client as any });
};

// --- API Methods ---

// 1. Get All Students from "總表"
export const getStudents = async () => {
    const sheets = await getSheets();
    try {
        // Read "總表" from A2 to Z (covering sources)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "'總表'!A2:Z",
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return [];

        return rows.map((row) => {
            // Map Source Columns (Indices 11-19)
            // 11: yahoo, 12: google, 13: 官網, 14: FB, 15: Blog, 16: IG, 17: Line, 18: PTT, 19: Other
            let source = '';
            const sources = [
                'Yahoo', 'Google', '伊美官網', 'Facebook', '伊美部落格', 'Instagram', 'Line@', 'PTT', '其他'
            ];
            for (let i = 0; i < sources.length; i++) {
                const colIndex = 11 + i;
                if (row[colIndex] && (row[colIndex] === 'TRUE' || row[colIndex] === '1' || row[colIndex].length > 0)) {
                    source = sources[i];
                    break;
                }
            }

            return {
                id: row[0] || '', // Using Student ID as unique ID
                studentId: row[0] || '',
                name: row[1] || '',
                phone: row[2] || '',
                source: source,
                createdAt: new Date().toISOString() // Mock date
            };
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        return [];
    }
};

// 2. Add Sales Record to "成交回報_DB"
export const addSalesRecord = async (data: { studentId: string; productId: string; quantity: number }) => {
    const sheets = await getSheets();
    try {
        const timestamp = new Date().toISOString();
        const values = [
            [
                timestamp,       // A: Timestamp
                data.studentId,  // B: Student ID
                data.productId,  // C: Product ID
                data.quantity    // D: Quantity
            ]
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: "'成交回報_DB'!A:D",
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });
        return { success: true };
    } catch (error) {
        console.error('Error adding sales record:', error);
        throw error;
    }
};

// 3. Get Sales Records (For Dashboard)
export const getSalesRecords = async () => {
    const sheets = await getSheets();
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "'成交回報_DB'!A2:D",
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return [];

        return rows.map(row => ({
            timestamp: row[0],
            studentId: row[1],
            productId: row[2],
            quantity: Number(row[3]) || 0
        }));
    } catch (error) {
        console.error('Error fetching sales records:', error);
        return [];
    }
};

// 4. Static Products List
export const getProducts = async () => {
    return [
        { id: '美容丙級', name: '美容丙級', price: 0 },
        { id: '美容乙級', name: '美容乙級', price: 0 },
        { id: '紋繡全科', name: '紋繡全科', price: 0 },
        { id: '美甲全科', name: '美甲全科', price: 0 },
        { id: '美睫全科', name: '美睫全科', price: 0 },
    ];
};

// ===== FUNNEL TRACKING FUNCTIONS =====

// Column indices for 流程追蹤 sheet
const FUNNEL_COL = {
    STUDENT_ID: 0,        // A - 學號
    NAME: 1,              // B - 姓名
    MAIN_COURSE: 2,       // C - 主洽課程
    CURRENT_STAGE: 3,     // D - 當前階段 (數字+文字)
    CONSULTANT: 4,        // E - 首次接待人

    // Stage 2: Contact
    CONTACT_STATUS: 5,    // F - 聯繫狀態
    CONTACT_DATE: 6,      // G - 聯繫日期
    CONTACT_METHOD: 7,    // H - 聯繫方式
    CONTACT_NOTES: 8,     // I - 聯繫備註

    // Stage 3: Appointment
    APPOINTMENT_STATUS: 9,  // J - 邀約狀態
    APPOINTMENT_DATE: 10,   // K - 預約日期
    APPOINTMENT_NOTES: 11,  // L - 邀約備註

    // Stage 4: Visit
    VISIT_STATUS: 12,     // M - 到訪狀態
    VISIT_DATE: 13,       // N - 到訪日期
    VISIT_NOTES: 14,      // O - 到訪備註

    // Stage 5: Conversion
    CONVERSION_STATUS: 15, // P - 成交狀態
    CONVERSION_DATE: 16,   // Q - 成交日期
    CONVERSION_COURSE: 17, // R - 成交課程
    CONVERSION_AMOUNT: 18, // S - 成交金額
    CONVERSION_NOTES: 19,  // T - 成交備註
};

export interface FunnelRecord {
    studentId: string;
    name: string;
    mainCourse: string;
    currentStage: string;
    consultant: string;

    contactStatus: boolean;
    contactDate: string;
    contactMethod: string;
    contactNotes: string;

    appointmentStatus: boolean;
    appointmentDate: string;
    appointmentNotes: string;

    visitStatus: boolean;
    visitDate: string;
    visitNotes: string;

    conversionStatus: boolean;
    conversionDate: string;
    conversionCourse: string;
    conversionAmount: number;
    conversionNotes: string;
}

// 5. Get all funnel tracking records
export const getFunnelRecords = async (): Promise<FunnelRecord[]> => {
    const sheets = await getSheets();
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: '流程追蹤!A2:V',
        });

        const rows = response.data.values;
        if (!rows || rows.length === 0) return [];

        return rows.map(row => ({
            studentId: row[FUNNEL_COL.STUDENT_ID] || '',
            name: row[FUNNEL_COL.NAME] || '',
            mainCourse: row[FUNNEL_COL.MAIN_COURSE] || '',
            currentStage: row[FUNNEL_COL.CURRENT_STAGE] || '1. 首次洽詢',
            consultant: row[FUNNEL_COL.CONSULTANT] || '',

            contactStatus: row[FUNNEL_COL.CONTACT_STATUS] === 'TRUE',
            contactDate: row[FUNNEL_COL.CONTACT_DATE] || '',
            contactMethod: row[FUNNEL_COL.CONTACT_METHOD] || '',
            contactNotes: row[FUNNEL_COL.CONTACT_NOTES] || '',

            appointmentStatus: row[FUNNEL_COL.APPOINTMENT_STATUS] === 'TRUE',
            appointmentDate: row[FUNNEL_COL.APPOINTMENT_DATE] || '',
            appointmentNotes: row[FUNNEL_COL.APPOINTMENT_NOTES] || '',

            visitStatus: row[FUNNEL_COL.VISIT_STATUS] === 'TRUE',
            visitDate: row[FUNNEL_COL.VISIT_DATE] || '',
            visitNotes: row[FUNNEL_COL.VISIT_NOTES] || '',

            conversionStatus: row[FUNNEL_COL.CONVERSION_STATUS] === 'TRUE',
            conversionDate: row[FUNNEL_COL.CONVERSION_DATE] || '',
            conversionCourse: row[FUNNEL_COL.CONVERSION_COURSE] || '',
            conversionAmount: parseFloat(row[FUNNEL_COL.CONVERSION_AMOUNT]) || 0,
            conversionNotes: row[FUNNEL_COL.CONVERSION_NOTES] || '',
        }));
    } catch (error) {
        console.error('Error fetching funnel records:', error);
        return [];
    }
};

// 6. Get funnel record for specific student
export const getStudentFunnel = async (studentId: string): Promise<FunnelRecord | null> => {
    const records = await getFunnelRecords();
    return records.find(r => r.studentId === studentId) || null;
};

// 7. Create or update funnel record
export const upsertFunnelRecord = async (studentId: string, data: Partial<FunnelRecord>) => {
    const sheets = await getSheets();
    try {
        // Check if record exists
        const existingRecords = await getFunnelRecords();
        const existingIndex = existingRecords.findIndex(r => r.studentId === studentId);

        if (existingIndex >= 0) {
            // Update existing record
            const rowNumber = existingIndex + 2;
            const existing = existingRecords[existingIndex];
            const updated = { ...existing, ...data };

            // Update C & D columns (Main Course & Current Stage)
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `流程追蹤!C${rowNumber}:D${rowNumber}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[updated.mainCourse, updated.currentStage]]
                },
            });

            // Update F-T columns (Details)
            const detailValues = [
                [
                    updated.contactStatus ? 'TRUE' : 'FALSE',
                    updated.contactDate,
                    updated.contactMethod,
                    updated.contactNotes,
                    updated.appointmentStatus ? 'TRUE' : 'FALSE',
                    updated.appointmentDate,
                    updated.appointmentNotes,
                    updated.visitStatus ? 'TRUE' : 'FALSE',
                    updated.visitDate,
                    updated.visitNotes,
                    updated.conversionStatus ? 'TRUE' : 'FALSE',
                    updated.conversionDate,
                    updated.conversionCourse,
                    updated.conversionAmount,
                    updated.conversionNotes,
                ]
            ];

            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: `流程追蹤!F${rowNumber}:T${rowNumber}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: { values: detailValues },
            });
        } else {
            // This case should be rare if sync is working, but we keep it for robustness.
            const values = [[
                studentId,
                data.name || '',
                data.mainCourse || '',
                data.currentStage || '1. 首次洽詢',
                data.consultant || '',
                data.contactStatus ? 'TRUE' : 'FALSE',
                data.contactDate || '',
                data.contactMethod || '',
                data.contactNotes || '',
                data.appointmentStatus ? 'TRUE' : 'FALSE',
                data.appointmentDate || '',
                data.appointmentNotes || '',
                data.visitStatus ? 'TRUE' : 'FALSE',
                data.visitDate || '',
                data.visitNotes || '',
                data.conversionStatus ? 'TRUE' : 'FALSE',
                data.conversionDate || '',
                data.conversionCourse || '',
                data.conversionAmount || 0,
                data.conversionNotes || '',
            ]];

            await sheets.spreadsheets.values.append({
                spreadsheetId: SPREADSHEET_ID,
                range: '流程追蹤!A:T',
                valueInputOption: 'USER_ENTERED',
                requestBody: { values },
            });
        }

        return { success: true };
    } catch (error) {
        console.error('Error upserting funnel record:', error);
        throw error;
    }
};

// 8. Update student stage
export const updateStudentStage = async (
    studentId: string,
    stage: string,
    stageData: {
        name?: string;
        mainCourse?: string;
        consultant?: string;
        contactMethod?: string;
        contactNotes?: string;
        appointmentDate?: string;
        appointmentNotes?: string;
        visitDate?: string;
        visitNotes?: string;
        conversionCourse?: string;
        conversionAmount?: number;
        conversionNotes?: string;
    }
) => {
    const updateData: Partial<FunnelRecord> = {
        currentStage: stage,
        name: stageData.name,
        mainCourse: stageData.mainCourse,
        consultant: stageData.consultant,
    };

    const today = new Date().toISOString().split('T')[0];
    const stageNumber = parseFloat(stage);

    if (stageNumber >= 2) {
        updateData.contactStatus = true;
        updateData.contactDate = updateData.contactDate || today;
        updateData.contactMethod = stageData.contactMethod;
        updateData.contactNotes = stageData.contactNotes;
    }

    if (stageNumber >= 3) {
        updateData.appointmentStatus = true;
        updateData.appointmentDate = stageData.appointmentDate || today;
        updateData.appointmentNotes = stageData.appointmentNotes;
    }

    if (stageNumber >= 4) {
        updateData.visitStatus = true;
        updateData.visitDate = stageData.visitDate || today;
        updateData.visitNotes = stageData.visitNotes;
    }

    if (stageNumber >= 5) {
        updateData.conversionStatus = true;
        updateData.conversionDate = updateData.conversionDate || today;
        updateData.conversionCourse = stageData.conversionCourse || stageData.mainCourse;
        updateData.conversionAmount = stageData.conversionAmount || 0;
        updateData.conversionNotes = stageData.conversionNotes;
    }

    return await upsertFunnelRecord(studentId, updateData);
};

// 9. Get funnel analytics
export interface DateRange {
    from?: string; // YYYY-MM-DD
    to?: string;   // YYYY-MM-DD
}

export interface DimStats {
    name: string;
    inquiryCount: number;
    conversionCount: number;
    conversionRate: number;
}

export interface FunnelAnalytics {
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

const isDateInRange = (dateStr: string, range?: DateRange) => {
    if (!range || (!range.from && !range.to)) return true;
    if (!dateStr) return false;

    // Handle YYYY/M/D or YYYY-M-D and ensure YYYY-MM-DD for stable parsing
    let parts = dateStr.split(/[/-]/);
    if (parts.length === 3) {
        let y = parts[0];
        let m = parts[1].padStart(2, '0');
        let d = parts[2].padStart(2, '0');
        // Handle case where some Google Sheets dates might be M/D/YYYY
        if (y.length < 4 && d.length === 4) {
            const temp = y;
            y = d;
            d = temp.padStart(2, '0');
        }

        const normalized = `${y}-${m}-${d}`;
        const date = new Date(normalized);
        if (isNaN(date.getTime())) return false;

        const dateVal = date.getTime();

        if (range.from) {
            const fromDate = new Date(range.from);
            if (!isNaN(fromDate.getTime()) && dateVal < fromDate.getTime()) return false;
        }
        if (range.to) {
            const toDate = new Date(range.to);
            if (!isNaN(toDate.getTime()) && dateVal > toDate.getTime()) return false;
        }
        return true;
    }
    return false;
};

export const getFunnelAnalytics = async (range?: DateRange): Promise<FunnelAnalytics> => {
    const sheets = await getSheets();

    const [studentsResponse, funnelResponse] = await Promise.all([
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "'總表'!A2:Z",
        }),
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: "流程追蹤!A2:V",
        })
    ]);

    const studentRows = studentsResponse.data.values || [];
    const funnelRows = funnelResponse.data.values || [];

    const SOURCES = ['Yahoo搜尋', 'Google搜尋', '伊美官網', 'Facebook', '伊美部落格', 'Instagram', 'Line@', 'PTT', '其他網站'];
    const METHODS = ['電話', '現場', 'Line', 'Line@', 'FB', 'IG', 'Beclass', 'Survey', 'Meta', '其他'];
    const COURSES = ['美丙', '美乙', '髮丙', '造型', '美甲', '紋繡', 'SPA', '除毛', '美睫', '刺青', '美醫', '個彩'];

    const sourceStats: Record<string, { inq: number; conv: number }> = {};
    const methodStats: Record<string, { inq: number; conv: number }> = {};
    const courseStats: Record<string, { inq: number; conv: number }> = {};
    const studentInfoMap = new Map<string, { date: string; source: string; method: string }>();

    SOURCES.forEach(s => sourceStats[s] = { inq: 0, conv: 0 });
    METHODS.forEach(m => methodStats[m] = { inq: 0, conv: 0 });
    COURSES.forEach(c => courseStats[c] = { inq: 0, conv: 0 });

    studentRows.forEach(row => {
        const id = row[0];
        const date = row[5];
        let foundSource = '';
        let foundMethod = '';

        SOURCES.forEach((source, idx) => {
            if (!foundSource && row[17 + idx] && (row[17 + idx] === 'TRUE' || row[17 + idx] === '1')) foundSource = source;
        });
        METHODS.forEach((method, idx) => {
            if (!foundMethod && row[7 + idx] && (row[7 + idx] === 'TRUE' || row[7 + idx] === '1')) foundMethod = method;
        });

        if (id) studentInfoMap.set(id, { date, source: foundSource, method: foundMethod });

        if (isDateInRange(date, range)) {
            if (foundSource) sourceStats[foundSource].inq++;
            if (foundMethod) methodStats[foundMethod].inq++;
        }
    });

    const standardStages = [
        '1. 首次洽詢', '2.1 聯繫成功', '2.2 聯繫失敗', '3.1 邀約成功', '3.2 邀約失敗', '4.1 到訪成功', '4.2 未到訪', '5. 成交'
    ];

    const stageCounts: Record<string, number> = {};
    const convCourseCounts: Record<string, number> = {};
    let totalConvAmount = 0;

    standardStages.forEach(s => stageCounts[s] = 0);

    const filteredFunnelRows = funnelRows.filter(row => {
        if (range && (range.from || range.to)) {
            if (row[15] === 'TRUE') return isDateInRange(row[16], range);
            if (row[12] === 'TRUE') return isDateInRange(row[13], range);
            if (row[9] === 'TRUE') return isDateInRange(row[10], range);
            if (row[5] === 'TRUE') return isDateInRange(row[6], range);

            const sId = row[0];
            const info = studentInfoMap.get(sId);
            if (info?.date) return isDateInRange(info.date, range);
            return false;
        }
        return true;
    });

    filteredFunnelRows.forEach(row => {
        const sId = row[0];
        const info = studentInfoMap.get(sId);
        const stage = row[3] || '1. 首次洽詢';
        if (stageCounts.hasOwnProperty(stage)) stageCounts[stage]++;

        const mainCourse = row[2];
        if (mainCourse && courseStats[mainCourse]) {
            courseStats[mainCourse].inq++;
            if (row[15] === 'TRUE') courseStats[mainCourse].conv++;
        }

        if (row[15] === 'TRUE') {
            const convCourse = row[17];
            if (convCourse) convCourseCounts[convCourse] = (convCourseCounts[convCourse] || 0) + 1;
            const amount = parseFloat(row[18]) || 0;
            totalConvAmount += amount;

            // Track conversions for source/method from the student info
            if (info) {
                if (info.source && sourceStats[info.source]) sourceStats[info.source].conv++;
                if (info.method && methodStats[info.method]) methodStats[info.method].conv++;
            }
        }
    });

    const total = filteredFunnelRows.length;

    return {
        totalStudents: total,
        totalConversionAmount: totalConvAmount,
        stages: standardStages.map(stage => ({
            stage,
            count: stageCounts[stage],
            percentage: total > 0 ? Math.round((stageCounts[stage] / total) * 100) : 0,
            conversionRate: total > 0 ? Math.round((stageCounts[stage] / total) * 100) : 0
        })),
        byCourse: COURSES.map(course => ({
            name: course,
            inquiryCount: courseStats[course].inq,
            conversionCount: courseStats[course].conv,
            conversionRate: courseStats[course].inq > 0 ? Math.round((courseStats[course].conv / courseStats[course].inq) * 100) : 0
        })).filter(c => c.inquiryCount > 0),
        bySource: SOURCES.map(source => ({
            name: source,
            inquiryCount: sourceStats[source].inq,
            conversionCount: sourceStats[source].conv,
            conversionRate: sourceStats[source].inq > 0 ? Math.round((sourceStats[source].conv / sourceStats[source].inq) * 100) : 0
        })).filter(s => s.inquiryCount > 0),
        byMethod: METHODS.map(method => ({
            name: method,
            inquiryCount: methodStats[method].inq,
            conversionCount: methodStats[method].conv,
            conversionRate: methodStats[method].inq > 0 ? Math.round((methodStats[method].conv / methodStats[method].inq) * 100) : 0
        })).filter(m => m.inquiryCount > 0),
        byConversionCourse: Object.entries(convCourseCounts)
            .map(([course, count]) => ({ course, count }))
            .sort((a, b) => b.count - a.count)
    };
};

// 10. Get consultant performance
export interface ConsultantPerformance {
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

export const getConsultantPerformance = async (range?: DateRange): Promise<ConsultantPerformance[]> => {
    let records = await getFunnelRecords();

    const consultantMap = new Map<string, FunnelRecord[]>();
    records.forEach(record => {
        if (record.consultant) {
            if (!consultantMap.has(record.consultant)) {
                consultantMap.set(record.consultant, []);
            }
            consultantMap.get(record.consultant)!.push(record);
        }
    });

    const performance: ConsultantPerformance[] = [];
    consultantMap.forEach((studentRecords, consultantName) => {
        const filteredRecords = range ? studentRecords.filter(r => {
            if (r.conversionStatus) return isDateInRange(r.conversionDate, range);
            if (r.visitStatus) return isDateInRange(r.visitDate, range);
            if (r.appointmentStatus) return isDateInRange(r.appointmentDate, range);
            if (r.contactStatus) return isDateInRange(r.contactDate, range);
            return true;
        }) : studentRecords;

        const total = filteredRecords.length;
        if (total === 0) return;

        const s2 = filteredRecords.filter(r => r.contactStatus).length;
        const s3 = filteredRecords.filter(r => r.appointmentStatus).length;
        const s4 = filteredRecords.filter(r => r.visitStatus).length;
        const s5 = filteredRecords.filter(r => r.conversionStatus).length;

        performance.push({
            name: consultantName,
            total,
            stage2Count: s2,
            stage3Count: s3,
            stage4Count: s4,
            stage5Count: s5,
            contactRate: total > 0 ? Math.round((s2 / total) * 100) : 0,
            appointmentRate: s2 > 0 ? Math.round((s3 / s2) * 100) : 0,
            visitRate: s3 > 0 ? Math.round((s4 / s3) * 100) : 0,
            conversionRate: s4 > 0 ? Math.round((s5 / s4) * 100) : 0,
            overallRate: total > 0 ? Math.round((s5 / total) * 100) : 0,
        });
    });

    return performance.sort((a, b) => b.overallRate - a.overallRate);
};
