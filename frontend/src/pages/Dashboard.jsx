import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchDashboardSummary } from "../services/dashboardService";

const CARD_CONFIG = [
  { key: "stockValue", label: "Stock Value" },
  { key: "totalSales", label: "Total Sales" },
  { key: "totalPurchase", label: "Total Purchase" },
  { key: "receivable", label: "Receivable" },
  { key: "payable", label: "Payable" },
  { key: "totalExpense", label: "Expenses" },
];

const QUICK_ACTIONS = [
  { label: "Add Customer", to: "/dashboard/customers/new", icon: "👤" },
  { label: "Add Supplier", to: "/dashboard/suppliers/new", icon: "🚚" },
  { label: "Add Product", to: "/dashboard/products/new", icon: "📦" },
  { label: "Create Invoice", to: "/dashboard/sales/new", icon: "🧾" },
];

const formatMoney = (value) =>
  new Intl.NumberFormat("en-NP", {
    style: "currency",
    currency: "NPR",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const loadSummary = async () => {
      try {
        const result = await fetchDashboardSummary();
        setSummary(result.data);
      } catch (err) {
        setError("Couldn't load dashboard summary.");
      } finally {
        setLoading(false);
      }
    };

    loadSummary();
  }, []);

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">
        Stock value + Total sales + Purchase + Receivable + Payable + Expenses
      </p>

      <div className="quick-actions">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.to}
            type="button"
            className="quick-action-card"
            onClick={() => navigate(action.to)}
          >
            <span className="quick-action-icon">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>

      {loading && <p>Loading summary...</p>}
      {error && <p className="error-text">{error}</p>}

      {summary && (
        <div className="card-grid">
          {CARD_CONFIG.map((card) => (
            <div className="summary-card" key={card.key}>
              <span className="summary-card-label">{card.label}</span>
              <span className="summary-card-value">
                {formatMoney(summary[card.key])}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
