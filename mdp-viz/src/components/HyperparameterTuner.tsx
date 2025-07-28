"use client";

import { useState, useCallback } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface HyperparameterTunerProps {
  mdp: MDP;
  startState: string;
  onTuningComplete?: (bestConfig: OptimizationConfig, bestResult: OptimizationResult) => void;
}

interface TuningResult {
  config: OptimizationConfig;
  result: OptimizationResult;
  score: number;
}

type AlgorithmType = 'value-iteration' | 'policy-iteration' | 'q-learning' | 'sarsa' | 'actor-critic' | 'td-lambda';

interface TuningConfig {
  algorithm: AlgorithmType;
  parameterRanges: {
    gamma?: [number, number, number]; // [min, max, step]
    learningRate?: [number, number, number];
    epsilon?: [number, number, number];
    episodes?: [number, number, number];
    lambda?: [number, number, number];
    maxIterations?: [number, number, number];
    tolerance?: [number, number, number];
  };
  maxTrials: number;
  optimizationMetric: 'value' | 'convergence' | 'efficiency';
}

export default function HyperparameterTuner({
  mdp,
  startState,
  onTuningComplete
}: HyperparameterTunerProps) {
  const [isTuning, setIsTuning] = useState(false);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [bestResult, setBestResult] = useState<TuningResult | null>(null);
  const [tuningHistory, setTuningHistory] = useState<TuningResult[]>([]);
  const [tuningConfig, setTuningConfig] = useState<TuningConfig>({
    algorithm: 'value-iteration',
    parameterRanges: {
      gamma: [0.7, 0.99, 0.05],
      maxIterations: [100, 1000, 100],
      tolerance: [1e-6, 1e-4, 1e-6]
    },
    maxTrials: 20,
    optimizationMetric: 'value'
  });

  const calculateScore = useCallback((result: OptimizationResult, metric: string): number => {
    switch (metric) {
      case 'value':
        return result.bestValue;
      case 'convergence':
        // Lower convergence time is better
        return -result.iterations;
      case 'efficiency':
        // Balance between value and iterations
        return result.bestValue / Math.max(1, result.iterations);
      default:
        return result.bestValue;
    }
  }, []);

  const generateRandomConfig = useCallback((): OptimizationConfig => {
    const config: OptimizationConfig = {};
    
    if (tuningConfig.parameterRanges.gamma) {
      const [min, max] = tuningConfig.parameterRanges.gamma;
      config.gamma = min + Math.random() * (max - min);
    }
    
    if (tuningConfig.parameterRanges.learningRate) {
      const [min, max] = tuningConfig.parameterRanges.learningRate;
      config.learningRate = min + Math.random() * (max - min);
    }
    
    if (tuningConfig.parameterRanges.epsilon) {
      const [min, max] = tuningConfig.parameterRanges.epsilon;
      config.epsilon = min + Math.random() * (max - min);
    }
    
    if (tuningConfig.parameterRanges.episodes) {
      const [min, max] = tuningConfig.parameterRanges.episodes;
      config.episodes = Math.floor(min + Math.random() * (max - min));
    }
    
    if (tuningConfig.parameterRanges.lambda) {
      const [min, max] = tuningConfig.parameterRanges.lambda;
      config.lambda = min + Math.random() * (max - min);
    }
    
    if (tuningConfig.parameterRanges.maxIterations) {
      const [min, max] = tuningConfig.parameterRanges.maxIterations;
      config.maxIterations = Math.floor(min + Math.random() * (max - min));
    }
    
    if (tuningConfig.parameterRanges.tolerance) {
      const [min, max] = tuningConfig.parameterRanges.tolerance;
      config.tolerance = min + Math.random() * (max - min);
    }
    
    return config;
  }, [tuningConfig]);

  const runOptimization = useCallback(async (config: OptimizationConfig): Promise<OptimizationResult> => {
    switch (tuningConfig.algorithm) {
      case 'value-iteration':
        return valueIteration(mdp, config);
      case 'policy-iteration':
        return policyIteration(mdp, config);
      case 'q-learning':
        return qLearning(mdp, startState, config);
      case 'sarsa':
        return sarsa(mdp, startState, config);
      case 'actor-critic':
        return actorCritic(mdp, startState, config);
      case 'td-lambda':
        return tdLambda(mdp, startState, config);
      default:
        return valueIteration(mdp, config);
    }
  }, [mdp, startState, tuningConfig.algorithm]);

  const startTuning = async () => {
    setIsTuning(true);
    setCurrentTrial(0);
    setBestResult(null);
    setTuningHistory([]);

    for (let trial = 0; trial < tuningConfig.maxTrials; trial++) {
      setCurrentTrial(trial + 1);
      
      const config = generateRandomConfig();
      const result = await runOptimization(config);
      const score = calculateScore(result, tuningConfig.optimizationMetric);
      
      const tuningResult: TuningResult = {
        config,
        result,
        score
      };
      
      setTuningHistory(prev => [...prev, tuningResult]);
      
      if (!bestResult || score > bestResult.score) {
        setBestResult(tuningResult);
      }
      
      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    setIsTuning(false);
    
    if (bestResult) {
      onTuningComplete?.(bestResult.config, bestResult.result);
    }
  };

  const stopTuning = () => {
    setIsTuning(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Hyperparameter Tuning</h3>
          <p className="text-sm text-gray-600">Automatically find optimal parameters</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={startTuning}
            disabled={isTuning}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isTuning ? 'Tuning...' : 'Start Tuning'}
          </button>
          
          {isTuning && (
            <button
              onClick={stopTuning}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">Algorithm</Label>
          <Select
            value={tuningConfig.algorithm}
            onValueChange={(value) => setTuningConfig(prev => ({
              ...prev,
              algorithm: value as AlgorithmType
            }))}
            disabled={isTuning}
          >
            <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder="Select algorithm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value-iteration">Value Iteration</SelectItem>
              <SelectItem value="policy-iteration">Policy Iteration</SelectItem>
              <SelectItem value="q-learning">Q-Learning</SelectItem>
              <SelectItem value="sarsa">SARSA</SelectItem>
              <SelectItem value="actor-critic">Actor-Critic</SelectItem>
              <SelectItem value="td-lambda">TD(λ)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="block text-sm font-medium text-gray-700 mb-2">Optimization Metric</Label>
          <Select
            value={tuningConfig.optimizationMetric}
            onValueChange={(value) => setTuningConfig(prev => ({
              ...prev,
              optimizationMetric: value as 'value' | 'convergence' | 'efficiency'
            }))}
            disabled={isTuning}
          >
            <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <SelectValue placeholder="Select metric" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="value">Best Value</SelectItem>
              <SelectItem value="convergence">Fastest Convergence</SelectItem>
              <SelectItem value="efficiency">Value/Iteration Ratio</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Trials</label>
          <input
            type="number"
            min="5"
            max="100"
            value={tuningConfig.maxTrials}
            onChange={(e) => setTuningConfig(prev => ({
              ...prev,
              maxTrials: parseInt(e.target.value)
            }))}
            disabled={isTuning}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Progress */}
      {isTuning && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Trial: {currentTrial} / {tuningConfig.maxTrials}</span>
            <span>{Math.round((currentTrial / tuningConfig.maxTrials) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentTrial / tuningConfig.maxTrials) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Best Result */}
      {bestResult && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-800 mb-2">Best Configuration Found</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Best Value:</span>
              <div className="font-semibold text-green-600">{bestResult.result.bestValue.toFixed(4)}</div>
            </div>
            <div>
              <span className="text-gray-600">Iterations:</span>
              <div className="font-semibold">{bestResult.result.iterations}</div>
            </div>
            <div>
              <span className="text-gray-600">Score:</span>
              <div className="font-semibold text-blue-600">{bestResult.score.toFixed(4)}</div>
            </div>
            <div>
              <span className="text-gray-600">Gamma:</span>
              <div className="font-semibold">{bestResult.config.gamma?.toFixed(3) ?? 'N/A'}</div>
            </div>
          </div>
          
          <details className="mt-3">
            <summary className="cursor-pointer text-sm text-green-700 font-medium">
              View Full Configuration
            </summary>
            <pre className="mt-2 text-xs bg-white p-2 rounded border overflow-x-auto">
              {JSON.stringify(bestResult.config, null, 2)}
            </pre>
          </details>
        </div>
      )}

      {/* Tuning History */}
      {tuningHistory.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Tuning History</h4>
          <div className="max-h-64 overflow-y-auto">
            <div className="grid grid-cols-1 gap-2">
              {tuningHistory.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded-lg border text-sm ${
                    result === bestResult 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono">Trial {index + 1}</span>
                    <span className={`font-semibold ${
                      result === bestResult ? 'text-green-600' : 'text-gray-600'
                    }`}>
                      Score: {result.score.toFixed(4)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Value: {result.result.bestValue.toFixed(4)} | 
                    Iterations: {result.result.iterations} | 
                    Gamma: {result.config.gamma?.toFixed(3) ?? 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!isTuning && tuningHistory.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🔧</div>
          <p>Ready to start hyperparameter tuning</p>
          <p className="text-sm">Configure parameters and click &quot;Start Tuning&quot;</p>
        </div>
      )}
    </div>
  );
} 