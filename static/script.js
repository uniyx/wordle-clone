const DEBUG_MODE = false;
let word = '';
let currentGuess = '';
let currentRow = 0;
const maxRows = 6;
let guessHistory = [];
let aiMode = false;
const themeToggle = document.getElementById("theme-toggle");

document.addEventListener("DOMContentLoaded", async () => {
    [answerWords, validWords] = await Promise.all([
        loadWordList("/static/answers.txt"),
        loadWordList("/static/valid_guesses.txt")
    ]);
    setWordLists(validWords, answerWords);

    word = answerWords[Math.floor(Math.random() * answerWords.length)];

    createBoard();

    if (DEBUG_MODE) {
        chooseDebugWord();
    } else {
        document.addEventListener("keydown", handleKeyPress);
    }

    document.getElementById("end-reload").onclick = () => window.location.reload();

    document.getElementById("info-close").onclick = () => {
        document.getElementById("info-modal").classList.remove("show");
    };

    document.querySelector(".icon-button[title='Info']").onclick = () => {
        document.getElementById("info-modal").classList.add("show");
    };

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light") {
        document.body.classList.add("light-mode");
        themeToggle.textContent = "🌞";
    } else {
        document.body.classList.remove("light-mode");
        themeToggle.textContent = "🌙";
    }

    themeToggle.onclick = () => {
        const isLight = document.body.classList.toggle("light-mode");
        localStorage.setItem("theme", isLight ? "light" : "dark");
        themeToggle.textContent = isLight ? "🌞" : "🌙";
    };

    const aiToggle = document.getElementById("ai-toggle");
    aiToggle.onclick = () => {
        aiMode = !aiMode;
        aiToggle.classList.toggle("active", aiMode);

        if (aiMode && currentGuess === '' && currentRow < maxRows) {
            setTimeout(playSolverGuess, 800);
        }
    };

    document.getElementById("custom-game").onclick = () => {
        const modal = document.getElementById("custom-modal");
        const input = document.getElementById("custom-input");
        const error = document.getElementById("custom-error");

        input.value = "";
        error.textContent = "";
        modal.classList.add("show");
        input.focus();

        document.removeEventListener("keydown", handleKeyPress);

        function submitCustomWord() {
            const value = input.value.trim().toLowerCase();

            if (value.length !== 5) {
                error.textContent = "Word must be exactly 5 letters.";
                input.focus();
                return;
            }

            if (!validWords.includes(value)) {
                error.textContent = "That word isn't valid.";
                input.focus();
                return;
            }

            word = value;
            guessHistory = [];
            currentRow = 0;
            currentGuess = "";
            aiMode = false;

            resetBoard();

            modal.classList.remove("show");
            document.addEventListener("keydown", handleKeyPress);
        }

        document.getElementById("custom-submit").onclick = submitCustomWord;

        input.onkeydown = e => {
            if (e.key === "Enter") submitCustomWord();
        };
    };
});

function createBoard() {
    const board = document.getElementById("game-board");
    for (let i = 0; i < maxRows; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < 5; j++) {
            const tile = document.createElement("div");
            tile.classList.add("tile");
            row.appendChild(tile);
        }
        board.appendChild(row);
    }
}

function handleKeyPress(e) {
    if (currentRow >= maxRows) return;

    const row = document.getElementsByClassName("row")[currentRow];
    if (e.key === "Enter") {
        if (currentGuess.length !== 5) return;

        validateGuess(currentGuess).then(isValid => {
            if (!isValid) {
                showMessage("Not in dictionary!");
                row.classList.add("shake");
                setTimeout(() => row.classList.remove("shake"), 400);
                return;
            }

            const target = word.split("");
            const guess = currentGuess.split("");

            const letterCount = {};
            for (let i = 0; i < 5; i++) {
                const ch = target[i];
                letterCount[ch] = (letterCount[ch] || 0) + 1;
            }

            const colors = Array(5).fill("absent");

            for (let i = 0; i < 5; i++) {
                if (guess[i] === target[i]) {
                    colors[i] = "correct";
                    letterCount[guess[i]]--;
                }
            }

            for (let i = 0; i < 5; i++) {
                if (colors[i] === "correct") continue;
                if (target.includes(guess[i]) && letterCount[guess[i]] > 0) {
                    colors[i] = "present";
                    letterCount[guess[i]]--;
                }
            }

            guessHistory.push({ guess: currentGuess, result: colors });

            for (let i = 0; i < 5; i++) {
                const tile = row.children[i];
                const color = colors[i];
                const letter = guess[i];

                setTimeout(() => {
                    tile.classList.add("flip");
                    setTimeout(() => {
                        tile.classList.add(color);
                    }, 200);
                }, i * 400);
            }

            if (currentGuess === word) {
                disableInput();
                showEndModal(true);
            } else if (currentRow === maxRows - 1) {
                disableInput();
                showEndModal(false);
            } else {
                currentRow++;
                currentGuess = '';

                if (aiMode) {
                    setTimeout(playSolverGuess, 1000);
                }
            }
        });
    } else if (e.key === "Backspace") {
        if (currentGuess.length > 0) {
            currentGuess = currentGuess.slice(0, -1);
            row.children[currentGuess.length].textContent = '';
        }
    } else if (/^[a-zA-Z]$/.test(e.key) && currentGuess.length < 5) {
        const tile = row.children[currentGuess.length];
        tile.textContent = e.key.toUpperCase();
        tile.classList.add("pop");
        setTimeout(() => tile.classList.remove("pop"), 100);
        currentGuess += e.key.toLowerCase();
    }
}

