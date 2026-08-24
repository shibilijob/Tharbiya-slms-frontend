import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

interface MonthlyGrowthChartProps {
  data?: Array<{
    month: string;
    overall: number;
    quran: number;
    studies: number;
    attendance: number;
  }>;
}

const DEFAULT_GROWTH_DATA = [
  { month: 'Mar', overall: 78, quran: 80, studies: 76, attendance: 90 },
  { month: 'Apr', overall: 81, quran: 84, studies: 80, attendance: 92 },
  { month: 'May', overall: 83, quran: 87, studies: 82, attendance: 95 },
  { month: 'Jun', overall: 84, quran: 89, studies: 84, attendance: 91 },
  { month: 'Jul', overall: 85, quran: 90, studies: 85, attendance: 93 },
  { month: 'Aug', overall: 86, quran: 91, studies: 86, attendance: 94 }
];

export const MonthlyGrowthChart: React.FC<MonthlyGrowthChartProps> = ({
  data = DEFAULT_GROWTH_DATA
}) => {
  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0F6B50" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#0F6B50" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorQuran" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#C9A227" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#C9A227" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E3EAE6" vertical={false} />
          <XAxis
            dataKey="month"
            stroke="#667085"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#E3EAE6' }}
          />
          <YAxis
            domain={[60, 100]}
            stroke="#667085"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: '#E3EAE6' }}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#084C3A',
              border: 'none',
              borderRadius: '12px',
              color: '#FFFFFF',
              fontSize: '12px',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value: any, name: any) => {
              const labelMap: Record<string, string> = {
                overall: 'Overall Progress',
                quran: 'Quran & Hifz',
                studies: 'Academic Studies',
                attendance: 'Attendance'
              };
              return [`${value}%`, labelMap[name] || name];
            }}
          />
          <Area
            type="monotone"
            dataKey="overall"
            name="overall"
            stroke="#0F6B50"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorOverall)"
          />
          <Area
            type="monotone"
            dataKey="quran"
            name="quran"
            stroke="#C9A227"
            strokeWidth={2}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#colorQuran)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
