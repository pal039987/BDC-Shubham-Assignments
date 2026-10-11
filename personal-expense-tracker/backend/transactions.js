const db = require("./db");

// Add transaction
function addTransaction(
  userId,
  type,
  amount,
  category,
  description,
  transactionDate
) {
  const result = db
    .prepare(`
      INSERT INTO transactions
      (user_id, type, amount, category, description, transaction_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    .run(
      userId,
      type,
      amount,
      category,
      description || "",
      transactionDate
    );

  return db
    .prepare("SELECT * FROM transactions WHERE id = ?")
    .get(result.lastInsertRowid);
}

// Get all transactions for a user
function getTransactions(userId) {
  return db
    .prepare(`
      SELECT *
      FROM transactions
      WHERE user_id = ?
      ORDER BY transaction_date DESC, id DESC
    `)
    .all(userId);
}

// Get filtered transactions
function getFilteredTransactions(
  userId,
  type,
  category,
  startDate,
  endDate
) {
  let query = `
    SELECT *
    FROM transactions
    WHERE user_id = ?
  `;

  const params = [userId];

  if (type && ["income", "expense"].includes(type)) {
    query += ` AND type = ?`;
    params.push(type);
  }

  if (category) {
    query += ` AND category = ?`;
    params.push(category);
  }

  if (startDate) {
    query += ` AND transaction_date >= ?`;
    params.push(startDate);
  }

  if (endDate) {
    query += ` AND transaction_date <= ?`;
    params.push(endDate);
  }

  query += ` ORDER BY transaction_date DESC, id DESC`;

  return db.prepare(query).all(...params);
}

// Update transaction
function updateTransaction(
  userId,
  transactionId,
  type,
  amount,
  category,
  description,
  transactionDate
) {
  const result = db
    .prepare(`
      UPDATE transactions
      SET
        type = ?,
        amount = ?,
        category = ?,
        description = ?,
        transaction_date = ?
      WHERE id = ? AND user_id = ?
    `)
    .run(
      type,
      amount,
      category,
      description || "",
      transactionDate,
      transactionId,
      userId
    );

  if (result.changes === 0) {
    return null;
  }

  return db
    .prepare(`
      SELECT *
      FROM transactions
      WHERE id = ? AND user_id = ?
    `)
    .get(transactionId, userId);
}

// Delete transaction
function deleteTransaction(userId, transactionId) {
  const result = db
    .prepare(`
      DELETE FROM transactions
      WHERE id = ? AND user_id = ?
    `)
    .run(transactionId, userId);

  return result.changes > 0;
}

// Dashboard summary
function getSummary(userId) {
  const summary = db
    .prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS totalIncome,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS totalExpense
      FROM transactions
      WHERE user_id = ?
    `)
    .get(userId);

  return {
    totalIncome: summary.totalIncome,
    totalExpense: summary.totalExpense,
    balance: summary.totalIncome - summary.totalExpense,
  };
}

module.exports = {
  addTransaction,
  getTransactions,
  getFilteredTransactions,
  updateTransaction,
  deleteTransaction,
  getSummary,
};