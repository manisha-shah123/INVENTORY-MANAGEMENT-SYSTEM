const express = require("express");

const {
  getPayments,
  getPendingInvoices,
  createPayment,
  deletePayment,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getPayments);
router.get("/pending", getPendingInvoices);
router.post("/", createPayment);
router.delete("/:id", deletePayment);

module.exports = router;