function simulateTyping(word) {
    if (!word || word.length !== 5) return;
    let i = 0;

    function pressNextLetter() {
        if (i < 5) {
            const e = new KeyboardEvent("keydown", { key: word[i] });
            document.dispatchEvent(e);
            i++;
            setTimeout(pressNextLetter, 150);
        } else {
            const enter = new KeyboardEvent("keydown", { key: "Enter" });
            setTimeout(() => document.dispatchEvent(enter), 250);
        }
    }

    pressNextLetter();
}

function playSolverGuess() {
    updatePossibleWords(guessHistory);
    const guess = getBestGuess();
    simulateTyping(guess);
}

function chooseDebugWord() {
    const modal = document.getElementById("debug-modal");
    const input = document.getElementById("debug-input");
    const button = document.getElementById("debug-submit");
    const error = document.getElementById("debug-error");
    const gameSection = document.getElementById("game-section");

    modal.classList.add("show");
    input.focus();
    error.textContent = "";
    document.removeEventListener("keydown", handleKeyPress);
    gameSection?.setAttribute("aria-hidden", "true");

    function submitDebugWord() {
        const value = input.value.trim().toLowerCase();
        error.textContent = "";

        if (value.length !== 5) {
            error.textContent = "Word must be exactly 5 letters.";
            input.focus();
            return;
        }

        validateGuess(value).then(valid => {
            if (valid) {
                word = value;
                modal.classList.remove("show");
                document.addEventListener("keydown", handleKeyPress);
                gameSection?.removeAttribute("aria-hidden");
                input.removeEventListener("keydown", enterListener);
            } else {
                error.textContent = "That word isn't valid. Try again.";
                input.focus();
            }
        });
    }

    button.onclick = submitDebugWord;

    function enterListener(e) {
        if (e.key === "Enter") submitDebugWord();
    }

    input.removeEventListener("keydown", enterListener);
    input.addEventListener("keydown", enterListener, { once: false });
}

function showMessage(msg) {
    const msgContainer = document.getElementById("message-container");
    msgContainer.textContent = msg;
    msgContainer.classList.remove("show");
    void msgContainer.offsetWidth;
    msgContainer.classList.add("show");
    setTimeout(() => {
        msgContainer.classList.remove("show");
    }, 3000);
}

function showEndModal(won) {
    const modal = document.getElementById("end-modal");
    const title = document.getElementById("end-title");
    const subtext = document.getElementById("end-subtext");
    const breakdown = document.getElementById("end-breakdown");

    const totalTurns = guessHistory.length;

    if (won) {
        title.textContent = aiMode ? "AI wins! 🤖" : "You win! 🎉";
        subtext.textContent = aiMode
            ? `Solved in ${totalTurns} guesses with AI assistance.`
            : `Solved in ${totalTurns} guesses!`;
    } else {
        title.textContent = aiMode ? "AI failed. 😢" : "You lost!";
        subtext.textContent = `The word was: ${word.toUpperCase()}`;
    }

    // Build visual emoji feedback
    const emojiLines = guessHistory.map(({ result }) =>
        result.map(r =>
            r === "correct" ? "🟩" :
                r === "present" ? "🟨" :
                    "⬜"
        ).join("")
    );

    breakdown.textContent = emojiLines.join("\n");

    modal.classList.add("show");
}

function validateGuess(word) {
    return Promise.resolve(validWords.includes(word));
}

function disableInput() {
    document.removeEventListener("keydown", handleKeyPress);
}

async function loadWordList(url) {
    const res = await fetch(url);
    const text = await res.text();
    return text.trim().split("\n").map(w => w.toLowerCase());
}

function resetBoard() {
    const board = document.getElementById("game-board");
    board.innerHTML = "";
    createBoard();

    document.querySelectorAll(".tile").forEach(tile => {
        tile.textContent = "";
        tile.className = "tile";
    });
}