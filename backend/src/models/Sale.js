const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: [true, "Customer is required"],
    },

    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required"],
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

    invoiceNumber: {
      type: String,
      required: [true, "Invoice number is required"],
      trim: true,
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },

    rate: {
      type: Number,
      required: [true, "Rate is required"],
      min: [0, "Rate cannot be negative"],
    },

    total: {
      type: Number,
      required: true,
      min: 0,
    },

    amountReceived: {
      type: Number,
      default: 0,
      min: [0, "Amount received cannot be negative"],
    },

    dueAmount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

saleSchema.index({ customer: 1, createdAt: -1 });

const Sale = mongoose.model("Sale", saleSchema);

module.exports = Sale;
