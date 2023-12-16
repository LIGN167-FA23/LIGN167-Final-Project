import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './QuizGenerator.css';
import CryptoJS from 'crypto-js'

function QuizGenerator() {

    // starts at 5 questions
    const [numQuestions, setNumQuestions] = useState(5);

    // transfers html to next page
    const [htmlContent, setHtmlContent] = useState('');

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
    const [isLoading, setIsLoading] = useState(false);
    const [username, setUsername] = useState('');
    const [quizTitle, setQuizTitle] = useState('LIGN 101 QUIZ');

    const validateHash = (htmlContent) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, "text/html");
        const hashElement = doc.querySelector('.hash');
        const extractedHash = hashElement ? hashElement.textContent.split(': ')[1] : '';    
        const testResultRegex = /<div class="test-result-header">(.*?)<\/div>\s*<div class="result-details">Correct: (.*?)<\/div>\s*<div class="result-details">Score: (.*?)%<\/div>\s*<div class="result-details">Date: (.*?), Time: (.*?)<\/div>/g;
        const testResults = [];
        const extractNumbers = (str) => str.match(/\d+/g).map(Number);
        let testResultMatch;
        while ((testResultMatch = testResultRegex.exec(htmlContent)) !== null) {
            const [title, correctDone, score, date, time] = testResultMatch.slice(1);
            const [correct, done] = extractNumbers(correctDone);
            testResults.push({ title, correct, done, score: Number(score), date, time });
        }
        console.log(testResults)
        // Recreate content string as in QuizResults to calculate hash
        const contentToHash = `${JSON.stringify(testResults)}`; // Construct the content string
        const calculatedHash = CryptoJS.SHA256(contentToHash).toString();
    
        return extractedHash === calculatedHash;
    };

    // Function to handle file input change
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type === "text/html") {
            setUploadedFile(file);
                const reader = new FileReader();
                reader.onload = function(event) {
                    const content = event.target.result;
                    const isValidHash = validateHash(content)
                    if (isValidHash) {
                        setHtmlContent(content);
        
                        const { username, categories } = parseHtmlContent(content);
            
                        setUsername(username);
            
                        const newDifficulties = { ...difficulties };
                        categories.forEach((category, index) => {
                            const difficulty = Math.max(Math.ceil(category.accuracyPercentage / 20), 1);
                            newDifficulties[`topic${index + 1}`] = difficulty;
                        });
                        setDifficulties(newDifficulties);
                    } else {
                        alert("Invalid Hash")
                    }
                    
                };
                reader.readAsText(file);
        } else {
            alert("Please upload an HTML file.");
        }
    };


    // Descriptions for each topic when hovering over title
    const topicDescriptions = {
        topic1: "Basic concepts in linguistics, including the nature of language, its unique properties, and different grammatical approaches.",
        topic2: "Study of speech sounds and their production using the International Phonetic Alphabet (IPA).",
        topic3: "Analysis of sound patterns and the abstract elements of speech in languages.",
        topic4: "Examination of word structures and the smallest units of meaning, morphemes.",
        topic5: "Study of sentence structure and the arrangement of words to convey meaning.",
        topic6: "Exploration of meaning in language, focusing on word and sentence interpretation.",
        topic7: "Understanding language use in context, including implications and inferences.",
        topic8: "Study of the relationships and classifications of languages into families."
    }
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsLoading(true); // Start loading
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
            navigate('/results', { state: { quizData: data, htmlContent: htmlContent, username: username, quizTitle: quizTitle } }); // Navigate to results page with quiz data and html
        } catch (error) {
            console.error("Failed to fetch quiz data: ", error);
        } finally {
            setIsLoading(false); // Stop loading regardless of success or failure
        }
    };

    const topicNames = [
        'Intro Topics', 'Phonetics', 'Phonology', 
        'Morphology', 'Syntax', 'Semantics', 
        'Pragmatics', 'Language Families'
    ];

    const parseHtmlContent = (htmlContent) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
    
        const username = doc.querySelector('.name')?.textContent;
    
        const categories = Array.from(doc.querySelectorAll('.category')).map(category => {
            const name = category.querySelector('.category-header')?.textContent;
            const accuracyIndicator = category.querySelector('.accuracy-indicator');
            const accuracyPercentage = accuracyIndicator ? parseInt(accuracyIndicator.style.width) : 0;
            return { name, accuracyPercentage };
        });
    
        return { username, categories };
    };

    return (
        <div className="quiz-generator">
        <h1>LIGN 101 Quiz Generator</h1>
        {/* Username Input */}
        <label className="username-label">
            Username:
            <input 
                type="text" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="username-input"
                readOnly={!!uploadedFile}
            />
        </label>

        {/* Quiz Title Input */}
        <label className="quiz-title-label">
            Quiz Title:
            <input 
                type="text" 
                value={quizTitle} 
                onChange={(e) => setQuizTitle(e.target.value)}
                placeholder="Enter quiz title"
                className="quiz-title-input"
            />
        </label>

        <form onSubmit={handleSubmit} className='quiz-form'>

            {/* Generate Topic Headers and Difficulty Squares */}
            <div className='conf'>Confidences</div>
            <div className='quiz-topic'>
                {topicNames.map((topicName, index) => (
                    <div key={topicName} className="topic-difficulty">
                        <div className="topic-container" onMouseEnter={() => setHoveredTopic(`topic${index + 1}`)} onMouseLeave={() => setHoveredTopic(null)}>
                            <label className="topic-label">{topicName}</label>
                            {hoveredTopic === `topic${index + 1}` && <div className="topic-description">{topicDescriptions[`topic${index + 1}`]}</div>}
                        </div>
                        <div className="difficulty-squares">
                            {Array.from({ length: 5 }, (_, i) => i + 1).map((difficulty) => (
                                <button
                                    type="button"
                                    key={difficulty}
                                    className={`difficulty-square ${difficulties[`topic${index + 1}`] === difficulty ? 'selected' : ''}`}
                                    onClick={() => handleDifficultyChange(`topic${index + 1}`, difficulty)}
                                >
                                    {difficulty}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="divider"></div>

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

            <div className="button-container">
                {/* Submit Button */}
                <button type="submit" className="generate-quiz-button" disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Generate Quiz'}
                </button>
                {/* Upload Button */}
                <label className={`upload-button ${isLoading ? 'disabled' : ''}`}>
                    📁
                    <input 
                    type="file" 
                    onChange={handleFileChange} 
                    accept="text/html"
                    disabled={isLoading}
                    style={{ display: "none" }} 
                    />
                </label>
                </div>
        </form>
        </div>
    );
}

export default QuizGenerator;