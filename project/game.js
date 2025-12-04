/*
    Quantum Shift - game.js
    Author: Your Name
    Description:
      Simple multiple-choice quiz for HTML/CSS/JS basics.
      Handles question rotation, scoring, a basic timer, and a short summary.
*/

(function () {
    "use strict";

    // Basic question set: feel free to tweak the text or add more later.
    var questions = [
        {
            text: "In JavaScript, which keyword is commonly used to declare a variable that can change?",
            options: ["const", "let", "fixed", "define"],
            correctIndex: 1,
            explanation: "Use 'let' when you plan to reassign the variable later. 'const' is for values that stay the same."
        },
        {
            text: "Which HTML tag is best for the main visible heading on a page?",
            options: ["<title>", "<h1>", "<head>", "<strong>"],
            correctIndex: 1,
            explanation: "<h1> is usually the main heading in the body. The <title> element controls the browser tab text."
        },
        {
            text: "In CSS, a selector that starts with a dot (.) selects elements by what?",
            options: ["ID", "tag name", "class", "attribute"],
            correctIndex: 2,
            explanation: "A dot selects by class name. Example: .btn targets elements with class=\"btn\"."
        },
        {
            text: "Which symbol is used to start a single-line comment in JavaScript?",
            options: ["#", "//", "<!--", "/*"],
            correctIndex: 1,
            explanation: "Single-line comments start with //. Block comments use /* ... */."
        },
        {
            text: "Where should the main content of an HTML page usually go?",
            options: ["Inside <main>", "Inside <meta>", "Inside <style>", "Inside the doctype"],
            correctIndex: 0,
            explanation: "Semantic HTML usually places the main content inside the <main> element."
        },
        {
            text: "Which CSS property controls the space outside an element’s border?",
            options: ["padding", "margin", "border-width", "outline"],
            correctIndex: 1,
            explanation: "Margin is the outside space. Padding is the inner space between content and border."
        },
        {
            text: "What does DOM stand for in web development?",
            options: ["Document Object Model", "Data Object Map", "Dynamic Output Manager", "Document Order Machine"],
            correctIndex: 0,
            explanation: "DOM stands for Document Object Model. JavaScript uses it to work with page elements."
        },
        {
            text: "Which HTML element is normally used for a clickable button that runs JavaScript?",
            options: ["<input type='text'>", "<span>", "<button>", "<label>"],
            correctIndex: 2,
            explanation: "<button> is the usual choice for click actions and event handlers."
        },
        {
            text: "In CSS, how do you select an element with id=\"game\"?",
            options: ["game { }", ".game { }", "#game { }", "id.game { }"],
            correctIndex: 2,
            explanation: "Use # followed by the id. So #game selects the element whose id is \"game\"."
        },
        {
            text: "Which JavaScript method writes a message to the browser’s console?",
            options: ["console.write()", "window.alert()", "console.log()", "document.message()"],
            correctIndex: 2,
            explanation: "console.log() is commonly used to print messages and debug values."
        }
    ];

    // DOM references
    var questionCounterEl = document.getElementById("question-counter");
    var scoreDisplayEl = document.getElementById("score-display");
    var levelNameEl = document.getElementById("level-name");
    var questionTextEl = document.getElementById("question-text");
    var answerButtonsEl = document.getElementById("answer-buttons");
    var feedbackEl = document.getElementById("feedback");
    var timerDisplayEl = document.getElementById("timer-value");
    var summaryPanelEl = document.getElementById("summary-panel");
    var summaryTextEl = document.getElementById("summary-text");

    var startBtn = document.getElementById("start-btn");
    var nextBtn = document.getElementById("next-btn");
    var resetBtn = document.getElementById("reset-btn");

    // Game state
    var currentIndex = 0;
    var score = 0;
    var roundActive = false;

    // Timer variables
    var timePerQuestion = 20; // seconds per question
    var timeLeft = timePerQuestion;
    var timerId = null;

    // Helper: figure out label for "shift level"
    function getLevelName(currentScore) {
        if (currentScore <= 2) {
            return "Warm-Up";
        } else if (currentScore <= 5) {
            return "Stable Orbit";
        } else if (currentScore <= 8) {
            return "Quantum Jump";
        } else {
            return "Supernova";
        }
    }

    // Update UI labels for status
    function refreshStatus() {
        questionCounterEl.textContent = "Question " + (currentIndex + 1) + " of " + questions.length;
        scoreDisplayEl.textContent = "Score: " + score;
        levelNameEl.textContent = getLevelName(score);
    }

    // Clear answer buttons and feedback
    function clearQuestionUI() {
        while (answerButtonsEl.firstChild) {
            answerButtonsEl.removeChild(answerButtonsEl.firstChild);
        }
        feedbackEl.textContent = "";
    }

    // Build answer buttons for the current question
    function showQuestion() {
        clearQuestionUI();
        summaryPanelEl.classList.add("hidden");

        var q = questions[currentIndex];
        questionTextEl.textContent = q.text;

        q.options.forEach(function (text, index) {
            var btn = document.createElement("button");
            btn.textContent = text;
            btn.className = "answer-button";
            btn.addEventListener("click", function () {
                handleAnswerSelection(index);
            });
            answerButtonsEl.appendChild(btn);
        });

        refreshStatus();
        startTimer();
    }

    // Handle the logic when a user selects an answer
    function handleAnswerSelection(selectedIndex) {
        if (!roundActive) {
            return;
        }

        stopTimer();

        var q = questions[currentIndex];
        var buttons = answerButtonsEl.querySelectorAll("button");

        buttons.forEach(function (button, index) {
            button.disabled = true;

            if (index === q.correctIndex) {
                button.classList.add("correct");
            }
            if (index === selectedIndex && selectedIndex !== q.correctIndex) {
                button.classList.add("incorrect");
            }
        });

        if (selectedIndex === q.correctIndex) {
            score += 1;
            feedbackEl.textContent = "Nice! That’s correct. " + q.explanation;
        } else {
            feedbackEl.textContent = "Not quite. " + q.explanation;
        }

        scoreDisplayEl.textContent = "Score: " + score;
        levelNameEl.textContent = getLevelName(score);

        if (currentIndex < questions.length - 1) {
            nextBtn.classList.remove("hidden");
        } else {
            // End of round
            nextBtn.classList.add("hidden");
            showSummary();
        }
    }

    // Handle the case where time runs out
    function handleTimeUp() {
        if (!roundActive) {
            return;
        }

        var q = questions[currentIndex];
        var buttons = answerButtonsEl.querySelectorAll("button");

        buttons.forEach(function (button, index) {
            button.disabled = true;
            if (index === q.correctIndex) {
                button.classList.add("correct");
            }
        });

        feedbackEl.textContent = "Time’s up. " + q.explanation;

        if (currentIndex < questions.length - 1) {
            nextBtn.classList.remove("hidden");
        } else {
            showSummary();
        }
    }

    // Start a fresh timer for a question
    function startTimer() {
        // Clear any old timer
        stopTimer();

        timeLeft = timePerQuestion;
        timerDisplayEl.textContent = timeLeft;

        timerId = window.setInterval(function () {
            timeLeft -= 1;
            if (timeLeft < 0) {
                timeLeft = 0;
            }
            timerDisplayEl.textContent = timeLeft;

            if (timeLeft <= 0) {
                stopTimer();
                handleTimeUp();
            }
        }, 1000);
    }

    function stopTimer() {
        if (timerId !== null) {
            window.clearInterval(timerId);
            timerId = null;
        }
    }

    // Start a new game round
    function startGame() {
        currentIndex = 0;
        score = 0;
        roundActive = true;

        startBtn.disabled = true;
        nextBtn.classList.add("hidden");
        summaryPanelEl.classList.add("hidden");

        showQuestion();
    }

    // Move to next question if any remain
    function nextQuestion() {
        if (!roundActive) {
            return;
        }

        if (currentIndex < questions.length - 1) {
            currentIndex += 1;
            nextBtn.classList.add("hidden");
            showQuestion();
        }
    }

    // Reset everything to the initial state
    function resetGame() {
        roundActive = false;
        currentIndex = 0;
        score = 0;

        stopTimer();
        timerDisplayEl.textContent = "--";

        questionTextEl.textContent = "Press “Start Game” to begin.";
        clearQuestionUI();
        scoreDisplayEl.textContent = "Score: 0";
        levelNameEl.textContent = "None";
        questionCounterEl.textContent = "Question 0 of " + questions.length;

        startBtn.disabled = false;
        nextBtn.classList.add("hidden");
        summaryPanelEl.classList.add("hidden");
    }

    // Show a short summary at the end of the round
    function showSummary() {
        roundActive = false;
        stopTimer();

        var total = questions.length;
        var percent = Math.round((score / total) * 100);
        var level = getLevelName(score);

        var message = "You answered " + score + " out of " + total + " questions correctly (" +
            percent + "%). Your shift level for this round is: " + level + ".";

        summaryTextEl.textContent = message;
        summaryPanelEl.classList.remove("hidden");
    }

    // Wire up event listeners
    startBtn.addEventListener("click", startGame);
    nextBtn.addEventListener("click", nextQuestion);
    resetBtn.addEventListener("click", resetGame);

    // Initial UI state on page load
    questionCounterEl.textContent = "Question 0 of " + questions.length;
    levelNameEl.textContent = "None";
    timerDisplayEl.textContent = "--";
})();
