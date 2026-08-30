const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    referenceModel: {
      type: String,
      enum: ["Purchase", "Sale"],
      required: true,
    },
    reference: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "referenceModel",
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Client",
      required: true,
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
    method: {
      type: String,
      enum: ["cash", "bank"],
      required: true,
    },
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true },
);

paymentSchema.index({ client: 1, createdAt: -1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
