import { google } from 'googleapis';
import { Question, QuizSettings, QuizResult } from '@/types/quiz';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getSheetsClient() {
    try {
        let keyString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!keyString) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is missing');

        // Clean extra quotes and whitespace
        keyString = keyString.trim();
        while (keyString.startsWith('"') || keyString.startsWith("'")) {
            keyString = keyString.slice(1, -1);
        }

        let credentials;
        try {
            credentials = JSON.parse(keyString);
            // Handle cases where the env var is a stringified JSON string (double stringified)
            if (typeof credentials === 'string') {
                credentials = JSON.parse(credentials);
            }
        } catch (e) {
            throw new Error(`GOOGLE_SERVICE_ACCOUNT_KEY không đúng định dạng JSON: ${e instanceof Error ? e.message : 'Unknown'}`);
        }

        if (!credentials.private_key) {
            throw new Error('Service Account JSON thiếu trường "private_key".');
        }

        // Extremely robust private key formatting
        let key = credentials.private_key;
        if (typeof key === 'string') {
            // Handle various ways \n can be escaped or double-escaped
            key = key.replace(/\\n/g, '\n');
            key = key.replace(/\\\\n/g, '\n');

            // Clean any starting/ending whitespace or quotes inside the JSON field
            key = key.trim();

            // FIX: Restore missing spaces in PEM headers (BEGINPRIVATEKEY -> BEGIN PRIVATE KEY)
            if (key.includes('BEGINPRIVATEKEY')) {
                key = key.replace('BEGINPRIVATEKEY', 'BEGIN PRIVATE KEY');
            }
            if (key.includes('ENDPRIVATEKEY')) {
                key = key.replace('ENDPRIVATEKEY', 'END PRIVATE KEY');
            }
        }
        credentials.private_key = key;

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES,
        });
        return google.sheets({ version: 'v4', auth });
    } catch (error: any) {
        console.error('getSheetsClient Error Detail:', error);
        throw new Error(`Lỗi cấu hình Key: ${error.message}`);
    }
}

export async function getQuizData(spreadsheetId: string): Promise<{ questions: Question[], settings: QuizSettings }> {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !spreadsheetId || spreadsheetId === 'mock-id' || spreadsheetId === 'placeholder') {
        const { mockQuestions, mockQuizSettings } = await import('./mock-data');
        return { questions: mockQuestions, settings: mockQuizSettings };
    }

    try {
        const sheets = await getSheetsClient();

        // Attempt to fetch Settings
        const settingsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Settings!A1:B10',
        }).catch(err => {
            const status = err.response?.status;
            const message = err.response?.data?.error?.message || err.message;

            if (status === 403) {
                throw new Error(`Google API: Lỗi 403 (Quyền truy cập). Hãy chắc chắn bạn đã bật "Google Sheets API" trong Cloud Console và cấp quyền Editor cho Service Account.`);
            } else if (status === 404) {
                throw new Error(`Google API: Lỗi 404 (Không tìm thấy). Hãy kiểm tra lại GOOGLE_SHEET_ID và chắc chắn Tab tên là "Settings".`);
            }
            throw new Error(`Google API Error (${status}): ${message}`);
        });

        const settingsRows = settingsResponse.data.values || [];
        const settingsMap = Object.fromEntries(settingsRows);

        const settings: QuizSettings = {
            title: settingsMap['Title'] || 'Quiz',
            durationMinutes: parseInt(settingsMap['Duration']) || 30,
            shuffleQuestions: settingsMap['ShuffleQuestions'] === 'TRUE',
            shuffleOptions: settingsMap['ShuffleOptions'] === 'TRUE',
            mode: (settingsMap['Mode']?.toString().toLowerCase() === 'study') ? 'Study' : 'Exam',
            questionCount: parseInt(settingsMap['QuestionCount']) || undefined,
        };

        // Fetch Questions
        const questionsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Questions!A2:G',
        }).catch(err => {
            throw new Error(`Lỗi khi tải tab "Questions": ${err.message}`);
        });

        const questionsRows = questionsResponse.data.values || [];
        const questions: Question[] = questionsRows
            .filter(row => row[0])
            .map((row, index) => ({
                id: index.toString(),
                question: row[0],
                options: [row[1], row[2], row[3], row[4]].filter(Boolean),
                correctAnswer: row[5],
                explanation: row[6],
            }));

        if (questions.length === 0) {
            throw new Error('Tab "Questions" trống hoặc không đúng định dạng.');
        }

        return { questions, settings };
    } catch (error: any) {
        console.error('getQuizData Final Error:', error.message);
        throw error;
    }
}

export async function saveQuizResult(spreadsheetId: string, result: QuizResult) {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !spreadsheetId || spreadsheetId === 'mock-id' || spreadsheetId === 'placeholder') return;

    try {
        const sheets = await getSheetsClient();
        const values = [[
            result.userEmail,
            result.userName,
            result.score,
            result.totalQuestions,
            result.startTime,
            result.endTime,
            JSON.stringify(result.userAnswers) // Detailed answers
        ]];
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Results!A2',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        });
    } catch (error) {
        console.error('saveQuizResult Error:', error);
    }
}
