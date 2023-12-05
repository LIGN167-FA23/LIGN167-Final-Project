import React, { useState } from 'react';

// Define a question component
const Question = ({ text, options, handleSelection, handleConfidence }) => {
  return (
    <div className="question">
      <div className="confidence-rating">
        <label>
          <input
            type="checkbox"
            name="confidence"
            onChange={(e) => handleConfidence(text, e.target.checked)}
          />
          Confidence Rating
        </label>
      </div>
      <div className="question-content">
        <h2>{text}</h2>
        {options.map((option, index) => (
          <label key={index}>
            <input
              type="radio"
              name={`option-${text}`}
              value={option}
              onChange={handleSelection}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  );
};

// Main Quiz component
const Quiz = () => {
  // State to hold the user's selections and confidence ratings
  const [selections, setSelections] = useState({});
  const [confidenceRatings, setConfidenceRatings] = useState({});

  // A handler function to update the user's selections
  const handleSelection = (question, option) => {
    setSelections((prev) => ({ ...prev, [question]: option }));
  };

  // A handler function to update the user's confidence ratings
  const handleConfidence = (question, isConfident) => {
    setConfidenceRatings((prev) => ({ ...prev, [question]: isConfident }));
  };

  // A simple data structure to hold your questions and options
  const questions = [
    {
      text: 'What is the smallest unit of sound?',
      options: ['Phoneme', 'Syllable', 'Allophone', 'Morpheme'],
    },
    {
      text: 'What is the bound morpheme in the word "bananas"?',
      options: ['banana', 'an', 's', 'ing'],
    }
    // ... add more questions here
  ];

  // A submit handler to process the quiz results
  const handleSubmit = () => {
    // Logic to check answers and provide feedback
    // For this example, we'll just log the selections and confidence ratings
    console.log('Selections:', selections);
    console.log('Confidence Ratings:', confidenceRatings);
  };

  return (
    <div>
      <header>
        <h1>Quiz: Phonetics and Morphology</h1>
      </header>
      {questions.map((question, index) => (
        <Question
          key={index}
          text={question.text}
          options={question.options}
          handleSelection={(e) => handleSelection(question.text, e.target.value)}
          handleConfidence={handleConfidence}
        />
      ))}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
};

export default Quiz;