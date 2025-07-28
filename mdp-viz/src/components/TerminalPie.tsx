"use client";

import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7f7f", "#8dd1e1", "#a4de6c", "#d084d0", "#ffa726"];

export default function TerminalPie({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  
  const data = entries.map(([name, value]) => ({ 
    name, 
    value,
    percentage: ((value / total) * 100).toFixed(1)
  }));

  return (
    <div className="w-full">
      <div className="h-64 bg-white rounded-lg shadow-lg p-4">
        <ResponsiveContainer>
          <PieChart>
            <Pie 
              data={data} 
              dataKey="value" 
              nameKey="name" 
              cx="50%" 
              cy="50%" 
              outerRadius={80}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number, name: string) => [
                `${value} episodes (${((value / total) * 100).toFixed(1)}%)`,
                name
              ]}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 text-center text-sm text-gray-600">
        <p>Total episodes ending in each terminal state</p>
      </div>
    </div>
  );
}
