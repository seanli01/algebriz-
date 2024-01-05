"use client"
import React, { useState, useEffect } from 'react';
import './MultipleChoice.css';
import styles from "@/components/AddQuest/AddQuest.module.css";

const BACKEND_DOMAIN = process.env.NEXT_PUBLIC_BACKEND_DOMAIN + process.env.NEXT_PUBLIC_APPEND;

const MultipleChoice = ({ question, correctAnswer, answers, onAnswerSubmit, timer }) => {
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [flash, setFlash] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(parseInt(timer)); // Make sure timer is a number

  useEffect(() => {
    setSelectedAnswer(null);
    setFlash('');
    setIsCorrect(null);
    setTimeLeft(parseInt(timer)); // Reset the timer for the new question
  }, [question]);

  const handleAnswerSelection = (answer) => {
    if (selectedAnswer == null) { // Prevent changing the answer once one is selected
      setSelectedAnswer(answer);
      const correct = answer === correctAnswer;
      setIsCorrect(correct); // Set whether the answer is correct
      setFlash(correct ? 'correct' : 'incorrect');
      onAnswerSubmit(correct);
    }
  };

  useEffect(() => {
    let timer;
    if (flash) {
      timer = setTimeout(() => {
        setFlash('');
        setIsCorrect(null); // Remove text with flash
      }, 2000); // Reset flash and text after 2 seconds
    }
    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    if (timeLeft === 0) {
      clearInterval(countdown);
      handleAnswerSelection(false);
      setFlash('incorrect'); // Show "Incorrect" when time runs out
    }

    return () => clearInterval(countdown);
  }, [timeLeft]);

  return (
    <div className="mcq-container">
      {flash && (
        <div className={`flash-screen ${flash}`}>
          <div className="flash-text">{isCorrect ? 'Correct!' : 'Incorrect!'}</div>
        </div>
      )}
      <h2>{question.question}</h2>
      { question.file ?
        <img 
          src={`${BACKEND_DOMAIN}/questions/${question._id}/image`}
          alt={`Missing Image`}
          className={`${styles.image} ${styles.border}`}
        />
        : <></>
      }
      <div className="mcq-button-group">
        {answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => handleAnswerSelection(answer)}
            className={`mcq-button ${selectedAnswer === answer ? 'selected' : ''}`}
          >
            {answer}
          </button>
        ))}
      </div>
      <p>Time left: {timeLeft} seconds</p> {/* Display the time left */}
    </div>
  );
};

export default MultipleChoice;
