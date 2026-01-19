/*
Author: Regex and error handling written with ChatGPT
NumberInput: A custom text input component that only allows numbers
 * It prompts the user with a number keyboard based on the platform
 * It only allows numbers
 * It only allows a negative sign at the beginning of the number
 * It only allows one decimal point
 * There is a custom, optional property called maxDecimalDigits that limits digits after the decimal
 * The textbox turns red for one second if the user breaks a rule
 * It allows additional styling to be passed in that is applied to the TextInput component
 */

import {useState, useEffect} from 'react';
import {TextInput, Platform, StyleSheet} from 'react-native';

const NumberInput = ({maxDecimalDigits, style, onValueChange, ...props}) => {
  const [text, setText] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    let timeoutId;
    if (error) {
      timeoutId = setTimeout(() => setError(false), 1000);
    }
    return () => {
      clearTimeout(timeoutId);
    };
  }, [error]);

  const handleTextChange = inputText => {
    // Validate the input for numeric characters, negative sign, and decimal point
    const regex = new RegExp(
      `^-?[0-9]*\\.?[0-9]{0,${maxDecimalDigits || ''}}$`,
    );
    if (regex.test(inputText) || inputText === '' || inputText === '-') {
      setText(inputText);
      setError(false);
      if (onValueChange) {
        onValueChange(inputText);
      }
    } else {
      setError(true);
    }
  };

  return (
    <TextInput
      value={text}
      onChangeText={handleTextChange}
      keyboardType={
        Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'
      }
      style={[styles.input, style, error && styles.error]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: 'black',
    padding: 10,
    borderRadius: 5, // smooth edges
    color: 'black',
  },
  error: {
    borderColor: 'red',
  },
});

export default NumberInput;
