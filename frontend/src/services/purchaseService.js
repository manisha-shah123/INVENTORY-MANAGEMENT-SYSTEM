import api from "./api";

export const fetchPurchases = async (supplierId) => {
  const response = await api.get("/purchases", {
    params: supplierId ? { supplier: supplierId } : {},
  });
  return response.data;
};

export const fetchPurchaseById = async (id) => {
  const response = await api.get(`/purchases/${id}`);
  return response.data;
};

export const createPurchase = async (payload) => {
  const response = await api.post("/purchases", payload);
  return response.data;
};

export const deletePurchase = async (id) => {
  const response = await api.delete(`/purchases/${id}`);
  return response.data;
};
