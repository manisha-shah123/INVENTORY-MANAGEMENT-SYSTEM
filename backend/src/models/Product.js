const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      validate: {
        validator: function (value) {
          return /[A-Za-z]/.test(value);
        },
        message: "Product name must contain letters, not just numbers",
      },
    },

    sku: {
      type: String,
      required: [true, "SKU is required"],
      trim: true,
      uppercase: true,
      unique: true,
    },

    brand: { type: String, trim: true, default: "" },
    category: { type: String, trim: true, default: "" },
    grade: { type: String, trim: true, default: "" },
    size: { type: String, trim: true, default: "" },
    hsCode: { type: String, trim: true, default: "" },

    unit: {
      type: String,
      trim: true,
      default: "pcs",
    },

    purchasePrice: {
      type: Number,
      required: [true, "Purchase price is required"],
      min: [0, "Purchase price cannot be negative"],
    },

    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
    },

    currentStock: {
      type: Number,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },

    minimumStock: {
      type: Number,
      default: 0,
      min: [0, "Minimum stock cannot be negative"],
    },
  },
  { timestamps: true },
);

productSchema.index({ name: 1 });

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
