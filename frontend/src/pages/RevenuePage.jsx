import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FaCreditCard,
  FaArrowUp,
  FaArrowDown,
  FaHistory
} from 'react-icons/fa';
import MainLayout from '../components/layout/MainLayout';
import StatsCard from '../components/common/StatsCard';
import DataTable from '../components/common/DataTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { fetchPayments } from '../store/slices/paymentSlice';

export default function RevenuePage() {
  const dispatch = useDispatch();
  const { payments, stats, loading } = useSelector((state) => state.payments);

  useEffect(() => {
    dispatch(fetchPayments());
  }, [dispatch]);

  const columns = [
    { key: 'id', label: 'Transaction ID' },
    { key: 'amount', label: 'Amount', render: (v) => `₹${(v / 100).toFixed(2)}` },
    { key: 'status', label: 'Status' },
    { key: 'method', label: 'Method' },
    { key: 'created_at', label: 'Date', render: (v) => new Date(v).toLocaleDateString() },
  ];

  if (loading && payments.length === 0) {
    return (
      <MainLayout title="Revenue">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Revenue & Payments">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Total Revenue"
            value={`₹${((stats?.total_revenue || 0) / 100).toLocaleString()}`}
            icon={FaCreditCard}
            color="indigo"
          />
          <StatsCard
            title="Successful"
            value={stats?.successful_payments || 0}
            icon={FaArrowUp}
            color="green"
          />
          <StatsCard
            title="Failed/Pending"
            value={stats?.failed_payments || 0}
            icon={FaArrowDown}
            color="red"
          />
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-2">
            <FaHistory className="text-gray-400" />
            <h3 className="font-bold text-gray-900">Transaction History</h3>
          </div>
          <DataTable
            columns={columns}
            data={payments}
            loading={loading}
          />
        </div>
      </div>
    </MainLayout>
  );
}
