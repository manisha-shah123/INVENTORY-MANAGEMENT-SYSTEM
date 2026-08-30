const Product = require("../models/Product");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");
const Expense = require("../models/Expense");

const getDashboardSummary = async (req, res) => {
  try {
    const products = await Product.find({}, "currentStock purchasePrice");
    const stockValue = products.reduce(
      (sum, p) => sum + p.currentStock * p.purchasePrice,
      0,
    );

    const [salesAgg] = await Sale.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          due: { $sum: "$dueAmount" },
        },
      },
    ]);
    const [purchaseAgg] = await Purchase.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          due: { $sum: "$dueAmount" },
        },
      },
    ]);
    const [expenseAgg] = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    res.status(200).json({
      success: true,
      data: {
        stockValue,
        totalSales: salesAgg?.total || 0,
        totalPurchase: purchaseAgg?.total || 0,
        receivable: salesAgg?.due || 0,
        payable: purchaseAgg?.due || 0,
        totalExpense: expenseAgg?.total || 0,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch dashboard summary" });
  }
};

module.exports = { getDashboardSummary };
