"use client";

import { useState, useEffect } from "react";

import QuizPage from '@/components/Quiz/QuizPage/QuizPage';
import { getQuiz } from "@/api/api.mjs";

export default function Quiz({ params }) {

  const [quiz, setQuiz] = useState();

  useEffect(() => {
    async function updateQuiz() {
        if (params.quizId) {
            let response = await getQuiz(params.quizId);
            let data = await response.json();
            setQuiz(data);
        }
        else {
          setQuiz();
        }
    }
    updateQuiz()
}, []);

  return (
    <div>
      { quiz ?
        <div>
          <QuizPage
            quiz={quiz}
          />
        </div>
        :
        <div>
          Quiz not found!
        </div>
      }
    </div>
  );
}
