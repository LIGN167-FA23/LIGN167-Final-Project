// App.jsx
import React, { useState } from 'react';
import ChatForm from './gpt-forms/ChatForm';
import ChatResponse from './gpt-forms/ChatResponse';

function App() {
  const [response, setResponse] = useState('');

  const handleSendMessage = async (userInput) => {
    const response = await fetch('/get_response', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ user_input: userInput })
    });
    setResponse(await response.text());
  };

  return (
    <div>
      <h1>Chat with GPT</h1>
      <ChatForm onSendMessage={handleSendMessage} />
      <ChatResponse response={response} />
    </div>
  );
}

export default App;
