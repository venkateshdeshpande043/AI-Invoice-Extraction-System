import { useState } from 'react';
import api from '../services/api';
import { ITEMS_PER_PAGE } from '../utils/constants';

export function useInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: ITEMS_PER_PAGE, totalPages: 0, totalCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchInvoices = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = { page: 1, limit: ITEMS_PER_PAGE, ...params };
      const res = await api.get('/invoices', { params: queryParams });
      setInvoices(res.data.data.invoices);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  };

  const getInvoice = async (id) => {
    const res = await api.get(`/invoices/${id}`);
    return res.data.data;
  };

  const uploadInvoice = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/invoices/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress,
    });
    return res.data.data;
  };

  const deleteInvoice = async (id) => {
    await api.delete(`/invoices/${id}`);
    setInvoices((prev) => prev.filter((inv) => inv._id !== id));
  };

  return {
    invoices,
    pagination,
    loading,
    error,
    fetchInvoices,
    getInvoice,
    uploadInvoice,
    deleteInvoice,
  };
}
