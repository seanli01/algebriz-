import React, { useState, useEffect } from 'react';
import './Matrix.css';
import styles from "@/components/AddQuest/AddQuest.module.css";

const BACKEND_DOMAIN = process.env.NEXT_PUBLIC_BACKEND_DOMAIN + process.env.NEXT_PUBLIC_APPEND;

const Matrix = ({ question, answers, onAnswerSubmit, timer }) => {
  const [userAnswers, setUserAnswers] = useState(Array.from({length: answers[0].length}).map(() => Array.from({ length: answers[0][0].length }).fill('')));
  const [flash, setFlash] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [timeLeft, setTimeLeft] = useState(parseInt(timer)); // Make sure timer is a number

  useEffect(() => {
    // Initialize User Answers to an m by n empty matrix
    setUserAnswers(Array.from({length: answers[0].length}).map(() => Array.from({ length: answers[0][0].length }).fill('')));
    setFlash('');
    setIsCorrect(null);
    setTimeLeft(parseInt(timer)); // Reset the timer for the new question
  }, [question]);

  const handleInputChange = (event, rowIndex, colIndex) => {
    const newUserAnswers = [...userAnswers];
    newUserAnswers[rowIndex][colIndex] = event.target.value;
    setUserAnswers(newUserAnswers);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const isAnswerCorrect = userAnswers.every((row, i) => 
      row.every((answer, j) => String(answer).trim() === String(answers[0][i][j]).trim())
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
    <div className="matrix-container">
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
        {userAnswers.map((row, rowIndex) => (
          <div key={rowIndex} className="matrix-row">
            {row.map((answer, colIndex) => (
              <input
                key={colIndex}
                type="text"
                value={userAnswers[rowIndex][colIndex]}
                onChange={(e) => handleInputChange(e, rowIndex, colIndex)}
                className="matrix-input"
              />
            ))}
          </div>
        ))}
        <button type="submit" className="button">Submit</button>
      </form>
      <p>Time left: {timeLeft} seconds</p> {/* Display the time left */}
    </div>
  );
};

export default Matrix;
