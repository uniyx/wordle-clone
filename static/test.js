const fs = require("fs");

const answerWords = fs.readFileSync("answers.txt", "utf-8").trim().split("\n").map(w => w.toLowerCase());
const validWords = fs.readFileSync("valid_guesses.txt", "utf-8").trim().split("\n").map(w => w.toLowerCase());

let possibleWords = [];

function setWordLists(validList, answerList) {
  possibleWords = [...answerList];
}

function resetSolver() {
  possibleWords = [...answerWords];
}

function updatePossibleWords(guessHistory) {
  possibleWords = answerWords.filter(word =>
    guessHistory.every(({ guess, result }) =>
      guessFeedback(word, guess).every((r, i) => r === result[i])
    )
  );
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

// Test every word in answer list
setWordLists(validWords, answerWords);

let solved = 0;
let failedWords = [];
let totalGuesses = 0;

for (const target of answerWords) {
  resetSolver();
  let guessHistory = [];
  let success = false;

  for (let turn = 0; turn < 6; turn++) {
    updatePossibleWords(guessHistory);
    const guess = getBestGuess();
    const result = guessFeedback(target, guess);

    guessHistory.push({ guess, result });

    if (guess === target) {
      solved++;
      totalGuesses += (turn + 1);
      success = true;
      break;
    }
  }

  if (!success) {
    failedWords.push(target);
  }
}

// Report
console.log(`Solved: ${solved}/${answerWords.length}`);
console.log(`Accuracy: ${(solved / answerWords.length * 100).toFixed(2)}%`);
console.log(`Average Guesses (solved only): ${(totalGuesses / solved).toFixed(2)}`);
if (failedWords.length > 0) {
  console.log(`Failed words: ${failedWords.join(", ")}`);
}
