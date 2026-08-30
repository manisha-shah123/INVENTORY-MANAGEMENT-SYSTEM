const Sale = require("../models/Sale");
const Product = require("../models/Product");
const Client = require("../models/Client");
const StockMovement = require("../models/StockMovement");

const getSales = async (req, res) => {
  try {
    const { customer } = req.query;
    const filter = {};
    if (customer) filter.customer = customer;

    const sales = await Sale.find(filter)
      .populate("customer", "name")
      .populate("product", "name sku unit")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: sales });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch sales" });
  }
};

const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id)
      .populate("customer", "name")
      .populate("product", "name sku unit");

    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch sale" });
  }
};

const createSale = async (req, res) => {
  try {
    const {
      customerId,
      productId,
      date,
      invoiceNumber,
      quantity,
      rate,
      amountReceived,
    } = req.body;

    if (
      !customerId ||
      !productId ||
      !date ||
      !invoiceNumber ||
      !invoiceNumber.trim() ||
      !quantity ||
      rate === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Customer, product, date, invoice number, quantity, and rate are required",
      });
    }

    const qty = Number(quantity);
    const rateNum = Number(rate);
    const received = Number(amountReceived) || 0;

    if (!Number.isFinite(qty) || qty <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be greater than 0" });
    }
    if (!Number.isFinite(rateNum) || rateNum < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Rate cannot be negative" });
    }

    const customer = await Client.findById(customerId);
    if (!customer || customer.type !== "customer") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid customer" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product" });
    }

    if (rateNum < product.purchasePrice) {
      return res.status(400).json({
        success: false,
        message: `Selling rate cannot be less than the purchase price (${product.purchasePrice}). Selling below cost is not allowed.`,
      });
    }

    if (qty > product.currentStock) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Only ${product.currentStock} ${product.unit} available.`,
      });
    }

    const total = qty * rateNum;

    if (received < 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Amount received cannot be negative",
        });
    }
    if (received > total) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Amount received cannot exceed the total amount",
        });
    }

    const sale = await Sale.create({
      customer: customerId,
      product: productId,
      date,
      invoiceNumber: invoiceNumber.trim(),
      quantity: qty,
      rate: rateNum,
      total,
      amountReceived: received,
      dueAmount: total - received,
    });

    const newStock = product.currentStock - qty;
    product.currentStock = newStock;
    await product.save();

    await StockMovement.create({
      product: product._id,
      type: "out",
      quantity: qty,
      reason: `Sale to ${customer.name} (Inv #${sale.invoiceNumber})`,
      balanceAfter: newStock,
    });

    const populatedSale = await Sale.findById(sale._id)
      .populate("customer", "name")
      .populate("product", "name sku unit");

    res.status(201).json({
      success: true,
      message: "Sale recorded successfully",
      data: populatedSale,
    });
  } catch (error) {
    console.error("Create sale error:", error);
    if (error.name === "ValidationError") {
      const message =
        Object.values(error.errors)[0]?.message || "Validation failed";
      return res.status(400).json({ success: false, message });
    }
    res.status(500).json({ success: false, message: "Failed to create sale" });
  }
};

const deleteSale = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res
        .status(404)
        .json({ success: false, message: "Sale not found" });
    }

    const product = await Product.findById(sale.product);

    if (product) {
      const newStock = product.currentStock + sale.quantity;
      product.currentStock = newStock;
      await product.save();

      await StockMovement.create({
        product: product._id,
        type: "in",
        quantity: sale.quantity,
        reason: `Sale deleted (was Inv #${sale.invoiceNumber})`,
        balanceAfter: newStock,
      });
    }

    await sale.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Sale deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete sale" });
  }
};

module.exports = {
  getSales,
  getSaleById,
  createSale,
  deleteSale,
};
