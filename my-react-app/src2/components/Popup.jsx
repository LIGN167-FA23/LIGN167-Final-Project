// Popup.jsx
import React, { useState } from 'react';
import SelectionBox from './SelectionBox'; // Import the SelectionBox component

function Popup({ onClose }) {
  const [selections, setSelections] = useState({});

  const handleSelect = (category, number) => {
    setSelections(prev => ({ ...prev, [category]: number }));
  };

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      color: 'black',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'lightgrey',
      padding: '20px',
      borderRadius: '5px',
      zIndex: 1000
    }}>
      <h2>Popup Title</h2>
      {Array.from({ length: 8 }, (_, i) => `Category ${i + 1}`).map(category => (
        <SelectionBox 
          key={category}
          category={category}
          onSelect={handleSelect}
          selectedValue={selections[category]}
        />
      ))}
      <button onClick={onClose}>Close</button>
    </div>
  );
}

export default Popup;
