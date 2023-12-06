import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function QuizResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { quizData } = location.state || { quizData: { questions: [] } };
  const questions = quizData.questions || [];
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [submittedAnswers, setSubmittedAnswers] = useState({});
  const [score, setScore] = useState(null);


  const handleChoiceSelect = (questionIndex, choiceIndex) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: choiceIndex,
    });
  };

  const handleSubmitAnswer = (questionIndex) => {
    const newSubmittedAnswers = {
      ...submittedAnswers,
      [questionIndex]: selectedAnswers[questionIndex],
    };
    setSubmittedAnswers(newSubmittedAnswers);

    // If this is the last question to be submitted, calculate the score
    if (Object.keys(newSubmittedAnswers).length === quizData.questions.length) {
      calculateScore(newSubmittedAnswers);
    }
  };

  const calculateScore = (allSubmittedAnswers) => {
    let tally = 0;
    quizData.questions.forEach((question, index) => {
      if (question.answer === allSubmittedAnswers[index]) {
        tally += 1;
      }
    });
    setScore(tally); // Set the total score
  };

  const goBack = () => navigate('/'); // Function to navigate back to the quiz generator

  const isAnswerSubmitted = (questionIndex) => {
    return submittedAnswers.hasOwnProperty(questionIndex);
  };

  return (
    <div className="quiz-results">
      <h1>Quiz Results</h1>
      {questions.map((question, questionIndex) => (
        <div key={questionIndex} className="question-container">
          <h3>Question {questionIndex + 1}: {question.query}</h3>
          <div className="options-container">
            {question.choices.map((choice, choiceIndex) => (
              <button
                key={choiceIndex}
                className={`option-button ${selectedAnswers[questionIndex] === choiceIndex ? 'selected' : ''}`}
                onClick={() => handleChoiceSelect(questionIndex, choiceIndex)}
                disabled={isAnswerSubmitted(questionIndex)}
              >
                {choice}
              </button>
            ))}
          </div>
          {!isAnswerSubmitted(questionIndex) && (
            <button onClick={() => handleSubmitAnswer(questionIndex)}>
              Submit Answer
            </button>
          )}
          {isAnswerSubmitted(questionIndex) && (
            <div>
              <p className={submittedAnswers[questionIndex] === question.answer ? 'correct' : 'incorrect'}>
                {submittedAnswers[questionIndex] === question.answer
                  ? 'Correct!'
                  : 'Incorrect.'}
              </p>
              <p>Explanation: {question.explanation}</p>
            </div>
          )}
        </div>
      ))}
      {score !== null && (
        <div className="score">
          <h2>Your Score: {score} out of {quizData.questions.length}</h2>
        </div>
      )}
      <button className="go-back-button" onClick={goBack}>Go Back to Quiz Generator</button>
    </div>
  );
}

export default QuizResults;
