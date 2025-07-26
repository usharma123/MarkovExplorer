"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

function makeHistogram(values: number[], bins = 30) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = (max - min) / (bins || 1) || 1;
  const counts = Array(bins).fill(0);
  for (const v of values) {
    let idx = Math.floor((v - min) / width);
    if (idx >= bins) idx = bins - 1;
    counts[idx]++;
  }
  return counts.map((c, i) => ({
    x: min + (i + 0.5) * width,
    count: c,
    percentage: (c / values.length) * 100,
  }));
}

export default function DistributionChart({ values, bins = 30 }: { values: number[]; bins?: number }) {
  const data = useMemo(() => makeHistogram(values, bins), [values, bins]);
  
  const stats = useMemo(() => {
    if (!values.length) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const std = Math.sqrt(values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length);
    
    return {
      min: Math.min(...values),
      max: Math.max(...values),
      mean: mean.toFixed(3),
      median: median.toFixed(3),
      std: std.toFixed(3),
    };
  }, [values]);

  return (
    <div className="w-full">
      <div className="h-72">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="x" 
              tickFormatter={(v) => v.toFixed(2)}
              label={{ value: "Total Reward", position: "insideBottom", offset: -10 }}
            />
            <YAxis 
              label={{ value: "Frequency", angle: -90, position: "insideLeft" }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => [
                name === "count" ? `${value} episodes` : `${value.toFixed(1)}%`,
                name === "count" ? "Count" : "Percentage"
              ]} 
              labelFormatter={(v) => `Reward ≈ ${Number(v).toFixed(2)}`} 
            />
            <Bar dataKey="count" fill="#4F46E5" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {stats && (
        <div className="mt-4 grid grid-cols-5 gap-4 text-sm">
          <div className="text-center">
            <div className="font-medium text-gray-600">Min</div>
            <div className="text-lg font-bold">{stats.min}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-600">Max</div>
            <div className="text-lg font-bold">{stats.max}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-600">Mean</div>
            <div className="text-lg font-bold">{stats.mean}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-600">Median</div>
            <div className="text-lg font-bold">{stats.median}</div>
          </div>
          <div className="text-center">
            <div className="font-medium text-gray-600">Std Dev</div>
            <div className="text-lg font-bold">{stats.std}</div>
          </div>
        </div>
      )}
    </div>
  );
}
