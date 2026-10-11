const express = require("express");
const cors = require("cors");
require("dotenv").config();

const db = require("./db");
const { signup, login } = require("./auth");

const authenticateToken = require("./middleware");

const {
  addTransaction,
  getTransactions,
  getFilteredTransactions,
  updateTransaction,
  deleteTransaction,
  getSummary,
} = require("./transactions");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// =========================
// Health Check
// =========================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Personal Expense Tracker API is running",
  });
});

// =========================
// Authentication
// =========================

// Signup
app.post("/api/auth/signup", (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const user = signup(name, email, password);

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Login
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = login(email, password);

    res.json({
      success: true,
      message: "Login successful",
      ...result,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
});

// =========================
// Transactions
// =========================

// Add transaction
app.post("/api/transactions", authenticateToken, (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      description,
      transactionDate,
    } = req.body;

    if (!type || !amount || !category || !transactionDate) {
      return res.status(400).json({
        success: false,
        message:
          "Type, amount, category and transaction date are required",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const transaction = addTransaction(
      req.user.userId,
      type,
      numericAmount,
      category,
      description,
      transactionDate
    );

    res.status(201).json({
      success: true,
      message: "Transaction added successfully",
      transaction,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});


// Get user's transactions with optional filters
app.get("/api/transactions", authenticateToken, (req, res) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
    } = req.query;

    const transactions = getFilteredTransactions(
      req.user.userId,
      type,
      category,
      startDate,
      endDate
    );

    res.json({
      success: true,
      transactions,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// Update user's transaction
app.put("/api/transactions/:id", authenticateToken, (req, res) => {
  try {
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const {
      type,
      amount,
      category,
      description,
      transactionDate,
    } = req.body;

    if (!type || !amount || !category || !transactionDate) {
      return res.status(400).json({
        success: false,
        message:
          "Type, amount, category and transaction date are required",
      });
    }

    if (!["income", "expense"].includes(type)) {
      return res.status(400).json({
        success: false,
        message: "Type must be income or expense",
      });
    }

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be greater than 0",
      });
    }

    const transaction = updateTransaction(
      req.user.userId,
      transactionId,
      type,
      numericAmount,
      category,
      description,
      transactionDate
    );

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.json({
      success: true,
      message: "Transaction updated successfully",
      transaction,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

// Delete user's transaction
app.delete("/api/transactions/:id", authenticateToken, (req, res) => {
  try {
    const transactionId = Number(req.params.id);

    if (!Number.isInteger(transactionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction ID",
      });
    }

    const deleted = deleteTransaction(
      req.user.userId,
      transactionId
    );

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found",
      });
    }

    res.json({
      success: true,
      message: "Transaction deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// =========================
// Categories
// =========================

app.get("/api/categories", authenticateToken, (req, res) => {
  try {
    const categories = {
      income: [
        "Salary",
        "Business",
        "Freelance",
        "Investment",
        "Gift",
        "Other",
      ],
      expense: [
        "Food",
        "Transport",
        "Shopping",
        "Bills",
        "Entertainment",
        "Health",
        "Education",
        "Rent",
        "Other",
      ],
    };

    res.json({
      success: true,
      categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});


// =========================
// Dashboard
// =========================

app.get("/api/dashboard", authenticateToken, (req, res) => {
  try {
    const summary = getSummary(req.user.userId);

    res.json({
      success: true,
      summary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// =========================
// Start Server
// =========================

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});