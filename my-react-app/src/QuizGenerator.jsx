import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuizGenerator.css';

function QuizGenerator() {
  const [numQuestions, setNumQuestions] = useState(5);
  const navigate = useNavigate();

  const [difficulties, setDifficulties] = useState({
    topic1: 1,
    topic2: 1,
    topic3: 1,
    topic4: 1,
    topic5: 1,
    topic6: 1,
    topic7: 1,
    topic8: 1,
  });

  const handleDifficultyChange = (topic, difficulty) => {
    setDifficulties(prevDifficulties => ({
      ...prevDifficulties,
      [topic]: difficulty
    }));
  };
    
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
      <h1>LIGN 101 Quiz Generator</h1>
      <form onSubmit={handleSubmit} className='quiz-form'>
        {/* Generate Topic Headers and Difficulty Squares */}
        {Array.from({ length: 8 }, (_, i) => `topic${i + 1}`).map((topic) => (
          <div key={topic} className="topic-difficulty">
            <label className="topic-label">{`Topic ${topic.slice(-1)}`}</label>
            <div className="difficulty-squares">
              {Array.from({ length: 5 }, (_, i) => i + 1).map((difficulty) => (
                <button
                  key={difficulty}
                  className={`difficulty-square ${difficulties[topic] === difficulty ? 'selected' : ''}`}
                  onClick={() => handleDifficultyChange(topic, difficulty)}
                >
                  {difficulty}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Number of Questions Selection */}
        <label>
          Questions: {numQuestions}
          <input 
            type="range" 
            min="5" 
            max="20" 
            value={numQuestions} 
            onChange={(e) => setNumQuestions(e.target.value)}
            className="slider"
          />
        </label>

        {/* Submit Button */}
        <button type="submit">Generate Quiz</button>
      </form>
    </div>
  );
}

export default QuizGenerator;