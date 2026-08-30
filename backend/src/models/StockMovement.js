const mongoose = require("mongoose");

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    type: {
      type: String,
      enum: ["in", "out"],
      required: true,
    },

    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    balanceAfter: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

stockMovementSchema.index({ product: 1, createdAt: -1 });

const StockMovement = mongoose.model("StockMovement", stockMovementSchema);

module.exports = StockMovement;
