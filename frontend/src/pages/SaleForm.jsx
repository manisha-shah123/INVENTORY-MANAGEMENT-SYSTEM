import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchClients } from "../services/clientService";
import { fetchProducts } from "../services/productService";
import { createSale } from "../services/saleService";

const EMPTY_FORM = {
  customerId: "",
  productId: "",
  date: "",
  invoiceNumber: "",
  quantity: "",
  rate: "",
  amountReceived: "",
};

const SaleForm = () => {
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [customerResult, productResult] = await Promise.all([
          fetchClients("customer"),
          fetchProducts(),
        ]);
        setCustomers(customerResult.data);
        setProducts(productResult.data);
      } catch (err) {
        setError("Couldn't load customers or products.");
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const selectedProduct = products.find((p) => p._id === form.productId);
  const quantity = Number(form.quantity) || 0;
  const rate = Number(form.rate) || 0;
  const total = quantity * rate;
  const amountReceived = Number(form.amountReceived) || 0;
  const dueAmount = total - amountReceived;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.customerId) return setError("Please select a customer.");
    if (!form.productId) return setError("Please select a product.");
    if (!form.invoiceNumber.trim())
      return setError("Invoice number is required.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      return setError("Date must be in YYYY-MM-DD format (Bikram Sambat).");
    }
    if (quantity <= 0) return setError("Quantity must be greater than 0.");
    if (rate < 0) return setError("Rate cannot be negative.");
    if (selectedProduct && rate < selectedProduct.purchasePrice) {
      return setError(
        `Selling rate cannot be less than the purchase price (${selectedProduct.purchasePrice}). Selling below cost is not allowed.`,
      );
    }
    if (amountReceived < 0)
      return setError("Amount received cannot be negative.");
    if (amountReceived > total)
      return setError("Amount received cannot exceed the total amount.");
    if (selectedProduct && quantity > selectedProduct.currentStock) {
      return setError(
        `Insufficient stock. Only ${selectedProduct.currentStock} ${selectedProduct.unit} available.`,
      );
    }

    setSaving(true);
    try {
      await createSale({
        customerId: form.customerId,
        productId: form.productId,
        date: form.date,
        invoiceNumber: form.invoiceNumber,
        quantity,
        rate,
        amountReceived,
      });
      navigate("/dashboard/sales", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save sale.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1 className="page-title">New Sale</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="login-field">
          <label htmlFor="customerId">Customer</label>
          <select
            id="customerId"
            value={form.customerId}
            onChange={handleChange("customerId")}
            required
          >
            <option value="">-- Select Customer --</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="login-field">
          <label htmlFor="productId">Product</label>
          <select
            id="productId"
            value={form.productId}
            onChange={handleChange("productId")}
            required
          >
            <option value="">-- Select Product --</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.sku})
              </option>
            ))}
          </select>
          {selectedProduct && (
            <p className="field-hint">
              Available stock: {selectedProduct.currentStock}{" "}
              {selectedProduct.unit} · Purchase price:{" "}
              {selectedProduct.purchasePrice}
            </p>
          )}
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
          <label htmlFor="invoiceNumber">Invoice Number</label>
          <input
            id="invoiceNumber"
            type="text"
            value={form.invoiceNumber}
            onChange={handleChange("invoiceNumber")}
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="quantity">Quantity</label>
          <input
            id="quantity"
            type="number"
            min="1"
            value={form.quantity}
            onChange={handleChange("quantity")}
            required
          />
        </div>

        <div className="login-field">
          <label htmlFor="rate">Rate (per unit)</label>
          <input
            id="rate"
            type="number"
            min="0"
            step="0.01"
            value={form.rate}
            onChange={handleChange("rate")}
            required
          />
        </div>

        <div className="login-field">
          <label>Total</label>
          <input type="text" value={total.toLocaleString()} disabled />
        </div>

        <div className="login-field">
          <label htmlFor="amountReceived">Amount Received</label>
          <input
            id="amountReceived"
            type="number"
            min="0"
            step="0.01"
            value={form.amountReceived}
            onChange={handleChange("amountReceived")}
          />
        </div>

        <div className="login-field">
          <label>Due Amount</label>
          <input type="text" value={dueAmount.toLocaleString()} disabled />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Sale"}
          </button>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => navigate("/dashboard/sales")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default SaleForm;
