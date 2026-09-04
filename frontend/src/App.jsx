import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientList from "./pages/ClientList";
import ClientForm from "./pages/ClientForm";
import ProductList from "./pages/ProductList";
import ProductForm from "./pages/ProductForm";
import StockAdjustment from "./pages/StockAdjustment";
import PurchaseList from "./pages/PurchaseList";
import PurchaseForm from "./pages/PurchaseForm";
import InvoiceList from "./pages/InvoiceList";
import InvoiceForm from "./pages/InvoiceForm";
import PaymentList from "./pages/PaymentList";
import PaymentForm from "./pages/PaymentForm";
import ExpenseList from "./pages/ExpenseList";
import ExpenseForm from "./pages/ExpenseForm";
import ProductAttributes from "./pages/ProductAttributes";
import ComingSoon from "./pages/ComingSoon";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductList />} />
            <Route path="products/new" element={<ProductForm />} />
            <Route path="products/:id/edit" element={<ProductForm />} />
            <Route path="products/:id/stock" element={<StockAdjustment />} />
            <Route path="products/attributes" element={<ProductAttributes />} />
            <Route path="customers" element={<ClientList type="customer" />} />
            <Route
              path="customers/new"
              element={<ClientForm type="customer" />}
            />
            <Route
              path="customers/:id/edit"
              element={<ClientForm type="customer" />}
            />
            <Route path="suppliers" element={<ClientList type="supplier" />} />
            <Route
              path="suppliers/new"
              element={<ClientForm type="supplier" />}
            />
            <Route
              path="suppliers/:id/edit"
              element={<ClientForm type="supplier" />}
            />
            <Route path="purchases" element={<PurchaseList />} />
            <Route path="purchases/new" element={<PurchaseForm />} />
            <Route path="sales" element={<InvoiceList />} />
            <Route path="sales/new" element={<InvoiceForm />} />
            <Route path="hisab-kitab" element={<PaymentList />} />
            <Route path="hisab-kitab/new" element={<PaymentForm />} />
            <Route path="expenses" element={<ExpenseList />} />
            <Route path="expenses/new" element={<ExpenseForm />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
