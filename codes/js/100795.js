import React, { useEffect, useState, useRef } from "react";

import './AutogrowField.scss';

// Written with ChatGPT!
export const AutogrowField = ({ maxHeight, handleEnter, disabled }) => {
  const [value, setValue] = useState("");
  const [shiftPressed, setShiftPressed] = useState(false);
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current.style.height = "auto";
      
    if (textareaRef.current.scrollHeight <= maxHeight) {
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    } else {
      textareaRef.current.style.height = `${maxHeight}px`;
    }
  }, [value]);

  const handleKeyUp = (e) => {
    if (e.keyCode === 16) { // Shift key code
      setShiftPressed(false);
    }
  }

  const handleKeyDown = (e) => {
    if (!e.shiftKey) {
      if (e.keyCode === 13) {
        // Do something with the text
        handleEnter(value);
        setValue('');
      }
    }

    if (e.keyCode === 16) { // Shift key code
      setShiftPressed(true);
    }
  }

  const handleChange = (event) => {
    if (event.target.value === '\n' && !shiftPressed) {
      return;
    }

    setValue(event.target.value);
  };

  return (
    <textarea
      className={`autogrow-field ${disabled ? 'disabled' : ''}`}
      ref={textareaRef}
      value={value}
      onChange={handleChange}
      onKeyUp={handleKeyUp}
      onKeyDown={handleKeyDown}
      style={{ resize: "none", maxHeight: `${maxHeight}px` }}
      placeholder={`${disabled ? 'Must log in to use Zokyo!' : ''}`}
    />
  );
}
