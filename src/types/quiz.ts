export interface Question {
    id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
}

export interface QuizSettings {
    title: string;
    durationMinutes: number;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
}

export interface QuizResult {
    userEmail: string;
    userName: string;
    score: number;
    totalQuestions: number;
    startTime: string;
    endTime: string;
    answers: {
        questionId: string;
        selectedAnswer: string;
        isCorrect: boolean;
    }[];
}
