import { google } from 'googleapis';
import { Question, QuizSettings, QuizResult } from '@/types/quiz';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
        scopes: SCOPES,
    });
    return google.sheets({ version: 'v4', auth });
}

export async function getQuizData(spreadsheetId: string): Promise<{ questions: Question[], settings: QuizSettings }> {
    // If no credentials, return mock data
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const { mockQuestions, mockQuizSettings } = await import('./mock-data');
        return { questions: mockQuestions, settings: mockQuizSettings };
    }

    const sheets = await getSheetsClient();

    // Fetch Settings (Sheet1!A1:B5)
    const settingsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Settings!A2:B5',
    });

    const settingsRows = settingsResponse.data.values || [];
    const settingsMap = Object.fromEntries(settingsRows);

    const settings: QuizSettings = {
        title: settingsMap['Title'] || 'Quiz',
        durationMinutes: parseInt(settingsMap['Duration']) || 30,
        shuffleQuestions: settingsMap['ShuffleQuestions'] === 'TRUE',
        shuffleOptions: settingsMap['ShuffleOptions'] === 'TRUE',
    };

    // Fetch Questions (Questions!A2:F)
    const questionsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'Questions!A2:F',
    });

    const questionsRows = questionsResponse.data.values || [];
    const questions: Question[] = questionsRows.map((row, index) => ({
        id: index.toString(),
        question: row[0],
        options: [row[1], row[2], row[3], row[4]].filter(Boolean),
        correctAnswer: row[5],
    }));

    return { questions, settings };
}

export async function saveQuizResult(spreadsheetId: string, result: QuizResult) {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        console.log('Mock: Saving result', result);
        return;
    }

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
    });
}
