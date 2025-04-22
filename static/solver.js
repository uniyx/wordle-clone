// solver.js

let possibleWords = [];
let validWords = [];
let answerWords = [];

function setWordLists(validList, answerList) {
  validWords = validList;
  answerWords = answerList;
  possibleWords = [...answerWords];
}

function resetSolver() {
  possibleWords = [...answerWords];
}

function updatePossibleWords(guessHistory) {
  possibleWords = answerWords.filter(word => {
    return guessHistory.every(({ guess, result }) => {
      return guessFeedback(word, guess).every((r, i) => r === result[i]);
    });
  });
}

function guessFeedback(secret, guess) {
  const result = Array(5).fill("absent");
  const letterCount = {};

  for (let i = 0; i < 5; i++) {
    const s = secret[i];
    const g = guess[i];
    if (s === g) {
      result[i] = "correct";
    } else {
      letterCount[s] = (letterCount[s] || 0) + 1;
    }
  }

  for (let i = 0; i < 5; i++) {
    const g = guess[i];
    if (result[i] !== "correct" && letterCount[g]) {
      result[i] = "present";
      letterCount[g]--;
    }
  }

  return result;
}

function getBestGuess() {
  const freq = {};
  for (const word of possibleWords) {
    for (const char of new Set(word)) {
      freq[char] = (freq[char] || 0) + 1;
    }
  }

  return possibleWords.reduce((best, word) => {
    return scoreWord(word, freq) > scoreWord(best, freq) ? word : best;
  }, possibleWords[0]);
}

function scoreWord(word, freqMap) {
  const seen = new Set();
  return word.split('').reduce((score, letter) => {
    if (!seen.has(letter)) {
      seen.add(letter);
      score += freqMap[letter] || 0;
    }
    return score;
  }, 0);
}

function playSolverGuess() {
    updatePossibleWords(guessHistory);
    const guess = getBestGuess();
    simulateTyping(guess);
  }
  