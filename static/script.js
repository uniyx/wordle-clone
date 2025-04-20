const DEBUG_MODE = false; // ← Set to false for normal mode
let word = '';
let currentGuess = '';
let currentRow = 0;
const maxRows = 6;

document.addEventListener("DOMContentLoaded", () => {
    createBoard();

    if (DEBUG_MODE) {
        // Don't add keydown listener yet
        chooseDebugWord();
    } else {
        fetch("https://random-word-api.herokuapp.com/word?length=5")
            .then(res => res.json())
            .then(data => word = data[0].toLowerCase());

        // Only safe to enable board input in non-debug mode
        document.addEventListener("keydown", handleKeyPress);
    }

    document.getElementById("end-reload").onclick = () => {
        window.location.reload();
      };

    document.getElementById("info-close").onclick = () => {
        document.getElementById("info-modal").classList.remove("show");
    };

    document.querySelector(".icon-button[title='Info']").onclick = () => {
        document.getElementById("info-modal").classList.add("show");
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

                // Trigger shake on the current row
                row.classList.add("shake");
                setTimeout(() => row.classList.remove("shake"), 400);

                return;
            }

            const target = word.split("");
            const guess = currentGuess.split("");

            // Step 1: Build letter count
            const letterCount = {};
            for (let i = 0; i < 5; i++) {
                const ch = target[i];
                letterCount[ch] = (letterCount[ch] || 0) + 1;
            }

            const colors = Array(5).fill("absent");

            // Step 2: Mark greens
            for (let i = 0; i < 5; i++) {
                if (guess[i] === target[i]) {
                    colors[i] = "correct";
                    letterCount[guess[i]]--;
                }
            }

            // Step 3: Mark yellows
            for (let i = 0; i < 5; i++) {
                if (colors[i] === "correct") continue;
                if (target.includes(guess[i]) && letterCount[guess[i]] > 0) {
                    colors[i] = "present";
                    letterCount[guess[i]]--;
                }
            }

            // Step 4: Apply animations and colors
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

            // Step 5: Move on to next row
            if (currentGuess === word) {
                disableInput();
                showEndModal(true);                
            } else if (currentRow === maxRows - 1) {
                disableInput();
                showEndModal(false);                
            } else {
                currentRow++;
                currentGuess = '';
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

function chooseDebugWord() {
    const modal = document.getElementById("debug-modal");
    const input = document.getElementById("debug-input");
    const button = document.getElementById("debug-submit");
    const error = document.getElementById("debug-error");
    const gameSection = document.getElementById("game-section");

    // Show modal and disable background
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

                // Remove input listener after valid submission
                input.removeEventListener("keydown", enterListener);
            } else {
                error.textContent = "That word isn't valid. Try again.";
                input.focus();
            }
        });
    }

    // Submit on button click
    button.onclick = submitDebugWord;

    // Prevent stacking: define a reusable listener and remove it on success
    function enterListener(e) {
        if (e.key === "Enter") {
            submitDebugWord();
        }
    }

    // Add only once
    input.removeEventListener("keydown", enterListener);
    input.addEventListener("keydown", enterListener, { once: false });
}



if (!DEBUG_MODE) {
    console.log("Secret word:", word);
}

function showMessage(msg) {
    const msgContainer = document.getElementById("message-container");

    msgContainer.textContent = msg;
    msgContainer.classList.remove("show"); // reset if already showing

    // Trigger reflow so the fade works again if message repeats
    void msgContainer.offsetWidth;

    msgContainer.classList.add("show");

    // Auto-hide after 3 seconds
    setTimeout(() => {
        msgContainer.classList.remove("show");
    }, 3000);
}

function showEndModal(won) {
    const modal = document.getElementById("end-modal");
    const title = document.getElementById("end-title");
    const subtext = document.getElementById("end-subtext");

    if (won) {
        title.textContent = "You win! 🎉";
        subtext.textContent = "";
    } else {
        title.textContent = "You lost!";
        subtext.textContent = `The word was: ${word.toUpperCase()}`;
    }

    modal.classList.add("show");
}


function validateGuess(word) {
    return fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        .then(res => res.status === 200)
        .catch(() => false);
}

function disableInput() {
    document.removeEventListener("keydown", handleKeyPress);
}
