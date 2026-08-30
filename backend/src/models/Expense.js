const mongoose = require("mongoose");

const CATEGORIES = [
  "Transport",
  "Salary",
  "Rent",
  "Fuel",
  "Office",
  "Marketing",
  "Other",
];

const expenseSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: CATEGORIES,
      required: [true, "Category is required"],
    },

    date: {
      type: String,
      required: [true, "Date is required"],
      validate: {
        validator: function (value) {
          return /^\d{4}-\d{2}-\d{2}$/.test(value);
        },
        message: "Date must be in YYYY-MM-DD format",
      },
    },

    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than 0"],
    },

    description: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

expenseSchema.index({ date: -1 });

expenseSchema.statics.CATEGORIES = CATEGORIES;

const Expense = mongoose.model("Expense", expenseSchema);

module.exports = Expense;
