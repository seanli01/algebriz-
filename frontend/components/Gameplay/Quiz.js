"use client"
import React, { useState, useEffect } from 'react';
import OpenAnswer from './OpenAnswer';
import MultipleChoice from './MultipleChoice';
import './Quiz.css'
import Matrix from './Matrix'
import { getQuestions } from '@/api/api.mjs';

export default function Quiz({quizId}) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [currentScore, setCurrentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [startQuestion, setStartQuestion] = useState(false);

  const BASE_SCORE = 1000;

  useEffect(() => {
    async function loadQuestions() {
      try {
        let response = await getQuestions(quizId);
        let data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.log("Error loading questions");
      }
    }

    loadQuestions();
  }, [quizId]);

  const handleAnswerSubmit = (isCorrect) => {
    if (hasAnswered) return;
  
    setHasAnswered(true);
  
    if (isCorrect) {
      const multiplier = Math.max(0.5, timeLeft / questions[currentQuestionIndex].time);
      setCurrentScore(prevScore => prevScore + multiplier * parseInt(questions[currentQuestionIndex].weight*1, 10) * BASE_SCORE);
    }
  
    if (currentQuestionIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        setHasAnswered(false);
        setTimeLeft(questions[currentQuestionIndex + 1].time);
        setStartQuestion(false); // Reset the startQuestion state for the next question
      }, 1000);
    } else {
      setTimeout(() => {
        setQuizComplete(true);
      }, 1000);
    }
  };

  useEffect(() => {
    if (questions.length > 0 && timeLeft === null) {
      setTimeLeft(questions[0].time);
    }

    const time = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearInterval(time);
  }, [questions, timeLeft]);


  return (
    <div>
      {!quizComplete && (
        <div className="score-container">
          Current Score: {Math.floor(currentScore)}
        </div>
      )}
  
      {quizComplete ? (
        <div>
          Quiz Complete! Your total score: {Math.floor(currentScore) /* We want no decimal points */}
        </div>
      ) : (
        questions[currentQuestionIndex] && (
          <div>
            {!startQuestion ? (
              <button className="start-button" onClick={() => setStartQuestion(true)}>Start Question</button>
            ) : (
              <>
                {questions[currentQuestionIndex].type === 'Free-Response' ? (
                  <OpenAnswer
                    question={questions[currentQuestionIndex]}
                    correctAnswer={questions[currentQuestionIndex].answers}
                    timer={questions[currentQuestionIndex].time}
                    onAnswerSubmit={handleAnswerSubmit}
                    disabled={hasAnswered}
                  />
                ) : questions[currentQuestionIndex].type === 'Multi-Choice' ? (
                  <MultipleChoice
                    question={questions[currentQuestionIndex]}
                    correctAnswer={(questions[currentQuestionIndex].answers)[questions[currentQuestionIndex].correctIndex]}
                    answers={questions[currentQuestionIndex].answers}
                    timer={questions[currentQuestionIndex].time}
                    onAnswerSubmit={handleAnswerSubmit}
                    disabled={hasAnswered}
                  />
                  ) : questions[currentQuestionIndex].type === 'Matrix' ? (
                    <Matrix
                    question={questions[currentQuestionIndex]}
                    answers={questions[currentQuestionIndex].answers}
                    timer={questions[currentQuestionIndex].time}
                    onAnswerSubmit={handleAnswerSubmit}
                    />
                ) : null}
              </>
            )}
          </div>
        )
      )}
    </div>
  );
};
