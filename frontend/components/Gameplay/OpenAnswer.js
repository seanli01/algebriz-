"use client"
import React, { useState, useEffect } from 'react';
import './OpenAnswer.css';
import styles from "@/components/AddQuest/AddQuest.module.css";

const BACKEND_DOMAIN = process.env.NEXT_PUBLIC_BACKEND_DOMAIN + process.env.NEXT_PUBLIC_APPEND;

const OpenAnswer = ({ question, correctAnswer, onAnswerSubmit, timer }) => {
  const [userAnswer, setUserAnswer] = useState('');
  const [flash, setFlash] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(parseInt(timer)); // Make sure timer is a number

  useEffect(() => {
    setUserAnswer('');
    setFlash('');
    setIsCorrect(null);
    setTimeLeft(parseInt(timer)); // Reset the timer for the new question
  }, [question]);

  const handleSubmit = (event) => {
    event.preventDefault();
    // Check if the userAnswer is included in the correctAnswers array
    const isAnswerCorrect = correctAnswer.some(
      answer => userAnswer.trim().toLowerCase() === answer.trim().toLowerCase()
    );
    setIsCorrect(isAnswerCorrect);
    setFlash(isAnswerCorrect ? 'correct' : 'incorrect');
    onAnswerSubmit(isAnswerCorrect);
  };

  useEffect(() => {
    let timer;
    if (flash) {
      timer = setTimeout(() => {
        setFlash('');
        setIsCorrect(null); // Remove the flash message after timeout
      }, 2000); // Flash duration
    }
    return () => clearTimeout(timer);
  }, [flash]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    if (timeLeft === 0) {
      clearInterval(countdown);
      handleSubmit(new Event('submit')); // Submit the form when time runs out
      setFlash('incorrect'); // Show "Incorrect" when time runs out
    }

    return () => clearInterval(countdown);
  }, [timeLeft]);

  return (
    <div className="container">
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
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="input"
        />
        <button type="submit" className="button">Submit</button>
      </form>
      <p>Time left: {timeLeft} seconds</p> {/* Display the time left */}
    </div>
  );
};

export default OpenAnswer;
