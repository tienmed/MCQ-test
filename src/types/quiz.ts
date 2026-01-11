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
    mode: 'Exam' | 'Study';
}

export interface QuizResult {
    userEmail: string;
    userName: string;
    score: number;
    totalQuestions: number;
    startTime: string;
    endTime: string;
    userAnswers: Record<string, string>; // Maps Question ID to user chosen Option
}
