import { Question, QuizSettings } from "@/types/quiz";

export const mockQuestions: Question[] = [
    {
        id: "1",
        question: "Thủ đô của Việt Nam là gì?",
        options: ["Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Huế"],
        correctAnswer: "Hà Nội",
        explanation: "Hà Nội là thủ đô của nước Cộng hòa Xã hội Chủ nghĩa Việt Nam."
    },
    {
        id: "2",
        question: "Ngôn ngữ nào phổ biến nhất trong lập trình web?",
        options: ["Python", "JavaScript", "C++", "Java"],
        correctAnswer: "JavaScript",
        explanation: "JavaScript là ngôn ngữ duy nhất chạy được trực tiếp trên trình duyệt web."
    },
    {
        id: "3",
        question: "Số Pi xấp xỉ bằng bao nhiêu?",
        options: ["3.14", "3.15", "2.14", "4.14"],
        correctAnswer: "3.14",
        explanation: "Số Pi xấp xỉ là 3.14159..."
    },
    {
        id: "4",
        question: "Next.js là một framework của ngôn ngữ nào?",
        options: ["Python", "JavaScript/TypeScript", "Go", "PHP"],
        correctAnswer: "JavaScript/TypeScript",
    },
    {
        id: "5",
        question: "Đại dương nào lớn nhất thế giới?",
        options: ["Đại Tây Dương", "Thái Bình Dương", "Ấn Độ Dương", "Bắc Băng Dương"],
        correctAnswer: "Thái Bình Dương",
    }
];

export const mockQuizSettings: QuizSettings = {
    title: "Bài Trắc Nghiệm Kiến Thức Tổng Hợp",
    durationMinutes: 5,
    shuffleQuestions: true,
    shuffleOptions: true,
    mode: 'Exam'
};
