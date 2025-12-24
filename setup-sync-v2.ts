import { google } from 'googleapis';
import path from 'path';
import fs from 'fs';

const SPREADSHEET_ID = '1fK0xueG93NLxEJx7GL5KCnM-Zoh1OkpaoZRSQjXmlSE';

const getAuth = async () => {
    const keyPath = path.join(process.cwd(), 'google-key.json');
    if (fs.existsSync(keyPath)) {
        return new google.auth.GoogleAuth({
            keyFile: keyPath,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
    }
    throw new Error('No Google credentials found');
};

const main = async () => {
    try {
        const auth = await getAuth();
        const client = await auth.getClient();
        const sheets = google.sheets({ version: 'v4', auth: client as any });

        console.log('Cleaning up static data and setting up robust Header-based formulas...');

        // 🛡️ Step 1: Clear columns A, B, E (except headers) to ensure ArrayFormula can expand
        // We clear the entire columns from row 2 downwards
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: '流程追蹤!A2:A',
        });
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: '流程追蹤!B2:B',
        });
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: '流程追蹤!E2:E',
        });

        // 🛡️ Step 2: Put formulas in Row 1 (Headers)
        // These formulas will handle the header text AND the data population
        const formulas = [
            {
                range: '流程追蹤!A1',
                values: [['={"學號"; ARRAYFORMULA(IF(\'總表\'!A2:A="", "", \'總表\'!A2:A))}']]
            },
            {
                range: '流程追蹤!B1',
                values: [['={"姓名"; ARRAYFORMULA(IF(\'總表\'!B2:B="", "", \'總表\'!B2:B))}']]
            },
            {
                range: '流程追蹤!E1',
                values: [['={"首次接待人"; ARRAYFORMULA(IF(\'總表\'!E2:E="", "", \'總表\'!E2:E))}']]
            }
        ];

        for (const item of formulas) {
            console.log(`Writing robust formula to ${item.range}...`);
            await sheets.spreadsheets.values.update({
                spreadsheetId: SPREADSHEET_ID,
                range: item.range,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: item.values
                }
            });
        }

        console.log('✅ Robust sync setup complete!');
        console.log('Formulas are now in the Header row. Columns A, B, E will auto-fill based on "總表".');

    } catch (error) {
        console.error('Error:', error);
    }
};

main();
