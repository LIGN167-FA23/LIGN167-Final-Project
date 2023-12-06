import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './QuizResults.css'

function QuizResults() {
    const location = useLocation();
    const navigate = useNavigate();
    const { quizData, htmlContent, username, quizTitle } = location.state || { quizData: { questions: [] }, htmlContent: '', username: '', quizTitle: 'LIGN 101 QUIZ'};
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

    const allQuestionsAnswered = Object.keys(submittedAnswers).length === questions.length;

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

    const calculateTestResult = () => {
        const correct = Object.keys(submittedAnswers).reduce((acc, key) => {
            return acc + (quizData.questions[key].answer === submittedAnswers[key] ? 1 : 0);
        }, 0);
        const done = questions.length;
        const score = Math.round((correct / done) * 100);

        return {
            title: 'New Test',
            correct: correct,
            done: done,
            score: score,
            date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
            time: new Date().toLocaleTimeString() // Current time
        };
    };

    const parseStatsHtml = (statsHtml) => {
        // Helper function to extract numbers from a string
        const extractNumbers = (str) => str.match(/\d+/g).map(Number);
    
        // Extracting categories data
        const categoryRegex = /<div class="category-header">(.*?)<\/div>\s*<div class="stats">Correct\/Complete: (.*?)<\/div>/g;
        const categories = [];
        let categoryMatch;
        while ((categoryMatch = categoryRegex.exec(statsHtml)) !== null) {
            const [name, stats] = categoryMatch.slice(1);
            const [correct, complete] = extractNumbers(stats);
            const accuracyPercentage = Math.round((correct / complete) * 100);
            categories.push({ name, correct, complete, accuracyPercentage });
        }
    
        // Extracting test results data
        const testResultRegex = /<div class="test-result-header">(.*?)<\/div>\s*<div class="result-details">Correct: (.*?)<\/div>\s*<div class="result-details">Score: (.*?)%<\/div>\s*<div class="result-details">Date: (.*?), Time: (.*?)<\/div>/g;
        const testResults = [];
        let testResultMatch;
        while ((testResultMatch = testResultRegex.exec(statsHtml)) !== null) {
            const [title, correctDone, score, date, time] = testResultMatch.slice(1);
            const [correct, done] = extractNumbers(correctDone);
            testResults.push({ title, correct, done, score: Number(score), date, time });
        }
    
        return [categories, testResults];
    };
    

    // html generator
    const generateStatsHtml = (newTestResult = null) => {
        const stats = parseStatsHtml(htmlContent);
        const categories = stats[0];
        const testResults = stats[1];
        const hash = "1a79a4d60de6718e8e5b326e338ae533"; // This should be dynamically generated

        if (newTestResult) {
            testResults.unshift(newTestResult);
        }

        const categoryHtml = categories.map(cat => `
            <div class="category">
                <div class="category-header">${cat.name}</div>
                <div class="stats">Correct/Complete: ${cat.correct}/${cat.complete}</div>
                <div class="accuracy-bar">
                    <div class="accuracy-indicator" style="width: ${cat.accuracyPercentage}%;"></div>
                </div>
            </div>
        `).join("");

        const testResultHtml = testResults.map(result => `
            <div class="test-result">
                <div class="test-result-header">${result.title}</div>
                <div class="result-details">Correct: ${result.correct}, Done: ${result.done}</div>
                <div class="result-details">Score: ${result.score}%</div>
                <div class="result-details">Date: ${result.date}, Time: ${result.time}</div>
            </div>
        `).join("");

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Statistics</title>
                <style>body {
                    font-family: 'Arial', sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f0f0f0;
                    color: #333;
                }
                .container {
                    width: 80%;
                    margin: 20px auto;
                    padding: 20px;
                    background-color: #fff;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                }
                .header {
                    font-size: 24px;
                    text-align: center;
                    color: #333;
                    margin-bottom: 20px;
                }
                .categories {
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: space-between;
                }
                .category {
                    flex-basis: 45%;
                    border: 1px solid #ddd;
                    margin-bottom: 20px;
                    padding: 15px;
                    border-radius: 5px;
                }
                .category-header {
                    font-size: 18px;
                    margin-bottom: 10px;
                    color: #555;
                }
                .stats {
                    font-size: 16px;
                    margin-bottom: 5px;
                    color: #666;
                }
                .accuracy-bar {
                    height: 10px;
                    width: 100%;
                    background-color: #eee;
                    border-radius: 5px;
                    overflow: hidden;
                    position: relative;
                }
                .accuracy-indicator {
                    height: 100%;
                    background-color: #4caf50;
                    border-radius: 5px;
                }
                .test-results {
                    border-top: 1px solid #ddd;
                    padding-top: 20px;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: flex-start;
                }
                .test-result {
                    border: 1px solid #ddd;
                    margin: 5px;
                    padding: 10px;
                    border-radius: 5px;
                    flex-basis: 30%; /* Adjust this percentage based on your preference */
                    font-size: 14px;
                    color: #555;
                    box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);
                }
                .test-result-header {
                    font-size: 16px;
                    margin-bottom: 5px;
                    color: #555;
                }
                .result-details {
                    font-size: 14px;
                    color: #666;
                }
                .hash {
                    text-align: center;
                    margin-top: 30px;
                    font-size: 16px;
                    color: #999;
                }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1 class="header">Quiz Statistics</h1>
                    <div class="categories">${categoryHtml}</div>
                    <div class="test-results">${testResultHtml}</div>
                    <div class="hash">Validation Hash: ${hash}</div>
                </div>
            </body>
            </html>
        `;
    };

    const downloadStatsHtml = () => {
        // fake and only used for testing
        const newTestResult = calculateTestResult();
        const statsHtml = generateStatsHtml(newTestResult);
        const blob = new Blob([statsHtml], { type: 'text/html' });
        const href = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = href;
        link.download = "stats.html";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(href);
    };

    return (
        <div className="quiz-results">
            <div className="score-container">
                <h2>{quizTitle}</h2>
            </div>
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
                <div className="feedback-container">
                    <p className={`feedback ${submittedAnswers[questionIndex] === question.answer ? 'correct' : 'incorrect'}`}>
                        {submittedAnswers[questionIndex] === question.answer
                        ? 'Correct!'
                        : 'Incorrect.'}
                    </p>
                    <p className="explanation">Explanation: {question.explanation}</p>
                </div>
            )}
            </div>
        ))}
        {score !== null && (
        <div className="score-container">
            <h2>Your Score: {score} out of {quizData.questions.length}</h2>
        </div>
        )}
        <div className="button-group">
                <button onClick={goBack}>Go Back to Quiz Generator</button>
                {allQuestionsAnswered && (
                    <button onClick={downloadStatsHtml}>Download Stats</button>
                )}
            </div>
        </div>
    );
}

export default QuizResults;
