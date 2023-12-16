import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import QuizGenerator from './QuizGenerator';
import QuizResults from './QuizResults';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<QuizGenerator />} />
          <Route path="/results" element={<QuizResults />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
