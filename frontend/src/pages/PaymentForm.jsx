import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchClients } from "../services/clientService";
import {
  fetchPendingInvoices,
  createPayment,
} from "../services/paymentService";

const EMPTY_FORM = {
  type: "purchase",
  clientId: "",
  invoiceId: "",
  date: "",
  amount: "",
  method: "cash",
  remarks: "",
};

const PaymentForm = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const loadClients = async () => {
      setLoadingClients(true);
      try {
        const result = await fetchClients(
          form.type === "purchase" ? "supplier" : "customer",
        );
        setClients(result.data);
      } catch (err) {
        setError("Couldn't load clients.");
      } finally {
        setLoadingClients(false);
      }
    };
    loadClients();
    setForm((prev) => ({ ...prev, clientId: "", invoiceId: "" }));
    setInvoices([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.type]);

  useEffect(() => {
    if (!form.clientId) {
      setInvoices([]);
      return;
    }

    const loadInvoices = async () => {
      setLoadingInvoices(true);
      try {
        const result = await fetchPendingInvoices(form.type, form.clientId);
        setInvoices(result.data);
      } catch (err) {
        setError("Couldn't load invoices for this client.");
      } finally {
        setLoadingInvoices(false);
      }
    };
    loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.clientId]);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const selectedInvoice = invoices.find((inv) => inv._id === form.invoiceId);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.clientId) return setError("Please select a client.");
    if (!form.invoiceId) return setError("Please select an invoice.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
      return setError("Date must be in YYYY-MM-DD format (Bikram Sambat).");
    }
    const amt = Number(form.amount);
    if (!amt || amt <= 0) return setError("Amount must be greater than 0.");
    if (selectedInvoice && amt > selectedInvoice.dueAmount) {
      return setError(
        `Amount cannot exceed the due amount (${selectedInvoice.dueAmount}).`,
      );
    }

    setSaving(true);
    try {
      await createPayment({
        type: form.type,
        invoiceId: form.invoiceId,
        clientId: form.clientId,
        date: form.date,
        amount: amt,
        method: form.method,
        remarks: form.remarks,
      });
      navigate("/dashboard/hisab-kitab", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record payment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="page-title">Record Payment</h1>

      <form className="form-card" onSubmit={handleSubmit}>
        <div className="login-field">
          <label htmlFor="type">Type</label>
          <select id="type" value={form.type} onChange={handleChange("type")}>
            <option value="purchase">Payment to Supplier</option>
            <option value="sale">Payment from Customer</option>
          </select>
        </div>

        <div className="login-field">
          <label htmlFor="clientId">
            {form.type === "purchase" ? "Supplier" : "Customer"}
          </label>
          <select
            id="clientId"
            value={form.clientId}
            onChange={handleChange("clientId")}
            disabled={loadingClients}
            required
          >
            <option value="">
              -- Select {form.type === "purchase" ? "Supplier" : "Customer"} --
            </option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="login-field">
          <label htmlFor="invoiceId">Invoice</label>
          <select
            id="invoiceId"
            value={form.invoiceId}
            onChange={handleChange("invoiceId")}
            disabled={!form.clientId || loadingInvoices}
            required
          >
            <option value="">
              {!form.clientId
                ? "-- Select a client first --"
                : loadingInvoices
                  ? "Loading..."
                  : "-- Select Invoice --"}
            </option>
            {invoices.map((inv) => (
              <option key={inv._id} value={inv._id}>
                Inv #{inv.invoiceNumber} — {inv.product?.name} — Due:{" "}
                {inv.dueAmount.toLocaleString()}
              </option>
            ))}
          </select>
          {form.clientId && !loadingInvoices && invoices.length === 0 && (
            <p className="field-hint">
              No outstanding invoices for this client.
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
          {selectedInvoice && (
            <p className="field-hint">
              Due on this invoice: {selectedInvoice.dueAmount.toLocaleString()}
            </p>
          )}
        </div>

        <div className="login-field">
          <label htmlFor="method">Method</label>
          <select
            id="method"
            value={form.method}
            onChange={handleChange("method")}
          >
            <option value="cash">Cash</option>
            <option value="bank">Bank</option>
          </select>
        </div>

        <div className="login-field">
          <label htmlFor="remarks">Remarks</label>
          <input
            id="remarks"
            type="text"
            value={form.remarks}
            onChange={handleChange("remarks")}
          />
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="form-actions">
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Payment"}
          </button>
          <button
            className="btn btn-outline"
            type="button"
            onClick={() => navigate("/dashboard/hisab-kitab")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
