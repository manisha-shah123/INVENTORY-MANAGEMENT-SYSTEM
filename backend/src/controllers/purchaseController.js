const Purchase = require("../models/Purchase");
const Product = require("../models/Product");
const Client = require("../models/Client");
const StockMovement = require("../models/StockMovement");

const getPurchases = async (req, res) => {
  try {
    const { supplier } = req.query;
    const filter = {};
    if (supplier) filter.supplier = supplier;

    const purchases = await Purchase.find(filter)
      .populate("supplier", "name")
      .populate("product", "name sku unit")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: purchases });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch purchases" });
  }
};

const getPurchaseById = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate("supplier", "name")
      .populate("product", "name sku unit");

    if (!purchase) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });
    }

    res.status(200).json({ success: true, data: purchase });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch purchase" });
  }
};

const createPurchase = async (req, res) => {
  try {
    const {
      supplierId,
      productId,
      date,
      invoiceNumber,
      quantity,
      rate,
      amountPaid,
    } = req.body;

    if (
      !supplierId ||
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
          "Supplier, product, date, invoice number, quantity, and rate are required",
      });
    }

    const qty = Number(quantity);
    const rateNum = Number(rate);
    const paid = Number(amountPaid) || 0;

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

    const total = qty * rateNum;

    if (paid < 0) {
      return res
        .status(400)
        .json({ success: false, message: "Amount paid cannot be negative" });
    }
    if (paid > total) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Amount paid cannot exceed the total amount",
        });
    }

    const supplier = await Client.findById(supplierId);
    if (!supplier || supplier.type !== "supplier") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid supplier" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid product" });
    }

    const purchase = await Purchase.create({
      supplier: supplierId,
      product: productId,
      date,
      invoiceNumber: invoiceNumber.trim(),
      quantity: qty,
      rate: rateNum,
      total,
      amountPaid: paid,
      dueAmount: total - paid,
    });

    const newStock = product.currentStock + qty;
    product.currentStock = newStock;
    await product.save();

    await StockMovement.create({
      product: product._id,
      type: "in",
      quantity: qty,
      reason: `Purchase from ${supplier.name} (Inv #${purchase.invoiceNumber})`,
      balanceAfter: newStock,
    });

    const populatedPurchase = await Purchase.findById(purchase._id)
      .populate("supplier", "name")
      .populate("product", "name sku unit");

    res.status(201).json({
      success: true,
      message: "Purchase recorded successfully",
      data: populatedPurchase,
    });
  } catch (error) {
    console.error("Create purchase error:", error);
    if (error.name === "ValidationError") {
      const message =
        Object.values(error.errors)[0]?.message || "Validation failed";
      return res.status(400).json({ success: false, message });
    }
    res
      .status(500)
      .json({ success: false, message: "Failed to create purchase" });
  }
};

const deletePurchase = async (req, res) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) {
      return res
        .status(404)
        .json({ success: false, message: "Purchase not found" });
    }

    const product = await Product.findById(purchase.product);

    if (product) {
      if (product.currentStock < purchase.quantity) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete this purchase — only ${product.currentStock} ${product.unit} left in stock, but this purchase added ${purchase.quantity}. Some of it has already been sold or used elsewhere.`,
        });
      }

      const newStock = product.currentStock - purchase.quantity;
      product.currentStock = newStock;
      await product.save();

      await StockMovement.create({
        product: product._id,
        type: "out",
        quantity: purchase.quantity,
        reason: `Purchase deleted (was Inv #${purchase.invoiceNumber})`,
        balanceAfter: newStock,
      });
    }

    await purchase.deleteOne();

    res
      .status(200)
      .json({ success: true, message: "Purchase deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to delete purchase" });
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  deletePurchase,
};
