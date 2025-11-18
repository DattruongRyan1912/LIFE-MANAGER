'use client';

import AiChat from '@/components/AiChat';
import { getDailyPlan, getDailySummary } from '@/lib/api';
import { useState } from 'react';

export default function AssistantPage() {
  const [plan, setPlan] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGetDailyPlan = async () => {
    setLoading(true);
    try {
      const response = await getDailyPlan();
      setPlan(response.plan || 'Không thể tạo kế hoạch.');
    } catch (error) {
      console.error('Error getting daily plan:', error);
      setPlan('Có lỗi xảy ra khi tạo kế hoạch.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetDailySummary = async () => {
    setLoading(true);
    try {
      const response = await getDailySummary();
      setSummary(response.summary || 'Không thể tạo tóm tắt.');
    } catch (error) {
      console.error('Error getting daily summary:', error);
      setSummary('Có lỗi xảy ra khi tạo tóm tắt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🤖 AI Assistant</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">📅 Kế hoạch hôm nay</h2>
            <button
              onClick={handleGetDailyPlan}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 mb-4"
            >
              {loading ? 'Đang tạo...' : 'Tạo kế hoạch'}
            </button>
            {plan && (
              <div className="bg-gray-50 rounded p-4 whitespace-pre-wrap">
                {plan}
              </div>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">📝 Tóm tắt ngày</h2>
            <button
              onClick={handleGetDailySummary}
              disabled={loading}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 mb-4"
            >
              {loading ? 'Đang tạo...' : 'Tạo tóm tắt'}
            </button>
            {summary && (
              <div className="bg-gray-50 rounded p-4 whitespace-pre-wrap">
                {summary}
              </div>
            )}
          </div>

          <div className="lg:row-span-2">
            <AiChat />
          </div>
        </div>
      </div>
    </div>
  );
}
