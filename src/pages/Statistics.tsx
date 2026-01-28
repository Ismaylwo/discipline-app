import React from 'react';
import DashboardCharts from '../components/statistics/DashboardCharts';

const Statistics: React.FC = () => {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-semibold text-white">Статистика</h2>
        <p className="text-sm text-slate-400">Отслеживайте продуктивность и привычки.</p>
      </header>
      <DashboardCharts />
    </div>
  );
};

export default Statistics;
