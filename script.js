
const form = document.getElementById("transaction-form");
const transactionList = document.getElementById("transaction-list");
const filter = document.getElementById("filter");

const balanceElement = document.getElementById("balance");
const incomeElement = document.getElementById("income");
const expensesElement = document.getElementById("expenses");

const dateInput = document.getElementById("date");

let transactions = [];

try {
  transactions = JSON.parse(
    localStorage.getItem("spendwise-transactions") || "[]"
  );

  if (!Array.isArray(transactions)) {
    transactions = [];
  }
} catch {
  transactions = [];
}

dateInput.value = new Date().toLocaleDateString("en-CA");

const money = amount =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);

function saveTransactions() {
  try {
    localStorage.setItem(
      "spendwise-transactions",
      JSON.stringify(transactions)
    );
  } catch {
    alert("Unable to save data in this browser.");
  }
}

function updateDashboard() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  balanceElement.textContent = money(income - expenses);
  incomeElement.textContent = money(income);
  expensesElement.textContent = money(expenses);

  renderTransactions();
  updateChart();
}

function renderTransactions() {
  transactionList.replaceChildren();

  const selectedFilter = filter.value;

  const visibleTransactions = transactions
    .filter(t =>
      selectedFilter === "all" || t.type === selectedFilter
    )
    .slice()
    .reverse();

  if (visibleTransactions.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "No transactions yet. Add your first one!";
    transactionList.appendChild(empty);
    return;
  }

  visibleTransactions.forEach(t => {
    const row = document.createElement("div");
    row.className = "transaction";

    const info = document.createElement("div");
    info.className = "transaction-info";

    const title = document.createElement("strong");
    title.textContent = t.title;

    const details = document.createElement("small");
    details.textContent = `${t.category} • ${t.date}`;

    info.append(title, details);

    const right = document.createElement("div");
    right.className = "transaction-right";

    const amount = document.createElement("span");
    amount.className = "transaction-amount";
    amount.classList.add(t.type === "income" ? "green" : "red");

    amount.textContent =
      `${t.type === "income" ? "+" : "−"}${money(t.amount)}`;

    const remove = document.createElement("button");
    remove.className = "delete-btn";
    remove.type = "button";
    remove.textContent = "Delete";
    remove.setAttribute("aria-label", `Delete ${t.title}`);

    remove.addEventListener("click", () => {
      transactions = transactions.filter(item => item.id !== t.id);
      saveTransactions();
      updateDashboard();
    });

    right.append(amount, remove);
    row.append(info, right);
    transactionList.appendChild(row);
  });
}

form.addEventListener("submit", event => {
  event.preventDefault();

  const title = document.getElementById("title").value.trim();
  const amount = Number(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const category = document.getElementById("category").value;
  const date = dateInput.value;

  if (!title || !Number.isFinite(amount) || amount <= 0 || !date) {
    alert("Please enter valid transaction details.");
    return;
  }

  transactions.push({
    id: crypto.randomUUID(),
    title,
    amount,
    type,
    category,
    date
  });

  saveTransactions();
  updateDashboard();

  form.reset();
  dateInput.value = new Date().toLocaleDateString("en-CA");
});

filter.addEventListener("change", renderTransactions);

let expenseChart;

function updateChart() {
  if (typeof Chart === "undefined") return;

  const categories = {};

  transactions
    .filter(t => t.type === "expense")
    .forEach(t => {
      categories[t.category] =
        (categories[t.category] || 0) + t.amount;
    });

  const labels = Object.keys(categories);
  const values = Object.values(categories);

  const canvas = document.getElementById("expense-chart");

  if (expenseChart) {
    expenseChart.destroy();
  }

  expenseChart = new Chart(canvas, {
    type: "doughnut",
    data: {
      labels: labels.length ? labels : ["No expenses yet"],
      datasets: [{
        data: values.length ? values : [1],
        backgroundColor: labels.length
          ? ["#a3f36b", "#64b5f6", "#ffbb70",
             "#d9a4ff", "#ff7777", "#60d6c2", "#9ba9b7"]
          : ["#27342d"],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: { color: "#c5d1c8", padding: 18 }
        }
      }
    }
  });
}

updateDashboard();
