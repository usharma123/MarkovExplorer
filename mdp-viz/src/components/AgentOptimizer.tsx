"use client";

import { useState, useEffect, useCallback } from "react";
import type { MDP } from "@/types/mdp";
import { 
  valueIteration, 
  policyIteration, 
  qLearning,
  sarsa,
  actorCritic,
  tdLambda,
  robustOptimizeMDP,
  robustOptimizeMDPConfiguration,
  type OptimizationResult,
  type RobustOptimizationResult,
  type OptimizationConfig,
  type OptimizationProgress
} from "@/lib/optimizer";
import { runMonteCarlo, type MonteCarloSummary } from "@/lib/sim";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AgentOptimizerProps {
  mdp: MDP;
  startState: string;
  baselineResult?: MonteCarloSummary;
  onOptimizedMdp?: (mdp: MDP) => void;
  onOptimizationComplete?: (result: OptimizationResult | RobustOptimizationResult) => void;
}

export default function AgentOptimizer({ mdp, startState, baselineResult: propBaselineResult, onOptimizedMdp, onOptimizationComplete }: AgentOptimizerProps) {
  const [algorithm, setAlgorithm] = useState<"value-iteration" | "policy-iteration" | "q-learning" | "sarsa" | "actor-critic" | "td-lambda" | "configuration" | "robust">("robust");
  const [isRunning, setIsRunning] = useState(false);
  const [baselineResult, setBaselineResult] = useState<MonteCarloSummary | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | RobustOptimizationResult | null>(null);
  const [progressHistory, setProgressHistory] = useState<OptimizationProgress[]>([]);
  const [config, setConfig] = useState<OptimizationConfig>({
    maxIterations: 1000,
    tolerance: 1e-6,
    gamma: mdp.gamma ?? 0.9,
    learningRate: 0.1,
    epsilon: 0.1,
    episodes: 1000,
    lambda: 0.7
  });

  // Use the baseline result from props or run our own if not provided
  useEffect(() => {
    if (mdp && startState) {
      if (propBaselineResult) {
        setBaselineResult(propBaselineResult);
      } else {
        // Fallback: run our own baseline if not provided
        const baseline = runMonteCarlo(mdp, startState, 1000, 100);
        setBaselineResult(baseline);
      }
      setOptimizationResult(null);
      setProgressHistory([]);
    }
  }, [mdp, startState, propBaselineResult]);

  const handleProgress = useCallback((progress: OptimizationProgress) => {
    setProgressHistory(prev => [...prev, progress]);
  }, []);

  const runOptimization = async () => {
    setIsRunning(true);
    setOptimizationResult(null);
    setProgressHistory([]);

    try {
      let result: OptimizationResult | RobustOptimizationResult;

      switch (algorithm) {
        case "robust":
          result = await robustOptimizeMDP(mdp, startState, config, {
            onProgress: handleProgress
          });
          break;
        case "value-iteration":
          result = valueIteration(mdp, config, {
            onProgress: handleProgress
          });
          break;
        case "policy-iteration":
          result = policyIteration(mdp, config, {
            onProgress: handleProgress
          });
          break;
        case "q-learning":
          result = qLearning(mdp, startState, config, {
            onProgress: handleProgress
          });
          break;
        case "sarsa":
          result = sarsa(mdp, startState, config, {
            onProgress: handleProgress
          });
          break;
        case "actor-critic":
          result = actorCritic(mdp, startState, config, {
            onProgress: handleProgress
          });
          break;
        case "td-lambda":
          result = tdLambda(mdp, startState, config, {
            onProgress: handleProgress
          });
          break;
        case "configuration":
          const configResult = await robustOptimizeMDPConfiguration(mdp, startState, config, {
            onProgress: handleProgress
          });
          result = configResult.bestResult;
          if (onOptimizedMdp) {
            onOptimizedMdp(configResult.bestMdp);
          }
          break;
        default:
          throw new Error("Unknown algorithm");
      }

      setOptimizationResult(result);
      onOptimizationComplete?.(result);
    } catch (error) {
      console.error("Optimization failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  const [evaluationResult, setEvaluationResult] = useState<MonteCarloSummary | null>(null);

  const evaluatePolicy = async () => {
    if (!optimizationResult) return;

    setIsRunning(true);
    try {
      // Create an MDP that follows the optimized policy
      const policyMdp = {
        ...mdp,
        transitions: Object.fromEntries(
          Object.entries(mdp.transitions).map(([key, transitions]) => {
            const [state, action] = key.split("|");
            const optimalAction = optimizationResult.bestPolicy[state];
            
            // If this is the optimal action for this state, keep the transitions
            // Otherwise, set probability to 0 (the policy won't choose this action)
            if (action === optimalAction) {
              return [key, transitions];
            } else {
              return [key, transitions.map(t => ({ ...t, probability: 0 }))];
            }
          })
        )
      };

      const mcResult = runMonteCarlo(policyMdp, startState, 1000, 100);
      setEvaluationResult(mcResult);
    } catch (error) {
      console.error("Evaluation failed:", error);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">Agent Optimization</h3>
        <p className="text-sm text-gray-600">Optimize your MDP using various reinforcement learning algorithms</p>
      </div>

      {/* Algorithm Selection */}
      <div className="mb-6">
        <Label className="block text-sm font-medium text-gray-700 mb-2">
          Optimization Algorithm
        </Label>
        <Select
          value={algorithm}
          onValueChange={(value) => setAlgorithm(value as "value-iteration" | "policy-iteration" | "q-learning" | "sarsa" | "actor-critic" | "td-lambda" | "configuration" | "robust")}
          disabled={isRunning}
        >
                      <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50">
            <SelectValue placeholder="Select an algorithm" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="robust">Robust Optimization (Recommended)</SelectItem>
            <SelectItem value="value-iteration">Value Iteration</SelectItem>
            <SelectItem value="policy-iteration">Policy Iteration</SelectItem>
            <SelectItem value="q-learning">Q-Learning</SelectItem>
            <SelectItem value="sarsa">SARSA</SelectItem>
            <SelectItem value="actor-critic">Actor-Critic</SelectItem>
            <SelectItem value="td-lambda">TD(λ)</SelectItem>
            <SelectItem value="configuration">Configuration Optimization</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Configuration Parameters */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Iterations
          </label>
          <input
            type="number"
            value={config.maxIterations}
            onChange={(e) => setConfig({ ...config, maxIterations: parseInt(e.target.value) })}
            disabled={isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tolerance
          </label>
          <input
            type="number"
            step="0.000001"
            value={config.tolerance}
            onChange={(e) => setConfig({ ...config, tolerance: parseFloat(e.target.value) })}
            disabled={isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Gamma (Discount Factor)
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={config.gamma}
            onChange={(e) => setConfig({ ...config, gamma: parseFloat(e.target.value) })}
            disabled={isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
        {algorithm === "q-learning" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Learning Rate
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={config.learningRate}
                onChange={(e) => setConfig({ ...config, learningRate: parseFloat(e.target.value) })}
                disabled={isRunning}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Epsilon (Exploration)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={config.epsilon}
                onChange={(e) => setConfig({ ...config, epsilon: parseFloat(e.target.value) })}
                disabled={isRunning}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Episodes
              </label>
              <input
                type="number"
                value={config.episodes}
                onChange={(e) => setConfig({ ...config, episodes: parseInt(e.target.value) })}
                disabled={isRunning}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </>
        )}
        {algorithm === "sarsa" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Learning Rate
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={config.learningRate}
                onChange={(e) => setConfig({ ...config, learningRate: parseFloat(e.target.value) })}
                disabled={isRunning}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Epsilon (Exploration)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={config.epsilon}
                onChange={(e) => setConfig({ ...config, epsilon: parseFloat(e.target.value) })}
                disabled={isRunning}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Episodes
              </label>
              <input
                type="number"
                value={config.episodes}
                onChange={(e) => setConfig({ ...config, episodes: parseInt(e.target.value) })}
                disabled={isRunning}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </>
        )}
        {algorithm === "actor-critic" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Learning Rate
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={config.learningRate}
                onChange={(e) => setConfig({ ...config, learningRate: parseFloat(e.target.value) })}
                disabled={isRunning}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Episodes
              </label>
              <input
                type="number"
                value={config.episodes}
                onChange={(e) => setConfig({ ...config, episodes: parseInt(e.target.value) })}
                disabled={isRunning}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </>
        )}
        {algorithm === "td-lambda" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Learning Rate
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={config.learningRate}
                onChange={(e) => setConfig({ ...config, learningRate: parseFloat(e.target.value) })}
                disabled={isRunning}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Episodes
              </label>
              <input
                type="number"
                value={config.episodes}
                onChange={(e) => setConfig({ ...config, episodes: parseInt(e.target.value) })}
                disabled={isRunning}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lambda (TD(λ))
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={config.lambda}
                onChange={(e) => setConfig({ ...config, lambda: parseFloat(e.target.value) })}
                disabled={isRunning}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>
          </>
        )}
      </div>

      {/* Real-time Progress Chart */}
      {progressHistory.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Optimization Progress</h4>
          <div className="h-64 bg-white rounded-lg shadow-lg p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="iteration" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="delta" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Convergence Delta"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={runOptimization}
          disabled={isRunning}
          className={`px-6 py-3 rounded-lg text-white transition-all duration-200 shadow-sm hover:shadow-md ${
            isRunning 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <span className="flex items-center gap-2">
            {isRunning ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Optimizing...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Run Optimization
              </>
            )}
          </span>
        </button>

        {optimizationResult && (
          <button
            onClick={evaluatePolicy}
            disabled={isRunning}
            className={`px-6 py-3 rounded-lg text-white transition-all duration-200 shadow-sm hover:shadow-md ${
              isRunning 
                ? "bg-gray-400 cursor-not-allowed" 
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Evaluate Policy
            </span>
          </button>
        )}
      </div>

      {/* Results Display */}
      {optimizationResult && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Optimization Results</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Method</div>
              <div className="text-lg font-bold text-gray-800">
                {('method' in optimizationResult) ? optimizationResult.method : algorithm}
              </div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Best Value</div>
              <div className="text-lg font-bold text-gray-800">{optimizationResult.bestValue.toFixed(3)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Iterations</div>
              <div className="text-lg font-bold text-gray-800">{optimizationResult.iterations}</div>
            </div>
            {('confidence' in optimizationResult) && (
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Confidence</div>
                <div className="text-lg font-bold text-gray-800">{(optimizationResult.confidence * 100).toFixed(1)}%</div>
              </div>
            )}
          </div>

          {/* Policy Display */}
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-700 mb-2">Optimal Policy</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(optimizationResult.bestPolicy).map(([state, action]) => (
                <div key={state} className="flex justify-between">
                  <span className="font-mono">{state}:</span>
                  <span className="font-medium">{action}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Results */}
      {evaluationResult && (
        <div className="mt-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Policy Evaluation Results</h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Avg Reward</div>
              <div className="text-lg font-bold text-gray-800">{evaluationResult.avgTotalReward.toFixed(3)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Avg Steps</div>
              <div className="text-lg font-bold text-gray-800">{evaluationResult.avgSteps.toFixed(1)}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Episodes</div>
              <div className="text-lg font-bold text-gray-800">{evaluationResult.episodes}</div>
            </div>
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Path Length</div>
              <div className="text-lg font-bold text-gray-800">{evaluationResult.pathAnalysis.avgPathLength.toFixed(1)}</div>
            </div>
          </div>

          {/* Comparison with Baseline */}
          {baselineResult && (
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-700 mb-2">Performance Comparison</div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs text-gray-600">Baseline Avg Reward</div>
                  <div className="font-bold">{baselineResult.avgTotalReward.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Optimized Avg Reward</div>
                  <div className="font-bold">{evaluationResult.avgTotalReward.toFixed(3)}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-600">Improvement</div>
                  <div className={`font-bold ${evaluationResult.avgTotalReward > baselineResult.avgTotalReward ? 'text-green-600' : 'text-red-600'}`}>
                    {((evaluationResult.avgTotalReward - baselineResult.avgTotalReward) / baselineResult.avgTotalReward * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 