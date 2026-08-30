import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPayments, deletePayment } from "../services/paymentService";

const PaymentList = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const loadPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchPayments();
      setPayments(result.data);
    } catch (err) {
      setError("Couldn't load payments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleDelete = async (payment) => {
    const confirmed = window.confirm(
      "Delete this payment? The invoice's due amount will be restored.",
    );
    if (!confirmed) return;

    try {
      await deletePayment(payment._id);
      setPayments((prev) => prev.filter((p) => p._id !== payment._id));
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to delete payment.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Hisab-Kitab</h1>
          <p className="page-subtitle">
            Payments made to suppliers and received from customers.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/dashboard/hisab-kitab/new")}
        >
          + Record Payment
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && payments.length === 0 && (
        <p className="page-subtitle">No payments recorded yet.</p>
      )}

      {!loading && !error && payments.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date (BS)</th>
                <th>Type</th>
                <th>Client</th>
                <th>Invoice #</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Remarks</th>
                <th className="table-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td>{payment.date}</td>
                  <td>
                    <span
                      className={
                        payment.referenceModel === "Purchase"
                          ? "tag-out"
                          : "tag-in"
                      }
                    >
                      {payment.referenceModel === "Purchase"
                        ? "Paid to Supplier"
                        : "Received from Customer"}
                    </span>
                  </td>
                  <td>{payment.client?.name || "—"}</td>
                  <td>{payment.reference?.invoiceNumber || "—"}</td>
                  <td>{payment.amount.toLocaleString()}</td>
                  <td style={{ textTransform: "capitalize" }}>
                    {payment.method}
                  </td>
                  <td>{payment.remarks || "—"}</td>
                  <td className="table-actions-col">
                    <button
                      className="btn btn-outline btn-sm btn-danger"
                      onClick={() => handleDelete(payment)}
                    >
                      Delete
                    </button>
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

export default PaymentList;
