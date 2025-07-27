"use client";

import { useState, useEffect } from "react";
import type { MDP } from "@/types/mdp";
import { 
  valueIteration, 
  policyIteration, 
  qLearning, 
  robustOptimizeMDP,
  robustOptimizeMDPConfiguration,
  type OptimizationResult,
  type RobustOptimizationResult,
  type OptimizationConfig
} from "@/lib/optimizer";
import { runMonteCarlo, type MonteCarloSummary } from "@/lib/sim";

interface AgentOptimizerProps {
  mdp: MDP;
  startState: string;
  baselineResult?: MonteCarloSummary;
  onOptimizedMdp?: (mdp: MDP) => void;
}

export default function AgentOptimizer({ mdp, startState, baselineResult: propBaselineResult, onOptimizedMdp }: AgentOptimizerProps) {
  const [algorithm, setAlgorithm] = useState<"value-iteration" | "policy-iteration" | "q-learning" | "configuration" | "robust">("robust");
  const [isRunning, setIsRunning] = useState(false);
  const [baselineResult, setBaselineResult] = useState<MonteCarloSummary | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | RobustOptimizationResult | null>(null);
  const [config, setConfig] = useState<OptimizationConfig>({
    maxIterations: 1000,
    tolerance: 1e-6,
    gamma: mdp.gamma ?? 0.9,
    learningRate: 0.1,
    epsilon: 0.1,
    episodes: 1000
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
    }
  }, [mdp, startState, propBaselineResult]);

  const runOptimization = async () => {
    setIsRunning(true);
    setOptimizationResult(null);

    try {
      let result: OptimizationResult | RobustOptimizationResult;

      switch (algorithm) {
        case "robust":
          result = await robustOptimizeMDP(mdp, startState, config);
          break;
        case "value-iteration":
          result = valueIteration(mdp, config);
          break;
        case "policy-iteration":
          result = policyIteration(mdp, config);
          break;
        case "q-learning":
          result = qLearning(mdp, startState, config);
          break;
        case "configuration":
          const configResult = await robustOptimizeMDPConfiguration(mdp, startState, config);
          result = configResult.bestResult;
          if (onOptimizedMdp) {
            onOptimizedMdp(configResult.bestMdp);
          }
          break;
        default:
          throw new Error("Unknown algorithm");
      }

      setOptimizationResult(result);
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
    <div className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent Optimizer</h2>
        <p className="text-gray-600">
          First runs a baseline Monte Carlo simulation, then optimizes the policy for maximum reward using reinforcement learning algorithms.
        </p>
      </div>

      {/* Loading State */}
      {isRunning && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-800">Running optimization...</span>
          </div>
        </div>
      )}

      {/* Algorithm Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Optimization Algorithm
          </label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as "value-iteration" | "policy-iteration" | "q-learning" | "configuration" | "robust")}
            disabled={isRunning}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
                    <option value="robust">Robust Optimization (Recommended)</option>
        <option value="value-iteration">Value Iteration</option>
        <option value="policy-iteration">Policy Iteration</option>
        <option value="q-learning">Q-Learning</option>
        <option value="configuration">Configuration Optimization</option>
          </select>
        </div>

        {/* Configuration Parameters */}
        <div className="grid grid-cols-2 gap-4">
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
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={runOptimization}
          disabled={isRunning}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? "Optimizing..." : "Run Optimization"}
        </button>
        {optimizationResult && (
          <button
            onClick={evaluatePolicy}
            disabled={isRunning}
            className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Evaluate Policy
          </button>
        )}
      </div>

      {/* Baseline Results */}
      {baselineResult && (
        <div className="bg-blue-50 rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Baseline Performance</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Average Reward:</span>
              <span className="ml-2 text-lg font-bold text-blue-600">
                {baselineResult.avgTotalReward.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Episodes:</span>
              <span className="ml-2 text-lg font-bold text-blue-600">
                {baselineResult.episodes}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Optimization Results */}
      {optimizationResult && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Optimization Results</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Best Value:</span>
              <span className="ml-2 text-lg font-bold text-green-600">
                {optimizationResult.bestValue.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Iterations:</span>
              <span className="ml-2 text-lg font-bold text-blue-600">
                {optimizationResult.iterations}
              </span>
            </div>
            {'actualPerformance' in optimizationResult && (
              <>
                <div>
                  <span className="text-sm font-medium text-gray-600">Actual Performance:</span>
                  <span className="ml-2 text-lg font-bold text-purple-600">
                    {optimizationResult.actualPerformance.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Confidence:</span>
                  <span className="ml-2 text-lg font-bold text-blue-600">
                    {(optimizationResult.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Method Used:</span>
                  <span className="ml-2 text-lg font-bold text-orange-600">
                    {optimizationResult.method}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Improvement Comparison */}
          {baselineResult && (
            <div className="bg-white rounded border p-3">
              <h4 className="text-md font-semibold text-gray-800 mb-2">Performance Improvement</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Baseline:</span>
                  <span className="ml-2 text-lg font-bold text-blue-600">
                    {baselineResult.avgTotalReward.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-600">Optimized:</span>
                  <span className="ml-2 text-lg font-bold text-green-600">
                    {optimizationResult.bestValue.toFixed(4)}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-sm font-medium text-gray-600">Improvement:</span>
                  <span className={`ml-2 text-lg font-bold ${
                    optimizationResult.bestValue > baselineResult.avgTotalReward 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {((optimizationResult.bestValue - baselineResult.avgTotalReward) / baselineResult.avgTotalReward * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Optimal Policy */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-2">Optimal Policy</h4>
            <div className="bg-white rounded border p-3 max-h-40 overflow-y-auto">
              {Object.entries(optimizationResult.bestPolicy).map(([state, action]) => (
                <div key={state} className="flex justify-between py-1">
                  <span className="font-mono text-sm">{state}</span>
                  <span className="font-mono text-sm text-blue-600">→</span>
                  <span className="font-mono text-sm font-semibold">{action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Value Function */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-2">Value Function</h4>
            <div className="bg-white rounded border p-3 max-h-40 overflow-y-auto">
              {Object.entries(optimizationResult.valueFunction).map(([state, value]) => (
                <div key={state} className="flex justify-between py-1">
                  <span className="font-mono text-sm">{state}</span>
                  <span className="font-mono text-sm font-semibold text-green-600">
                    {value.toFixed(4)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Validation Results for Robust Optimization */}
          {'validationResults' in optimizationResult && (
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">Validation Results</h4>
              <div className="bg-white rounded border p-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-600">Success Rate:</span>
                    <span className="ml-2 text-sm font-bold text-green-600">
                      {(optimizationResult.validationResults.successRate * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Path Efficiency:</span>
                    <span className="ml-2 text-sm font-bold text-blue-600">
                      {optimizationResult.validationResults.pathEfficiency.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Standard Deviation:</span>
                    <span className="ml-2 text-sm font-bold text-orange-600">
                      {optimizationResult.validationResults.mcStdDev.toFixed(4)}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-600">Monte Carlo Reward:</span>
                    <span className="ml-2 text-sm font-bold text-purple-600">
                      {optimizationResult.validationResults.mcReward.toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Convergence History */}
          {optimizationResult.convergenceHistory.length > 0 && (
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-2">Convergence History</h4>
              <div className="bg-white rounded border p-3">
                <div className="h-32 flex items-end space-x-1">
                  {optimizationResult.convergenceHistory.slice(-50).map((value, index) => (
                    <div
                      key={index}
                      className="bg-blue-500 flex-1"
                      style={{
                        height: `${Math.max(1, (value / Math.max(...optimizationResult.convergenceHistory)) * 100)}%`
                      }}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  Last 50 iterations (max: {Math.max(...optimizationResult.convergenceHistory).toFixed(6)})
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Policy Evaluation Results */}
      {evaluationResult && (
        <div className="bg-green-50 rounded-lg p-4 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Policy Evaluation Results</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-600">Average Reward:</span>
              <span className="ml-2 text-lg font-bold text-green-600">
                {evaluationResult.avgTotalReward.toFixed(4)}
              </span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600">Episodes:</span>
              <span className="ml-2 text-lg font-bold text-green-600">
                {evaluationResult.episodes}
              </span>
            </div>
          </div>

          {/* Comparison with Baseline and Optimization */}
          {baselineResult && optimizationResult && (
            <div className="bg-white rounded border p-3">
              <h4 className="text-md font-semibold text-gray-800 mb-2">Performance Comparison</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Baseline (Random):</span>
                  <span className="text-sm font-bold text-blue-600">
                    {baselineResult.avgTotalReward.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Theoretical Optimal:</span>
                  <span className="text-sm font-bold text-purple-600">
                    {optimizationResult.bestValue.toFixed(4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Actual Performance:</span>
                  <span className="text-sm font-bold text-green-600">
                    {evaluationResult.avgTotalReward.toFixed(4)}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Improvement over Random:</span>
                    <span className={`text-sm font-bold ${
                      evaluationResult.avgTotalReward > baselineResult.avgTotalReward 
                        ? 'text-green-600' 
                        : 'text-red-600'
                    }`}>
                      {((evaluationResult.avgTotalReward - baselineResult.avgTotalReward) / baselineResult.avgTotalReward * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Gap to Optimal:</span>
                    <span className={`text-sm font-bold ${
                      evaluationResult.avgTotalReward >= optimizationResult.bestValue * 0.95
                        ? 'text-green-600' 
                        : 'text-orange-600'
                    }`}>
                      {((optimizationResult.bestValue - evaluationResult.avgTotalReward) / optimizationResult.bestValue * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Terminal Distribution */}
          <div>
            <h4 className="text-md font-semibold text-gray-800 mb-2">Terminal State Distribution</h4>
            <div className="bg-white rounded border p-3">
              <div className="space-y-1">
                {Object.entries(evaluationResult.terminalDist).map(([state, count]) => (
                  <div key={state} className="flex justify-between text-sm">
                    <span className="font-mono">{state}</span>
                    <span className="font-medium">{count} ({(count / evaluationResult.episodes * 100).toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 