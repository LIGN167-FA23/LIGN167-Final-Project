import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './QuizResults.css'
import CryptoJS from 'crypto-js'

function QuizResults() {
    const location = useLocation();
    const navigate = useNavigate();
    const { htmlContent, username, quizTitle } = location.state || { htmlContent: '', username: 'GUEST', quizTitle: 'LIGN 101 QUIZ'};
    const [quizData, setQuizData] = useState(location.state ? location.state.quizData : { questions: [] });

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

    const regenerateExplanation = async (questionIndex, depth) => {
        try {
            const question = questions[questionIndex];
            // Prepare the data to send to the backend (modify as needed)
            const requestData = {
                query: question.query,
                choices: question.choices,
                answer: question.answer,
                explanation: question.explanation,
                depth: depth
            };
    
            const response = await fetch('http://localhost:3001/generate-explanation', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
            });
    
            const data = await response.json();
            if (data.explanation) {
                // Update the explanation in the quizData state
                let updatedQuizData = { ...quizData };
                updatedQuizData.questions[questionIndex].explanation = data.explanation;
                // Update the quizData state
                setQuizData(updatedQuizData);
            }
        } catch (error) {
            console.error('Error regenerating explanation:', error);
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
            title: quizTitle,
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
    
    const calculateCategoryResults = (questions, submittedAnswers) => {
        // Initialize a map to hold category-wise results
        const categoryResults = new Map();
    
        questions.forEach((question, index) => {
            const category = question.category;
            const isCorrect = question.answer === submittedAnswers[index];
            const result = categoryResults.get(category) || { correct: 0, complete: 0 };
    
            // Increment correct and complete counts
            result.complete += 1;
            if (isCorrect) result.correct += 1;
    
            categoryResults.set(category, result);
        });
    
        return categoryResults;
    };

    const makeHash = (htmlContent) => {
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
        console.log(testResults)
        return calculatedHash;
    };

    // html generator
    const generateStatsHtml = (newTestResult = null) => {
        const initialCategories = [
            { name: 'Intro Topics', correct: 0, complete: 0, accuracyPercentage: 0 },
            { name: 'Phonetics', correct: 0, complete: 0, accuracyPercentage: 0 },
            { name: 'Phonology', correct: 0, complete: 0, accuracyPercentage: 0 },
            { name: 'Morphology', correct: 0, complete: 0, accuracyPercentage: 0 },
            { name: 'Syntax', correct: 0, complete: 0, accuracyPercentage: 0 },
            { name: 'Semantics', correct: 0, complete: 0, accuracyPercentage: 0 },
            { name: 'Pragmatics', correct: 0, complete: 0, accuracyPercentage: 0 },
            { name: 'Language Families', correct: 0, complete: 0, accuracyPercentage: 0 }
        ];

        const stats = parseStatsHtml(htmlContent);
        const parsedCategories = stats[0];
        const testResults = stats[1];
        
        const contentToHash = `${JSON.stringify(testResults)}`;

        const hash = CryptoJS.SHA256(contentToHash).toString();

        if (newTestResult) {
            testResults.unshift(newTestResult);
        }

        const newCategoryResults = calculateCategoryResults(questions, submittedAnswers);

        // Update initial categories with new results
        initialCategories.forEach(cat => {
            const newResult = newCategoryResults.get(cat.name);
            if (newResult) {
                cat.correct += newResult.correct;
                cat.complete += newResult.complete;
                cat.accuracyPercentage = Math.round((cat.correct / cat.complete) * 100);
            }
        });

        parsedCategories.forEach(parsedCat => {
            const category = initialCategories.find(cat => cat.name === parsedCat.name);
            if (category) {
                category.correct = parsedCat.correct;
                category.complete = parsedCat.complete;
                category.accuracyPercentage = parsedCat.accuracyPercentage;
            }
        });

        

        const categoryHtml = initialCategories.map(cat => `
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

        const outHtml = `
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
                    margin-bottom: 10px;
                }
                .name {
                    font-size: 18px;
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
                    <h1 class="header">LIGN 101 STATS</h1>
                    <p class="name">${username}</p>
                    <div class="categories">${categoryHtml}</div>
                    <div class="test-results">${testResultHtml}</div>
                    <div class="hash">Validation Hash:</div>
                </div>
            </body>
            </html>
        `;
        
        return outHtml.replace('<div class="hash">Validation Hash:</div>', `<div class="hash">Validation Hash: ${makeHash(outHtml)}</div>`)
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
        {quizData.questions.map((question, questionIndex) => (
            <div key={questionIndex} className="question-container">
            <h3>Question {questionIndex + 1}: {question.query}</h3>
            <div className="options-container">
            {question.choices.map((choice, choiceIndex) => {
                const isSelected = selectedAnswers[questionIndex] === choiceIndex;
                const isCorrect = question.answer === choiceIndex;
                const isSubmitted = isAnswerSubmitted(questionIndex);
                let buttonClass = "option-button";

                if (isSubmitted) {
                    if (isSelected && isCorrect) {
                        buttonClass += " option-correct"; // Correct answer
                    } else if (isSelected && !isCorrect) {
                        buttonClass += " option-incorrect"; // Incorrect answer
                    } else if (!isSelected && isCorrect) {
                        buttonClass += " option-correct"; // Highlight the correct answer even if not selected
                    }
                } else if (isSelected) {
                    buttonClass += " selected";
                }

                return (
                    <button
                        key={choiceIndex}
                        className={buttonClass}
                        onClick={() => handleChoiceSelect(questionIndex, choiceIndex)}
                        disabled={isSubmitted}
                    >
                        {choice}
                    </button>
                );
            })}

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
                    <p className="explanation">Explanation: {question.explanation}<br></br>Category: {question.category}</p>
                    <div>
                        <button class="regen" onClick={() => regenerateExplanation(questionIndex, 'less')}>-</button>
                        <button class="regen" onClick={() => regenerateExplanation(questionIndex, 'more')}>+</button>
                    </div>
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
