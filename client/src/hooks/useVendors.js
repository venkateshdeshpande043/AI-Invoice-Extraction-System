import { useState } from 'react';
import api from '../services/api';
import { ITEMS_PER_PAGE } from '../utils/constants';

export function useVendors() {
  const [vendors, setVendors] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: ITEMS_PER_PAGE, totalPages: 0, totalCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVendors = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = { page: 1, limit: ITEMS_PER_PAGE, sortBy: 'spend', sortOrder: 'desc', ...params };
      Object.keys(queryParams).forEach((key) => {
        if (!queryParams[key]) delete queryParams[key];
      });
      const res = await api.get('/vendors', { params: queryParams });
      setVendors(res.data.data.vendors);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch vendors');
    } finally {
      setLoading(false);
    }
  };

  const getVendor = async (name) => {
    const res = await api.get(`/vendors/${encodeURIComponent(name)}`);
    return res.data.data;
  };

  return { vendors, pagination, loading, error, fetchVendors, getVendor };
}
