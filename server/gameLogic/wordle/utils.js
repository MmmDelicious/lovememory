function evaluateGuess(guess, target) {
    const result = new Array(guess.length).fill('absent');
    const targetChars = target.split('');
    const guessChars = guess.split('');
    const usedTargetIndices = new Array(target.length).fill(false);
  
    for (let i = 0; i < guessChars.length; i++) {
      if (guessChars[i] === targetChars[i]) {
        result[i] = 'correct';
        usedTargetIndices[i] = true;
      }
    }
  
    for (let i = 0; i < guessChars.length; i++) {
      if (result[i] === 'correct') {
        continue;
      }
  
      const foundIndex = targetChars.findIndex(
        (char, index) => !usedTargetIndices[index] && char === guessChars[i]
      );
  
      if (foundIndex !== -1) {
        result[i] = 'present';
        usedTargetIndices[foundIndex] = true;
      }
    }
  
    return result;
  }
  
  module.exports = {
    evaluateGuess,
  };