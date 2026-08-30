import api from "./api";

export const fetchSales = async (customerId) => {
  const response = await api.get("/sales", {
    params: customerId ? { customer: customerId } : {},
  });
  return response.data;
};

export const fetchSaleById = async (id) => {
  const response = await api.get(`/sales/${id}`);
  return response.data;
};

export const createSale = async (payload) => {
  const response = await api.post("/sales", payload);
  return response.data;
};

export const deleteSale = async (id) => {
  const response = await api.delete(`/sales/${id}`);
  return response.data;
};
