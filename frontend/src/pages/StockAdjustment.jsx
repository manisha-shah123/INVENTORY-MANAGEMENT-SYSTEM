import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  fetchProductById,
  adjustStock,
  fetchStockHistory,
} from "../services/productService";

const StockAdjustment = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({ type: "in", quantity: "", reason: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [productResult, historyResult] = await Promise.all([
        fetchProductById(id),
        fetchStockHistory(id),
      ]);
      setProduct(productResult.data);
      setHistory(historyResult.data);
    } catch (err) {
      setError("Couldn't load this product's stock details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");

    const qty = Number(form.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      setFormError("Quantity must be a whole number greater than 0.");
      return;
    }

    setSaving(true);
    try {
      const result = await adjustStock(id, {
        type: form.type,
        quantity: qty,
        reason: form.reason,
      });
      setProduct(result.data.product);
      setHistory((prev) => [result.data.movement, ...prev]);
      setForm({ type: "in", quantity: "", reason: "" });
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to update stock.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error || !product) {
    return <p className="error-text">{error || "Product not found."}</p>;
  }

  return (
    <div>
      <h1 className="page-title">Adjust Stock — {product.name}</h1>
      <p className="page-subtitle">
        Current stock:{" "}
        <strong>
          {product.currentStock} {product.unit}
        </strong>
        {product.currentStock <= product.minimumStock && (
          <span className="badge-low" style={{ marginLeft: 8 }}>
            Low
          </span>
        )}
      </p>

      <form
        className="form-card"
        onSubmit={handleSubmit}
        style={{ marginBottom: 32 }}
      >
        <div className="login-field">
          <label htmlFor="type">Type</label>
          <select id="type" value={form.type} onChange={handleChange("type")}>
            <option value="in">Stock In</option>
            <option value="out">Stock Out</option>
          </select>
        </div>

        <div className="login-field">
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            min="1"
            step="1"
            value={form.quantity}
            onChange={handleChange("quantity")}
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="reason">Reason / Note</label>
          <input
            id="reason"
            type="text"
            placeholder="e.g. Received from supplier, Damaged goods, Sold to customer"
            value={form.reason}
            onChange={handleChange("reason")}
          />
        </div>

        {formError && <p className="error-text">{formError}</p>}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => navigate("/dashboard/products")}
          >
            Back to Products
          </button>
        </div>
      </form>

      <h2 className="page-title" style={{ fontSize: 18 }}>
        Stock History
      </h2>

      {history.length === 0 && (
        <p className="page-subtitle">No stock movements yet.</p>
      )}

      {history.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Quantity</th>
                <th>Reason</th>
                <th>Balance After</th>
              </tr>
            </thead>
            <tbody>
              {history.map((movement) => (
                <tr key={movement._id}>
                  <td>{new Date(movement.createdAt).toLocaleString()}</td>
                  <td>
                    <span
                      className={movement.type === "in" ? "tag-in" : "tag-out"}
                    >
                      {movement.type === "in" ? "Stock In" : "Stock Out"}
                    </span>
                  </td>
                  <td>
                    {movement.quantity} {product.unit}
                  </td>
                  <td>{movement.reason || "—"}</td>
                  <td>
                    {movement.balanceAfter} {product.unit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockAdjustment;
