"use client";

import { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { MDP } from '@/types/mdp';
import { 
  valueIteration, 
  policyIteration, 
  qLearning,
  sarsa,
  actorCritic,
  tdLambda,
  type OptimizationResult,
  type OptimizationConfig
} from '@/lib/optimizer';

interface MultiObjectiveOptimizerProps {
  mdp: MDP;
  startState: string;
  onOptimizationComplete?: (results: MultiObjectiveResult[]) => void;
}

interface MultiObjectiveResult {
  config: OptimizationConfig;
  result: OptimizationResult;
  metrics: {
    value: number;
    convergence: number;
    efficiency: number;
    robustness: number;
    complexity: number;
  };
  paretoRank: number;
}

interface ObjectiveWeights {
  value: number;
  convergence: number;
  efficiency: number;
  robustness: number;
  complexity: number;
}

export default function MultiObjectiveOptimizer({
  mdp,
  startState,
  onOptimizationComplete
}: MultiObjectiveOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentIteration, setCurrentIteration] = useState(0);
  const [results, setResults] = useState<MultiObjectiveResult[]>([]);
  const [weights, setWeights] = useState<ObjectiveWeights>({
    value: 0.4,
    convergence: 0.2,
    efficiency: 0.2,
    robustness: 0.1,
    complexity: 0.1
  });

  const calculateMetrics = useCallback((result: OptimizationResult): MultiObjectiveResult['metrics'] => {
    const value = result.bestValue;
    const convergence = -result.iterations; // Lower is better
    const efficiency = result.bestValue / Math.max(1, result.iterations);
    const robustness = 1 / (1 + Math.abs(result.convergenceHistory?.[result.convergenceHistory.length - 1] ?? 0));
    const complexity = -Object.keys(result.bestPolicy).length; // Simpler policies are better
    
    return {
      value,
      convergence,
      efficiency,
      robustness,
      complexity
    };
  }, []);

  const isParetoOptimal = useCallback((candidate: MultiObjectiveResult, allResults: MultiObjectiveResult[]): boolean => {
    return !allResults.some(other => {
      // Check if 'other' dominates 'candidate' in all objectives
      const dominates = (
        other.metrics.value >= candidate.metrics.value &&
        other.metrics.convergence >= candidate.metrics.convergence &&
        other.metrics.efficiency >= candidate.metrics.efficiency &&
        other.metrics.robustness >= candidate.metrics.robustness &&
        other.metrics.complexity >= candidate.metrics.complexity &&
        (
          other.metrics.value > candidate.metrics.value ||
          other.metrics.convergence > candidate.metrics.convergence ||
          other.metrics.efficiency > candidate.metrics.efficiency ||
          other.metrics.robustness > candidate.metrics.robustness ||
          other.metrics.complexity > candidate.metrics.complexity
        )
      );
      return dominates;
    });
  }, []);

  const generateConfig = useCallback((): OptimizationConfig => {
    return {
      gamma: 0.7 + Math.random() * 0.3,
      learningRate: 0.01 + Math.random() * 0.19,
      epsilon: 0.1 + Math.random() * 0.2,
      episodes: 500 + Math.floor(Math.random() * 1000),
      lambda: 0.5 + Math.random() * 0.5,
      maxIterations: 100 + Math.floor(Math.random() * 900),
      tolerance: 1e-6 + Math.random() * 1e-4
    };
  }, []);

  const runOptimization = useCallback(async (config: OptimizationConfig): Promise<OptimizationResult> => {
    const algorithms = [
      () => valueIteration(mdp, config),
      () => policyIteration(mdp, config),
      () => qLearning(mdp, startState, config),
      () => sarsa(mdp, startState, config),
      () => actorCritic(mdp, startState, config),
      () => tdLambda(mdp, startState, config)
    ];
    const algorithm = algorithms[Math.floor(Math.random() * algorithms.length)];
    
    return algorithm();
  }, [mdp, startState]);

  const startOptimization = async () => {
    setIsOptimizing(true);
    setCurrentIteration(0);
    setResults([]);

    const maxIterations = 50;
    const newResults: MultiObjectiveResult[] = [];

    for (let i = 0; i < maxIterations; i++) {
      setCurrentIteration(i + 1);
      
      const config = generateConfig();
      const result = await runOptimization(config);
      const metrics = calculateMetrics(result);
      
      const multiResult: MultiObjectiveResult = {
        config,
        result,
        metrics,
        paretoRank: 0
      };
      
      newResults.push(multiResult);
      setResults([...newResults]);
      
      // Calculate Pareto ranks
      newResults.forEach((r, index) => {
        const paretoRank = isParetoOptimal(r, newResults) ? 1 : 2;
        newResults[index] = { ...r, paretoRank };
      });
      
      // Small delay for UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsOptimizing(false);
    onOptimizationComplete?.(newResults);
  };

  const stopOptimization = () => {
    setIsOptimizing(false);
  };

  const calculateWeightedScore = useCallback((result: MultiObjectiveResult): number => {
    return (
      result.metrics.value * weights.value +
      result.metrics.convergence * weights.convergence +
      result.metrics.efficiency * weights.efficiency +
      result.metrics.robustness * weights.robustness +
      result.metrics.complexity * weights.complexity
    );
  }, [weights]);

  const paretoOptimalResults = results.filter(r => r.paretoRank === 1);
  const sortedResults = [...results].sort((a, b) => calculateWeightedScore(b) - calculateWeightedScore(a));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Multi-Objective Optimization</h3>
          <p className="text-sm text-gray-600">Balance multiple performance metrics</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={startOptimization}
            disabled={isOptimizing}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isOptimizing ? 'Optimizing...' : 'Start Optimization'}
          </button>
          
          {isOptimizing && (
            <button
              onClick={stopOptimization}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Objective Weights */}
      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-3">Objective Weights</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(weights).map(([key, value]) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">
                {key} Weight
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={value}
                onChange={(e) => setWeights(prev => ({
                  ...prev,
                  [key]: parseFloat(e.target.value)
                }))}
                disabled={isOptimizing}
                className="w-full"
              />
              <div className="text-xs text-gray-500 mt-1">{value.toFixed(1)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      {isOptimizing && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Iteration: {currentIteration} / 50</span>
            <span>{Math.round((currentIteration / 50) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentIteration / 50) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Pareto Optimal Solutions</h4>
            <div className="text-2xl font-bold text-blue-600">{paretoOptimalResults.length}</div>
            <div className="text-sm text-blue-600">out of {results.length} total</div>
          </div>
          
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Best Weighted Score</h4>
            <div className="text-2xl font-bold text-green-600">
              {sortedResults[0] ? calculateWeightedScore(sortedResults[0]).toFixed(4) : 'N/A'}
            </div>
            <div className="text-sm text-green-600">with current weights</div>
          </div>
        </div>
      )}

      {/* Pareto Frontier Chart */}
      {results.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Pareto Frontier</h4>
          <div className="h-64 bg-white rounded-lg shadow-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={paretoOptimalResults}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metrics.value" name="Value" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="metrics.convergence" 
                  stroke="#8884d8" 
                  name="Convergence"
                />
                <Line 
                  type="monotone" 
                  dataKey="metrics.efficiency" 
                  stroke="#82ca9d" 
                  name="Efficiency"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Top Results */}
      {results.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Top Solutions</h4>
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-1 gap-2">
              {sortedResults.slice(0, 10).map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border text-sm ${
                    result.paretoRank === 1 
                      ? 'bg-purple-50 border-purple-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">#{index + 1}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      result.paretoRank === 1 
                        ? 'bg-purple-100 text-purple-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {result.paretoRank === 1 ? 'Pareto Optimal' : 'Dominated'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <div>
                      <span className="text-gray-600">Value:</span>
                      <div className="font-mono">{result.metrics.value.toFixed(3)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Conv:</span>
                      <div className="font-mono">{result.metrics.convergence.toFixed(0)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Efficiency:</span>
                      <div className="font-mono">{result.metrics.efficiency.toFixed(3)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Robust:</span>
                      <div className="font-mono">{result.metrics.robustness.toFixed(3)}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Complex:</span>
                      <div className="font-mono">{result.metrics.complexity.toFixed(0)}</div>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    Gamma: {result.config.gamma?.toFixed(3) ?? 'N/A'} | 
                    LR: {result.config.learningRate?.toFixed(3) ?? 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isOptimizing && results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎯</div>
          <p>Ready to start multi-objective optimization</p>
          <p className="text-sm">Adjust weights and click &quot;Start Optimization&quot;</p>
        </div>
      )}
    </div>
  );
} 