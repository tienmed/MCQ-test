import { google } from 'googleapis';
import { Question, QuizSettings, QuizResult } from '@/types/quiz';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getSheetsClient() {
    try {
        const keyString = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
        if (!keyString) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY is not defined');

        const credentials = JSON.parse(keyString);

        // Fix private key formatting if needed
        if (credentials.private_key) {
            credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
        }

        const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: SCOPES,
        });
        return google.sheets({ version: 'v4', auth });
    } catch (error) {
        console.error('Error in getSheetsClient:', error);
        throw error;
    }
}

export async function getQuizData(spreadsheetId: string): Promise<{ questions: Question[], settings: QuizSettings }> {
    // If no credentials OR spreadsheetId is 'mock-id' or 'placeholder', return mock data
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || spreadsheetId === 'mock-id' || spreadsheetId === 'placeholder') {
        console.log('Using mock data because credentials/id are missing');
        const { mockQuestions, mockQuizSettings } = await import('./mock-data');
        return { questions: mockQuestions, settings: mockQuizSettings };
    }

    try {
        const sheets = await getSheetsClient();

        // Fetch Settings
        console.log(`Fetching settings from sheet: ${spreadsheetId}`);
        const settingsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Settings!A2:B5',
        }).catch(err => {
            console.error('Error fetching Settings tab:', err.message);
            throw new Error('Không tìm thấy tab "Settings" hoặc lỗi quyền truy cập.');
        });

        const settingsRows = settingsResponse.data.values || [];
        const settingsMap = Object.fromEntries(settingsRows);

        const settings: QuizSettings = {
            title: settingsMap['Title'] || 'Quiz',
            durationMinutes: parseInt(settingsMap['Duration']) || 30,
            shuffleQuestions: settingsMap['ShuffleQuestions'] === 'TRUE',
            shuffleOptions: settingsMap['ShuffleOptions'] === 'TRUE',
        };

        // Fetch Questions
        console.log(`Fetching questions from sheet: ${spreadsheetId}`);
        const questionsResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Questions!A2:G', // Increased to G to include explanation
        }).catch(err => {
            console.error('Error fetching Questions tab:', err.message);
            throw new Error('Không tìm thấy tab "Questions" hoặc lỗi quyền truy cập.');
        });

        const questionsRows = questionsResponse.data.values || [];
        const questions: Question[] = questionsRows
            .filter(row => row[0]) // Only if question text exists
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
        console.error('Error in getQuizData:', error);
        throw error;
    }
}

export async function saveQuizResult(spreadsheetId: string, result: QuizResult) {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || spreadsheetId === 'mock-id' || spreadsheetId === 'placeholder') {
        console.log('Mock: Saving result', result);
        return;
    }

    try {
        const sheets = await getSheetsClient();
        const values = [
            [
                result.userEmail,
                result.userName,
                result.score,
                result.totalQuestions,
                result.startTime,
                result.endTime,
            ],
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Results!A2',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values },
        }).catch(err => {
            console.error('Error appending to Results tab:', err.message);
            // We don't throw here to not break the user experience if result logging fails
        });
    } catch (error) {
        console.error('Error in saveQuizResult:', error);
    }
}
