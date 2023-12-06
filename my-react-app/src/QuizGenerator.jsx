import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuizGenerator.css';

function QuizGenerator() {

    // idk why it's state 5, but it works
    const [numQuestions, setNumQuestions] = useState(5);

    // dictionaries of topic counts
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


    const navigate = useNavigate();

    // helper assign difficulty changes
    const handleDifficultyChange = (topic, difficulty) => {
        setDifficulties(prevDifficulties => ({
        ...prevDifficulties,
        [topic]: difficulty
        }));
    };

    const [hoveredTopic, setHoveredTopic] = useState(null);
    const [uploadedFile, setUploadedFile] = useState(null);

    // Function to handle file input change
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "application/pdf") {
        setUploadedFile(file);
        console.log(uploadedFile)
        // You can add further handling here if needed
        } else {
        // Handle invalid file type
        alert("Please upload a PDF file.");
        }
    };


    // Descriptions for each topic when hovering over title
    const topicDescriptions = {
        topic1: "Description for Topic 1",
        topic2: "Description for Topic 2",
        topic3: "Description for Topic 3",
        topic4: "Description for Topic 4",
        topic5: "Description for Topic 5",
        topic6: "Description for Topic 6",
        topic7: "Description for Topic 7",
        topic8: "Description for Topic 8"
    }
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        const serverUrl = process.env.REACT_APP_SERVER_URL || 'http://localhost:3001/generate-quiz';

        // Construct an object with each topic's difficulty
        let topicsDifficulty = {};
        for (const [key, value] of Object.entries(difficulties)) {
            topicsDifficulty[key] = value;
        }

        // topicDifficult is a dict
        const requestOptions = {
            method: 'POST',
            headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
            },
            body: JSON.stringify({
            topicsDifficulty, // This is the object with each topic's difficulty
            numQuestions
            }),
        };

        // previous post request
        // const requestOptions = {
        //   method: 'POST',
        //   headers: {
        //     "Content-Type": "application/json",
        //     "Accept": "application/json"
        //   },
        //   body: JSON.stringify({
        //     topic,
        //     difficulty,
        //     numQuestions
        //   }),
        // };

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
            <div className='conf'>Confidences</div>
            {Array.from({ length: 8 }, (_, i) => `topic${i + 1}`).map((topic) => (
                <div key={topic} className="topic-difficulty">
                <div className="topic-container" onMouseEnter={() => setHoveredTopic(topic)} onMouseLeave={() => setHoveredTopic(null)}>
                <label className="topic-label">{`Topic ${topic.slice(-1)}`}</label>
                {hoveredTopic === topic && <div className="topic-description">{topicDescriptions[topic]}</div>}
                </div>
                <div className="difficulty-squares">
                {Array.from({ length: 5 }, (_, i) => i + 1).map((difficulty) => (
                    <button
                    type="button"
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
                <div className='numQ'>Questions: {numQuestions}</div>
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
            <div className="button-container">
                <button type="submit" className="generate-quiz-button">Generate Quiz</button>
                <label className="upload-button">
                    📁
                    <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept="application/pdf"
                    style={{ display: "none" }} 
                    />
                </label>
                </div>
        </form>
        </div>
    );
}

export default QuizGenerator;