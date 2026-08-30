const express = require("express");

const {
  getExpenses,
  createExpense,
  deleteExpense,
} = require("../controllers/expenseController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getExpenses);
router.post("/", createExpense);
router.delete("/:id", deleteExpense);

module.exports = router;
