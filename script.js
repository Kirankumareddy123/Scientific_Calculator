let expression = "";
let displayExpression = "";
let history = [];

const expressionEl = document.getElementById("expression");
const resultEl = document.getElementById("result");
const buttons = document.querySelectorAll(".btn");
const historyToggle = document.getElementById("historyToggle");
const historyPanel = document.getElementById("historyPanel");
const historyList = document.getElementById("historyList");
const clearHistoryBtn = document.getElementById("clearHistory");
const container = document.querySelector(".container");

buttons.forEach((btn) => {
    btn.addEventListener("click", function () {
        const value = this.dataset.value;
        handleInput(value);
        animateButton(this);
    });
});

function handleInput(value) {
    if (value === "clear") {
        clearDisplay();
    } else if (value === "delete") {
        deleteLast();
    } else if (value === "=") {
        calculate();
    } else {
        appendValue(value);
    }
}

function appendValue(value) {
    expression += value;
    displayExpression += value
        .replace("Math.sin(", "sin(")
        .replace("Math.cos(", "cos(")
        .replace("Math.tan(", "tan(")
        .replace("Math.log(", "ln(")
        .replace("Math.sqrt(", "\u221A(")
        .replace("Math.PI", "\u03C0")
        .replace("Math.E", "e")
        .replace("**", "^");

    updateDisplay();
}

function clearDisplay() {
    expression = "";
    displayExpression = "";
    resultEl.textContent = "0";
    expressionEl.textContent = "";
    animateResult();
}

function deleteLast() {
    if (!expression) return;

    const patterns = ["Math.sin(", "Math.cos(", "Math.tan(", "Math.log(", "Math.sqrt(", "Math.PI", "Math.E", "**"];

    let deleted = false;
    for (const pattern of patterns) {
        if (expression.endsWith(pattern)) {
            expression = expression.slice(0, -pattern.length);
            deleted = true;
            break;
        }
    }

    if (!deleted) {
        expression = expression.slice(0, -1);
    }

    displayExpression = expression
        .replace(/Math\.sin\(/g, "sin(")
        .replace(/Math\.cos\(/g, "cos(")
        .replace(/Math\.tan\(/g, "tan(")
        .replace(/Math\.log\(/g, "ln(")
        .replace(/Math\.sqrt\(/g, "\u221A(")
        .replace(/Math\.PI/g, "\u03C0")
        .replace(/Math\.E/g, "e")
        .replace(/\*\*/g, "^");

    updateDisplay();
    if (!expression) resultEl.textContent = "0";
}

function calculate() {
    if (!expression) return;

    try {
        let evalExpr = expression
            .replace(/Math\.sin\(/g, "Math.sin(toRad(")
            .replace(/Math\.cos\(/g, "Math.cos(toRad(")
            .replace(/Math\.tan\(/g, "Math.tan(toRad(");

        const openCount = (evalExpr.match(/toRad\(/g) || []).length;
        for (let i = 0; i < openCount; i++) {
            evalExpr += ")";
        }

        const result = eval(evalExpr);

        if (!isFinite(result)) {
            resultEl.textContent = "Error";
            shakeCalculator();
            return;
        }

        const finalResult = Number(result.toFixed(10)).toString();
        resultEl.textContent = finalResult;
        addToHistory(displayExpression, finalResult);
        animateResult();
    } catch {
        resultEl.textContent = "Error";
        shakeCalculator();
    }
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

function updateDisplay() {
    expressionEl.textContent = displayExpression;
}

function animateResult() {
    resultEl.style.animation = "none";
    setTimeout(() => (resultEl.style.animation = ""), 10);
}

function animateButton(btn) {
    btn.classList.remove("pressed");
    void btn.offsetWidth;
    btn.classList.add("pressed");
    setTimeout(() => btn.classList.remove("pressed"), 180);
}

function shakeCalculator() {
    const calc = document.querySelector(".calculator");
    calc.style.animation = "shake 0.35s";
    setTimeout(() => (calc.style.animation = ""), 350);
}

const style = document.createElement("style");
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-8px); }
        75% { transform: translateX(8px); }
    }
`;
document.head.appendChild(style);

document.addEventListener("keydown", (e) => {
    const key = e.key;

    if (key >= "0" && key <= "9") {
        handleInput(key);
    } else if (key === "." || key === "+" || key === "-" || key === "*" || key === "/" || key === "%" || key === "(" || key === ")") {
        handleInput(key);
    } else if (key === "Enter") {
        e.preventDefault();
        handleInput("=");
    } else if (key === "Backspace") {
        e.preventDefault();
        handleInput("delete");
    } else if (key === "Escape" || key.toLowerCase() === "c") {
        handleInput("clear");
    } else if (key === "^") {
        handleInput("**");
    }
});

historyToggle.addEventListener("click", () => {
    historyPanel.classList.toggle("active");
    historyToggle.classList.toggle("active");
    container.classList.toggle("history-open");
    historyToggle.setAttribute("aria-expanded", historyPanel.classList.contains("active") ? "true" : "false");
});

clearHistoryBtn.addEventListener("click", () => {
    history = [];
    renderHistory();
});

historyList.addEventListener("click", (event) => {
    const item = event.target.closest(".history-item");
    if (!item) return;

    const index = Number(item.dataset.index);
    if (Number.isNaN(index) || !history[index]) return;
    loadFromHistory(history[index].expression);
});

function addToHistory(expr, result) {
    history.unshift({ expression: expr, result });
    if (history.length > 50) history.pop();
    renderHistory();
}

function renderHistory() {
    if (history.length === 0) {
        historyList.innerHTML = '<p class="no-history">No calculations yet</p>';
        return;
    }

    const visibleHistory = history.slice(0, 8);

    historyList.innerHTML = visibleHistory
        .map(
            (item, index) => `
        <button class="history-item" type="button" data-index="${index}">
            <div class="history-expression">${escapeHtml(item.expression)}</div>
            <div class="history-result">= ${escapeHtml(item.result)}</div>
        </button>
    `
        )
        .join("");
}

function loadFromHistory(expr) {
    expression = expr
        .replace(/sin\(/g, "Math.sin(")
        .replace(/cos\(/g, "Math.cos(")
        .replace(/tan\(/g, "Math.tan(")
        .replace(/ln\(/g, "Math.log(")
        .replace(/\u221A\(/g, "Math.sqrt(")
        .replace(/\u03C0/g, "Math.PI")
        .replace(/e/g, "Math.E")
        .replace(/\^/g, "**");

    displayExpression = expr;
    updateDisplay();
}

function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
        if (char === "&") return "&amp;";
        if (char === "<") return "&lt;";
        if (char === ">") return "&gt;";
        if (char === '"') return "&quot;";
        return "&#39;";
    });
}
