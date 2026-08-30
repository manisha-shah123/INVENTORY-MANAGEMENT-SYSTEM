const express = require("express");

const {
  getSales,
  getSaleById,
  createSale,
  deleteSale,
} = require("../controllers/saleController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getSales);
router.get("/:id", getSaleById);
router.post("/", createSale);
router.delete("/:id", deleteSale);

module.exports = router;
