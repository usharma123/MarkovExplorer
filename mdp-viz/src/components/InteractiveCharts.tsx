"use client";

import { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, ScatterChart, Scatter
} from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { MDP } from '@/types/mdp';

interface InteractiveChartsProps {
  mdp: MDP;
  valueFunction?: Record<string, number>;
  policy?: Record<string, string>;
  convergenceHistory?: number[];
  progressHistory?: Array<{
    iteration: number;
    delta: number;
    valueFunction: Record<string, number>;
    policy: Record<string, string>;
    method: string;
  }>;
}

type ChartType = 'line' | 'area' | 'bar' | 'pie' | 'scatter';
type DataType = 'values' | 'policy' | 'convergence' | 'progress';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function InteractiveCharts({
  mdp,
  valueFunction,
  policy,
  convergenceHistory,
  progressHistory
}: InteractiveChartsProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [dataType, setDataType] = useState<DataType>('values');
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  // Prepare data for different chart types
  const chartData = useMemo(() => {
    switch (dataType) {
      case 'values':
        return mdp.states.map(state => ({
          state,
          value: valueFunction?.[state] ?? 0,
          policy: policy?.[state] ?? 'N/A'
        }));
      
      case 'policy':
        const policyCounts: Record<string, number> = {};
        mdp.states.forEach(state => {
          const action = policy?.[state] ?? 'N/A';
          policyCounts[action] = (policyCounts[action] || 0) + 1;
        });
        return Object.entries(policyCounts).map(([action, count]) => ({
          action,
          count
        }));
      
      case 'convergence':
        return convergenceHistory?.map((delta, index) => ({
          iteration: index,
          delta: Math.abs(delta)
        })) ?? [];
      
      case 'progress':
        return progressHistory?.map((progress) => ({
          iteration: progress.iteration,
          delta: Math.abs(progress.delta),
          method: progress.method
        })) ?? [];
      
      default:
        return [];
    }
  }, [dataType, mdp.states, valueFunction, policy, convergenceHistory, progressHistory]);

  // Filter data based on selected states
  const filteredData = useMemo(() => {
    if (dataType === 'values' && selectedStates.length > 0) {
      return chartData.filter(item => 'state' in item && selectedStates.includes(item.state));
    }
    return chartData;
  }, [chartData, selectedStates, dataType]);

  const renderChart = () => {
    const commonProps = {
      data: filteredData,
      margin: { top: 20, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={dataType === 'values' ? 'state' : 'iteration'} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Line 
              type="monotone" 
              dataKey={dataType === 'values' ? 'value' : 'delta'} 
              stroke="#8884d8" 
              strokeWidth={2}
            />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={dataType === 'values' ? 'state' : 'iteration'} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Area 
              type="monotone" 
              dataKey={dataType === 'values' ? 'value' : 'delta'} 
              stroke="#8884d8" 
              fill="#8884d8" 
              fillOpacity={0.3}
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={dataType === 'values' ? 'state' : 'iteration'} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Bar 
              dataKey={dataType === 'values' ? 'value' : 'delta'} 
              fill="#8884d8"
            />
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart {...commonProps}>
            <Pie
              data={filteredData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataType === 'values' ? 'value' : 'count'}
            >
              {filteredData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            {showLegend && <Legend />}
          </PieChart>
        );

      case 'scatter':
        return (
          <ScatterChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" />}
            <XAxis dataKey={dataType === 'values' ? 'state' : 'iteration'} />
            <YAxis />
            <Tooltip />
            {showLegend && <Legend />}
            <Scatter fill="#8884d8" />
          </ScatterChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Interactive Charts</h3>
          <p className="text-sm text-gray-600">Zoom, filter, and explore your data</p>
        </div>
        
        {/* Export button */}
        <button
          onClick={() => {
            const canvas = document.querySelector('canvas');
            if (canvas) {
              const link = document.createElement('a');
              link.download = `mdp-chart-${dataType}-${chartType}.png`;
              link.href = canvas.toDataURL();
              link.click();
            }
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Export Chart
        </button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Chart Type</Label>
          <Select value={chartType} onValueChange={(value) => setChartType(value as ChartType)}>
                          <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Line</SelectItem>
              <SelectItem value="area">Area</SelectItem>
              <SelectItem value="bar">Bar</SelectItem>
              <SelectItem value="pie">Pie</SelectItem>
              <SelectItem value="scatter">Scatter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-1">Data Type</Label>
          <Select value={dataType} onValueChange={(value) => setDataType(value as DataType)}>
            <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder="Select data type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="values">Value Function</SelectItem>
              <SelectItem value="policy">Policy Distribution</SelectItem>
              <SelectItem value="convergence">Convergence</SelectItem>
              <SelectItem value="progress">Progress History</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Zoom</label>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-gray-500 mt-1">{zoomLevel.toFixed(1)}x</div>
        </div>

        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Grid</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showLegend}
              onChange={(e) => setShowLegend(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm">Legend</span>
          </label>
        </div>

        {dataType === 'values' && (
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Filter States</Label>
            <Select 
              value={selectedStates[0] || "all"} 
              onValueChange={(value) => setSelectedStates(value === "all" ? [] : [value])}
            >
                          <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder="Select a state" />
            </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {mdp.states.map(state => (
                  <SelectItem key={state} value={state}>{state}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Reset</label>
          <button
            onClick={() => {
              setSelectedStates([]);
              setZoomLevel(1);
              setShowGrid(true);
              setShowLegend(true);
            }}
            className="w-full px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Reset All
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div 
        className="w-full h-96 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-lg"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top left' }}
      >
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() || <div className="flex items-center justify-center h-full text-gray-500">No data available</div>}
        </ResponsiveContainer>
      </div>

      {/* Data Summary */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-2">Data Summary</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Data Points:</span>
            <div className="font-semibold">{filteredData.length}</div>
          </div>
          <div>
            <span className="text-gray-600">Chart Type:</span>
            <div className="font-semibold capitalize">{chartType}</div>
          </div>
          <div>
            <span className="text-gray-600">Zoom Level:</span>
            <div className="font-semibold">{zoomLevel.toFixed(1)}x</div>
          </div>
          <div>
            <span className="text-gray-600">Filtered:</span>
            <div className="font-semibold">
              {selectedStates.length > 0 ? `${selectedStates.length} states` : 'All'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 