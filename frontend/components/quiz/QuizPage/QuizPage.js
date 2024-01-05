import "./QuizPage.css";
import Quiz from '@/components/Gameplay/Quiz'

export default function QuizPage({ quiz }) {
    return (
        <div className="quiz-page" id={"quiz"+quiz._id}>
            <div className="quiz-page-cont">
                <div className="quiz-page-title-name">
                    <div className="quiz-page-title">{quiz.title}</div>
                    <div className="quiz-page-owner">{"by " + quiz.ownerId}</div>
                </div>
                <div className="quiz-page-desc">{quiz.desc}</div>
            </div>
            <Quiz
                quizId={quiz._id}
            />
        </div>
    )
}