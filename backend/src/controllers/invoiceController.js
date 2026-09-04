const Invoice = require("../models/Invoice");
const Product = require("../models/Product");
const Client = require("../models/Client");
const StockMovement = require("../models/StockMovement");

const VAT_RATE = 0.13;

const getInvoices = async (req, res) => {
  try {
    const { customer } = req.query;
    const filter = {};
    if (customer) filter.customer = customer;

    const invoices = await Invoice.find(filter)
      .populate("customer", "name")
      .populate("items.product", "name sku unit")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: invoices });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch invoices" });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("customer", "name")
      .populate("items.product", "name sku unit");

    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch invoice" });
  }
};

const createInvoice = async (req, res) => {
  try {
    const {
      invoiceNumber,
      customerId,
      buyerName,
      vatNumber,
      address,
      contactNumber,
      date,
      paymentMode,
      items,
      remarks,
      discount,
      amountReceived,
    } = req.body;

    if (!invoiceNumber || !invoiceNumber.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Invoice number is required" });
    }
    if (!customerId) {
      return res
        .status(400)
        .json({ success: false, message: "Client is required" });
    }
    if (!date) {
      return res
        .status(400)
        .json({ success: false, message: "Date is required" });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Invoice must have at least one item",
        });
    }

    const customer = await Client.findById(customerId);
    if (!customer || customer.type !== "customer") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid client" });
    }

    // Validate each line, sum required qty per product (in case the same product appears twice)
    const neededByProduct = new Map();
    const preparedItems = [];

    for (const line of items) {
      const qty = Number(line.quantity);
      const rate = Number(line.rate);

      if (!line.productId) {
        return res
          .status(400)
          .json({ success: false, message: "Every item needs a product" });
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Quantity must be greater than 0 for every item",
          });
      }
      if (!Number.isFinite(rate) || rate < 0) {
        return res
          .status(400)
          .json({ success: false, message: "Rate cannot be negative" });
      }

      const product = await Product.findById(line.productId);
      if (!product) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Invalid product in invoice items",
          });
      }

      if (rate < product.purchasePrice) {
        return res.status(400).json({
          success: false,
          message: `Rate for ${product.name} cannot be less than its purchase price (${product.purchasePrice}).`,
        });
      }

      neededByProduct.set(
        String(product._id),
        (neededByProduct.get(String(product._id)) || 0) + qty,
      );

      preparedItems.push({
        product: product._id,
        productDoc: product,
        hsCode: line.hsCode || product.hsCode || "",
        grade: line.grade || product.grade || "",
        size: line.size || product.size || "",
        quantity: qty,
        rate,
        amount: qty * rate,
      });
    }

    // Check stock availability across the whole invoice before writing anything
    for (const [productId, totalQty] of neededByProduct.entries()) {
      const product = await Product.findById(productId);
      if (totalQty > product.currentStock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Only ${product.currentStock} ${product.unit} available, but invoice needs ${totalQty}.`,
        });
      }
    }

    const subtotal = preparedItems.reduce((sum, it) => sum + it.amount, 0);
    const discountAmt = Number(discount) || 0;

    if (discountAmt < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Discount cannot be negative" });
    }
    if (discountAmt > subtotal) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Discount cannot exceed the subtotal",
        });
    }

    const taxableAmount = subtotal - discountAmt;
    const vatAmount = taxableAmount * VAT_RATE;
    const grandTotal = taxableAmount + vatAmount;
    const received = Number(amountReceived) || 0;

    if (received < 0) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Amount received cannot be negative",
        });
    }
    if (received > grandTotal) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Amount received cannot exceed the grand total",
        });
    }

    const invoice = await Invoice.create({
      invoiceNumber: invoiceNumber.trim(),
      customer: customerId,
      buyerName: buyerName || customer.name,
      vatNumber: vatNumber || customer.vatNumber || "",
      address: address || customer.address || "",
      contactNumber: contactNumber || customer.phone || "",
      date,
      paymentMode: paymentMode || "cash",
      items: preparedItems.map(({ productDoc, ...rest }) => rest),
      remarks,
      subtotal,
      discount: discountAmt,
      taxableAmount,
      vatAmount,
      grandTotal,
      amountReceived: received,
      dueAmount: grandTotal - received,
    });

    // Apply stock deductions and log movements per distinct product
    for (const [productId, totalQty] of neededByProduct.entries()) {
      const product = await Product.findById(productId);
      const newStock = product.currentStock - totalQty;
      product.currentStock = newStock;
      await product.save();

      await StockMovement.create({
        product: product._id,
        type: "out",
        quantity: totalQty,
        reason: `Invoice #${invoice.invoiceNumber} to ${customer.name}`,
        balanceAfter: newStock,
      });
    }

    const populatedInvoice = await Invoice.findById(invoice._id)
      .populate("customer", "name")
      .populate("items.product", "name sku unit");

    res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: populatedInvoice,
    });
  } catch (error) {
    console.error("Create invoice error:", error);
    if (error.name === "ValidationError") {
      const message =
        Object.values(error.errors)[0]?.message || "Validation failed";
      return res.status(400).json({ success: false, message });
    }
    if (error.code === 11000) {
      return res
        .status(400)
        .json({
          success: false,
          message: "An invoice with this number already exists",
        });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to create invoice" });
  }
};

const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    }

    // Restore stock for every line item
    const restoreByProduct = new Map();
    for (const item of invoice.items) {
      const key = String(item.product);
      restoreByProduct.set(
        key,
        (restoreByProduct.get(key) || 0) + item.quantity,
      );
    }

    for (const [productId, qty] of restoreByProduct.entries()) {
      const product = await Product.findById(productId);
      if (product) {
        const newStock = product.currentStock + qty;
        product.currentStock = newStock;
        await product.save();

        await StockMovement.create({
          product: product._id,
          type: "in",
          quantity: qty,
          reason: `Invoice #${invoice.invoiceNumber} deleted`,
          balanceAfter: newStock,
        });
      }
    }

    await invoice.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Invoice deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete invoice" });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice,
};
