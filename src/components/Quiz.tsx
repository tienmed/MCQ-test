'use client';

import { useState, useEffect, useCallback } from 'react';
import { Question, QuizSettings, QuizResult } from '@/types/quiz';
import { shuffle, formatTime } from '@/lib/utils';

interface QuizProps {
    questions: Question[];
    settings: QuizSettings;
    user: { name: string; email: string };
    onComplete: (result: QuizResult) => void;
}

export default function Quiz({ questions, settings, user, onComplete }: QuizProps) {
    const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([]);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [timeLeft, setTimeLeft] = useState(settings.durationMinutes * 60);
    const [isFinished, setIsFinished] = useState(false);
    const [startTime] = useState(new Date().toISOString());

    // Initialize questions
    useEffect(() => {
        let q = [...questions];
        if (settings.shuffleQuestions) q = shuffle(q);
        if (settings.shuffleOptions) {
            q = q.map(item => ({ ...item, options: shuffle(item.options) }));
        }
        setShuffledQuestions(q);
    }, [questions, settings.shuffleQuestions, settings.shuffleOptions]);

    const handleSubmit = useCallback(() => {
        if (isFinished) return;
        setIsFinished(true);

        const quizAnswers = shuffledQuestions.map(q => ({
            questionId: q.id,
            selectedAnswer: answers[q.id] || '',
            isCorrect: answers[q.id] === q.correctAnswer
        }));

        const score = quizAnswers.filter(a => a.isCorrect).length;

        const result: QuizResult = {
            userEmail: user.email,
            userName: user.name,
            score,
            totalQuestions: shuffledQuestions.length,
            startTime,
            endTime: new Date().toISOString(),
            answers: quizAnswers
        };

        onComplete(result);
    }, [answers, isFinished, onComplete, shuffledQuestions, startTime, user]);

    // Timer
    useEffect(() => {
        if (timeLeft <= 0 || isFinished) {
            if (timeLeft <= 0) handleSubmit();
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, isFinished, handleSubmit]);

    if (shuffledQuestions.length === 0) return <div>Đang chuẩn bị câu hỏi...</div>;
    if (isFinished) return <div className="text-center"><h3>Đã nộp bài! Đang tính điểm...</h3></div>;

    const currentQuestion = shuffledQuestions[currentIdx];
    const progress = ((currentIdx + 1) / shuffledQuestions.length) * 100;
    const timeProgress = (timeLeft / (settings.durationMinutes * 60)) * 100;

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <header className="flex" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div>
                    <h2>{settings.title}</h2>
                    <p className="muted-foreground">Câu hỏi {currentIdx + 1} / {shuffledQuestions.length}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: timeLeft < 60 ? 'var(--secondary)' : 'inherit' }}>
                        {formatTime(timeLeft)}
                    </div>
                    <p className="muted-foreground">Thời gian còn lại</p>
                </div>
            </header>

            <div className="timer-bar">
                <div className="timer-progress" style={{ width: `${timeProgress}%` }}></div>
            </div>

            <div className="card glass" style={{ minHeight: '300px' }}>
                <h3 className="mb-4">{currentQuestion.question}</h3>
                <div className="grid">
                    {currentQuestion.options.map((option, idx) => (
                        <div
                            key={idx}
                            className={`option-card ${answers[currentQuestion.id] === option ? 'selected' : ''}`}
                            onClick={() => setAnswers({ ...answers, [currentQuestion.id]: option })}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            </div>

            <footer className="flex" style={{ justifyContent: 'space-between', marginTop: '2rem' }}>
                <button
                    className="btn-primary"
                    style={{ backgroundColor: 'var(--border)', color: 'var(--foreground)' }}
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(prev => prev - 1)}
                >
                    Câu trước
                </button>

                {currentIdx === shuffledQuestions.length - 1 ? (
                    <button className="btn-primary" style={{ backgroundColor: 'var(--secondary)' }} onClick={handleSubmit}>
                        Nộp bài
                    </button>
                ) : (
                    <button className="btn-primary" onClick={() => setCurrentIdx(prev => prev + 1)}>
                        Câu tiếp theo
                    </button>
                )}
            </footer>
        </div>
    );
}
