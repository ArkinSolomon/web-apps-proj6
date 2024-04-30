import { useState } from 'react';
import '../css/Notes.css';

export default function Notes({ title, value, onChange }: {
  title: string;
  value: string;
  onChange: (newNotes: string) => void;
}) {
  const [currentText, setCurrentText] = useState(value);

  return (
    <div className='notes'>
      <h2>{title}</h2>
      <textarea value={currentText} onChange={e =>setCurrentText(e.target.value)} placeholder='Some notes you want to write...' />
      <button onClick={() => onChange(currentText)}>Update Notes</button>
    </div>
  );
}