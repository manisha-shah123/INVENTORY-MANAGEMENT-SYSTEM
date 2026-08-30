import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchSales, deleteSale } from "../services/saleService";

const SaleList = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const loadSales = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetchSales();
      setSales(result.data);
    } catch (err) {
      setError("Couldn't load sales.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, []);

  const handleDelete = async (sale) => {
    const confirmed = window.confirm(
      `Delete this sale of ${sale.quantity} ${sale.product?.unit || ""} of ${sale.product?.name}? The stock will be added back.`,
    );
    if (!confirmed) return;

    try {
      await deleteSale(sale._id);
      setSales((prev) => prev.filter((s) => s._id !== sale._id));
    } catch (err) {
      window.alert(err.response?.data?.message || "Failed to delete sale.");
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales</h1>
          <p className="page-subtitle">Stock sold to customers/dealers.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/dashboard/sales/new")}
        >
          + New Sale
        </button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && sales.length === 0 && (
        <p className="page-subtitle">
          No sales yet. Click "New Sale" to record one.
        </p>
      )}

      {!loading && !error && sales.length > 0 && (
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Date (BS)</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Invoice #</th>
                <th>Qty</th>
                <th>Rate</th>
                <th>Total</th>
                <th>Received</th>
                <th>Due</th>
                <th className="table-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale) => (
                <tr key={sale._id}>
                  <td>{sale.date}</td>
                  <td>{sale.customer?.name || "—"}</td>
                  <td>
                    {sale.product?.name} ({sale.product?.sku})
                  </td>
                  <td>{sale.invoiceNumber || "—"}</td>
                  <td>
                    {sale.quantity} {sale.product?.unit}
                  </td>
                  <td>{sale.rate.toLocaleString()}</td>
                  <td>{sale.total.toLocaleString()}</td>
                  <td>{sale.amountReceived.toLocaleString()}</td>
                  <td>
                    <span className={sale.dueAmount > 0 ? "stock-low" : ""}>
                      {sale.dueAmount.toLocaleString()}
                    </span>
                  </td>
                  <td className="table-actions-col">
                    <button
                      className="btn btn-outline btn-sm btn-danger"
                      onClick={() => handleDelete(sale)}
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

export default SaleList;
