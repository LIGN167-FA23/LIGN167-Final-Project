// SelectionBox.jsx
function SelectionBox({ category, onSelect, selectedValue }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', margin: '10px 0' }}>
        <div style={{ marginRight: '10px' }}><strong>{category}</strong></div>
        <div style={{ display: 'flex' }}>
          {[1, 2, 3, 4, 5].map(number => (
            <div 
              key={number} 
              onClick={() => onSelect(category, number)}
              style={{ 
                flex: 1, 
                border: '1px solid black', 
                padding: '5px',
                margin: '5px', 
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: selectedValue === number ? 'lightblue' : 'transparent'
              }}
            >
              {number}
            </div>
          ))}
        </div>
      </div>
    );
  }

export default SelectionBox