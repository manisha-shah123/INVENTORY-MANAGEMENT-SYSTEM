const Payment = require("../models/Payment");
const Purchase = require("../models/Purchase");
const Sale = require("../models/Sale");
const Client = require("../models/Client");

const MODEL_BY_TYPE = { purchase: Purchase, sale: Sale };

const getPayments = async (req, res) => {
  try {
    const { client } = req.query;
    const filter = {};
    if (client) filter.client = client;

    const payments = await Payment.find(filter)
      .populate("client", "name")
      .populate("reference")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: payments });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch payments" });
  }
};

// GET /api/payments/pending?type=purchase|sale&clientId=...
const getPendingInvoices = async (req, res) => {
  try {
    const { type, clientId } = req.query;

    if (!["purchase", "sale"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Type must be 'purchase' or 'sale'" });
    }
    if (!clientId) {
      return res
        .status(400)
        .json({ success: false, message: "clientId is required" });
    }

    const Model = MODEL_BY_TYPE[type];
    const filterField = type === "purchase" ? "supplier" : "customer";

    const invoices = await Model.find({
      [filterField]: clientId,
      dueAmount: { $gt: 0 },
    })
      .populate("product", "name sku unit")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch pending invoices" });
  }
};

const createPayment = async (req, res) => {
  try {
    const { type, invoiceId, clientId, date, amount, method, remarks } =
      req.body;

    if (!["purchase", "sale"].includes(type)) {
      return res
        .status(400)
        .json({ success: false, message: "Type must be 'purchase' or 'sale'" });
    }
    if (!invoiceId || !clientId || !date || amount === undefined || !method) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }
    if (!["cash", "bank"].includes(method)) {
      return res
        .status(400)
        .json({ success: false, message: "Method must be 'cash' or 'bank'" });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Amount must be greater than 0" });
    }

    const client = await Client.findById(clientId);
    if (!client) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid client" });
    }

    const Model = MODEL_BY_TYPE[type];
    const invoice = await Model.findById(invoiceId);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    if (amt > invoice.dueAmount) {
      return res.status(400).json({
        success: false,
        message: `Amount cannot exceed the due amount (${invoice.dueAmount}).`,
      });
    }

    if (type === "purchase") {
      invoice.amountPaid += amt;
    } else {
      invoice.amountReceived += amt;
    }
    invoice.dueAmount -= amt;
    await invoice.save();

    const payment = await Payment.create({
      referenceModel: type === "purchase" ? "Purchase" : "Sale",
      reference: invoice._id,
      client: clientId,
      date,
      amount: amt,
      method,
      remarks,
    });

    const populatedPayment = await Payment.findById(payment._id)
      .populate("client", "name")
      .populate("reference");

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully",
      data: populatedPayment,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to record payment" });
  }
};

const deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    const Model = payment.referenceModel === "Purchase" ? Purchase : Sale;
    const invoice = await Model.findById(payment.reference);

    if (invoice) {
      if (payment.referenceModel === "Purchase") {
        invoice.amountPaid -= payment.amount;
      } else {
        invoice.amountReceived -= payment.amount;
      }
      invoice.dueAmount += payment.amount;
      await invoice.save();
    }

    await payment.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Payment deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete payment" });
  }
};

module.exports = {
  getPayments,
  getPendingInvoices,
  createPayment,
  deletePayment,
};
