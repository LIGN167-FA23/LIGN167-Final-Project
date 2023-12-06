// ChatForm.jsx
import React, { useState } from 'react';

function ChatForm({ onSendMessage }) {
  const [userInput, setUserInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    onSendMessage(userInput);
    setUserInput('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        name="user_input"
        rows="4"
        cols="50"
        placeholder="Type your message here..."
        value={userInput}
        onChange={e => setUserInput(e.target.value)}
      />
      <br />
      <input type="submit" value="Send" />
    </form>
  );
}

export default ChatForm;
