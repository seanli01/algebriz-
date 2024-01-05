import QuizLabel from "@/components/Quiz/QuizLabel/QuizLabel";

export default function QuizList({ quizzes, changeQuizVis, editQuiz, deleteQuiz, isLoading }) {

    return (
        <div className="quizList" id="quizList">
            {
                isLoading ? <>Loading...</>
                :
                quizzes.length === 0 ? (<>No quizzes found.</>) : (
                    quizzes.map((quiz, i) => (
                        <QuizLabel
                            key={`quiz-${quiz._id}`}
                            quiz={quiz}
                            changeQuizVis={changeQuizVis}
                            editQuiz={editQuiz}
                            deleteQuiz={deleteQuiz}
                        />
                    ))
                )
            }
        </div>
    )
}
