import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { AcademicAssessment } from '../../types';

interface SubjectPerformanceChartProps {
  assessments: AcademicAssessment[];
}

export const SubjectPerformanceChart: React.FC<SubjectPerformanceChartProps> = ({ assessments }) => {
  const chartData = assessments.map(a => ({
    subject: a.subject,
    percentage: Math.round((a.obtainedMarks / a.maxMarks) * 100),
    marks: `${a.obtainedMarks}/${a.maxMarks}`,
    grade: a.grade
  }));

  const getBarColor = (pct: number) => {
    if (pct >= 90) return '#0F6B50';
    if (pct >= 80) return '#3B8772';
    if (pct >= 70) return '#C9A227';
    return '#E11D48';
  };

  return (
    <div className="w-full h-64 sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E3EAE6" vertical={false} />
          <XAxis
            dataKey="subject"
            stroke="#667085"
            fontSize={11}
            tickLine={false}
            axisLine={{ stroke: '#E3EAE6' }}
            interval={0}
            angle={-25}
            textAnchor="end"
          />
          <YAxis
            domain={[0, 100]}
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
              fontSize: '12px'
            }}
            formatter={(value: any, _name: any, item: any) => [
              `${value}% (${item.payload.marks} - Grade: ${item.payload.grade})`,
              'Score'
            ]}
          />
          <Bar dataKey="percentage" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
