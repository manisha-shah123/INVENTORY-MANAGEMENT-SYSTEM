require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const clientRoutes = require("./routes/clientRoutes");
const productRoutes = require("./routes/productRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const saleRoutes = require("./routes/saleRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const expenseRoutes = require("./routes/expenseRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/clients", clientRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchases", purchaseRoutes);
app.use("/api/sales", saleRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/expenses", expenseRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Inventory Management API is running",
  });
});

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
