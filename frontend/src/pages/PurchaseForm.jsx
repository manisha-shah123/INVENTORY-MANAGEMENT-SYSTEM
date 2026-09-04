import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchClients } from "../services/clientService";
import { fetchProducts } from "../services/productService";
import { createPurchase } from "../services/purchaseService";
import DateInput from "../components/DateInput";

const EMPTY_FORM = {
  supplierId: "",
  productId: "",
  date: "",
  invoiceNumber: "",
  quantity: "",
  rate: "",
  amountPaid: "",
};

const PurchaseForm = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const [supplierResult, productResult] = await Promise.all([
          fetchClients("supplier"),
          fetchProducts(),
        ]);
        setSuppliers(supplierResult.data);
        setProducts(productResult.data);
      } catch (err) {
        setError("Couldn't load suppliers or products.");
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, []);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const quantity = Number(form.quantity) || 0;
  const rate = Number(form.rate) || 0;
  const total = quantity * rate;
  const amountPaid = Number(form.amountPaid) || 0;
  const dueAmount = total - amountPaid;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.supplierId) return setError("Please select a supplier.");
    if (!form.productId) return setError("Please select a product.");
    if (!form.invoiceNumber.trim())
      return setError("Invoice number is required.");
    if (!form.date) return setError("Please select a date.");
    if (quantity <= 0) return setError("Quantity must be greater than 0.");
    if (rate < 0) return setError("Rate cannot be negative.");
    if (amountPaid < 0) return setError("Amount paid cannot be negative.");
    if (amountPaid > total)
      return setError("Amount paid cannot exceed the total amount.");

    setSaving(true);
    try {
      await createPurchase({
        supplierId: form.supplierId,
        productId: form.productId,
        date: form.date,
        invoiceNumber: form.invoiceNumber,
        quantity,
        rate,
        amountPaid,
      });
      navigate("/dashboard/purchases", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save purchase.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1 className="page-title">New Purchase</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="login-field">
          <label htmlFor="supplierId">Supplier</label>
          <select
            id="supplierId"
            value={form.supplierId}
            onChange={handleChange("supplierId")}
            required
          >
            <option value="">-- Select Supplier --</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
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
        </div>

        <div className="login-field">
          <label htmlFor="date">Date</label>
          <DateInput
            id="date"
            value={form.date}
            onChange={(adIso) => setForm((prev) => ({ ...prev, date: adIso }))}
          />
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
          <label htmlFor="amountPaid">Amount Paid</label>
          <input
            id="amountPaid"
            type="number"
            min="0"
            step="0.01"
            value={form.amountPaid}
            onChange={handleChange("amountPaid")}
          />
        </div>

        <div className="login-field">
          <label>Due Amount</label>
          <input type="text" value={dueAmount.toLocaleString()} disabled />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Purchase"}
          </button>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => navigate("/dashboard/purchases")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PurchaseForm;
