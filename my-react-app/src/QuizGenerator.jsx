import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuizGenerator.css';

function QuizGenerator() {
  const [topic, setTopic] = useState('Random');
  const [difficulty, setDifficulty] = useState('Beginner');
  const [numQuestions, setNumQuestions] = useState(5);
  const navigate = useNavigate();

  const topicsOptions = ['Random', 'HTML', 'CSS', 'JavaScript', 'React'];
  const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced'];
  const questionNumbers = [2, 5, 8, 10]


  const handleSubmit = async (event) => {
    event.preventDefault();
    const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001/generate-quiz';

    const requestOptions = {
      method: 'POST',
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        topic,
        difficulty,
        numQuestions
      }),
    };

    try {
      const response = await fetch(serverUrl, requestOptions);
      const data = await response.json();
      navigate('/results', { state: { quizData: data } }); // Navigate to results page with quiz data
    } catch (error) {
      console.error("Failed to fetch quiz data: ", error);
    }
  };

  return (
    <div className="quiz-generator">
      <h1>AI Quiz Generator</h1>
      <form onSubmit={handleSubmit} className='quiz-form'>
        {/* Topic Selection */}
        <label>
          Topic:
          <select value={topic} onChange={(e) => setTopic(e.target.value)}>
            {topicsOptions.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {/* Difficulty Selection */}
        <label>
          Difficulty:
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            {difficultyOptions.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>

        {/* Number of Questions Selection */}
        <label>
          Questions: {numQuestions} {/* Display the current value next to the slider */}
          <input 
            type="range" 
            min="5" 
            max="20" 
            value={numQuestions} 
            onChange={(e) => setNumQuestions(e.target.value)}
            className="slider" // You can style this class in your CSS
          />
        </label>

        {/* Submit Button */}
        <button type="submit">Generate Quiz</button>
      </form>
    </div>
  );
}

export default QuizGenerator;