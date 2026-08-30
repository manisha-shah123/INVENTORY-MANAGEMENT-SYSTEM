const Expense = require("../models/Expense");

const getExpenses = async (req, res) => {
  try {
    const { category } = req.query;
    const filter = {};
    if (category) filter.category = category;

    const expenses = await Expense.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch expenses" });
  }
};

const createExpense = async (req, res) => {
  try {
    const { category, date, amount, description } = req.body;

    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: "Category is required" });
    }
    if (!date) {
      return res
        .status(400)
        .json({ success: false, message: "Date is required" });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Amount must be greater than 0" });
    }

    const expense = await Expense.create({
      category,
      date,
      amount: amt,
      description,
    });

    res.status(201).json({
      success: true,
      message: "Expense recorded successfully",
      data: expense,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message =
        Object.values(error.errors)[0]?.message || "Validation failed";
      return res.status(400).json({ success: false, message });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to create expense" });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete expense" });
  }
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense,
};
