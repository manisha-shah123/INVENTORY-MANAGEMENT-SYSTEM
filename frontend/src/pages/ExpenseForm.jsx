import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createExpense } from "../services/expenseService";

const CATEGORIES = [
  "Transport",
  "Salary",
  "Rent",
  "Fuel",
  "Office",
  "Marketing",
  "Other",
];

const EMPTY_FORM = {
  category: "Transport",
  date: "",
  amount: "",
  description: "",
};

const ExpenseForm = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      return setError("Date must be in YYYY-MM-DD format (Bikram Sambat).");
    }
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return setError("Amount must be greater than 0.");

    setSaving(true);
    try {
      await createExpense({
        category: form.category,
        date: form.date,
        amount: amt,
        description: form.description,
      });
      navigate("/dashboard/expenses", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save expense.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">New Expense</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="login-field">
          <label htmlFor="category">Category</label>
          <select
            id="category"
            value={form.category}
            onChange={handleChange("category")}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="login-field">
          <label htmlFor="date">Date (Bikram Sambat)</label>
          <input
            id="date"
            type="text"
            placeholder="2081-01-22"
            value={form.date}
            onChange={handleChange("date")}
            required
          />
          <p className="field-hint">Enter date in BS (e.g., 2081-01-22)</p>
        </div>

        <div className="login-field">
          <label htmlFor="amount">Amount</label>
          <input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={handleChange("amount")}
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="description">Description</label>
          <input
            id="description"
            type="text"
            value={form.description}
            onChange={handleChange("description")}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Expense"}
          </button>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => navigate("/dashboard/expenses")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
