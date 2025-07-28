"use client";

import { useMemo, useState, useCallback } from "react";
import MDPGraph from "@/components/MDPGraph";
import DistributionChart from "@/components/DistributionChart";
import TerminalPie from "@/components/TerminalPie";
import MDPConfigurator from "@/components/MDPConfigurator";
import PresetSelector from "@/components/PresetSelector";
import ResultsInterpreter from "@/components/ResultsInterpreter";
import AgentOptimizer from "@/components/AgentOptimizer";
import InteractiveCharts from "@/components/InteractiveCharts";
import HyperparameterTuner from "@/components/HyperparameterTuner";
import MultiObjectiveOptimizer from "@/components/MultiObjectiveOptimizer";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { type MDP } from "@/types/mdp";
import { type PresetExample } from "@/lib/presets";
import { runMonteCarlo } from "@/lib/sim";
import { type OptimizationResult, type RobustOptimizationResult } from "@/lib/optimizer";

export default function Home() {
  const [mdp, setMdp] = useState<MDP | null>(null);
  const [start, setStart] = useState("S0");
  const [episodes, setEpisodes] = useState(1000);
  const [maxSteps, setMaxSteps] = useState(100);
  const [bins, setBins] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof runMonteCarlo> | null>(null);
  const [loadedPreset, setLoadedPreset] = useState<string | null>(null);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | RobustOptimizationResult | null>(null);

  const canSim = Boolean(mdp && mdp.states.includes(start));

  const handleMDPChange = useCallback((newMdp: MDP | null) => {
    console.log("Page: Received MDP change", newMdp);
    setError(null);
    setResult(null);
    setMdp(newMdp);
    if (newMdp && !newMdp.states.includes(start)) {
      setStart(newMdp.states[0]);
    }
    // Clear loaded preset when user modifies the configuration
    if (newMdp && loadedPreset) {
      setLoadedPreset(null);
    }
  }, [start, loadedPreset]);

  const handleLoadPreset = useCallback((preset: PresetExample) => {
    console.log("Page: Loading preset", preset.name);
    setError(null);
    setResult(null);
    setMdp(preset.mdp);
    setStart(preset.mdp.states[0]);
    setLoadedPreset(preset.name);
  }, []);

  const handleOptimizedMdp = useCallback((optimizedMdp: MDP) => {
    console.log("Page: Received optimized MDP", optimizedMdp);
    setMdp(optimizedMdp);
    setLoadedPreset(null);
  }, []);

  function handleSim() {
    if (!mdp) return;
    setResult(runMonteCarlo(mdp, start, episodes, maxSteps));
  }

  const terminalPretty = useMemo(() => {
    if (!result?.terminalDist) return "";
    const total = result.episodes ?? 1;
    return Object.entries(result.terminalDist)
      .map(([s, c]) => `${s}: ${(100 * (c as number) / total).toFixed(1)}%`)
      .join("  |  ");
  }, [result]);

  const topTransitions = useMemo(() => {
    if (!result?.transitionCounts) return [];
    return Object.entries(result.transitionCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([transition, count]) => ({ transition, count }));
  }, [result]);

  const topActions = useMemo(() => {
    if (!result?.actionCounts) return [];
    return Object.entries(result.actionCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([action, count]) => ({ action, count }));
  }, [result]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Markov Decision Process Explorer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Visualize, simulate, and optimize Markov Decision Processes with advanced reinforcement learning algorithms
          </p>
        </div>

        <section className="space-y-8">
          {/* Preset Examples */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
            <PresetSelector onLoadPreset={handleLoadPreset} />
          </div>
          
          {/* MDP Configuration */}
          <div className="space-y-4">
            {loadedPreset && (
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 rounded-full p-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Loaded Preset: {loadedPreset}</h3>
                    <p className="text-blue-100">You can modify the configuration below or load a different preset.</p>
                  </div>
                </div>
              </div>
            )}
          <MDPConfigurator 
            onMDPChange={handleMDPChange}
            onError={setError}
            mdp={mdp}
          />
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Configuration Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Monte Carlo Simulation Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">Monte Carlo Simulation</h3>
            <p className="text-gray-600">Configure simulation parameters and run Monte Carlo analysis</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="start-state" className="text-sm font-medium text-gray-700">Start State</Label>
                <Select value={start} onValueChange={setStart} disabled={!mdp}>
                  <SelectTrigger className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm">
                    <SelectValue placeholder="Select a start state" />
                  </SelectTrigger>
                  <SelectContent>
                    {(mdp?.states ?? []).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Episodes</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm" 
                  value={episodes} 
                  onChange={(e) => setEpisodes(Number(e.target.value))} 
                  min={1} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Max Steps per Episode</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm" 
                  value={maxSteps} 
                  onChange={(e) => setMaxSteps(Number(e.target.value))} 
                  min={1} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Histogram Bins</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 shadow-sm" 
                  value={bins} 
                  onChange={(e) => setBins(Number(e.target.value))} 
                  min={5} 
                  max={120} 
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button 
              onClick={handleSim} 
              disabled={!canSim} 
              className={`px-8 py-4 rounded-xl text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 ${
                canSim 
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700" 
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="flex items-center gap-3 font-semibold text-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                🚀 Run Monte Carlo Simulation
              </span>
            </button>
          </div>

          {result && (
            <div className="mt-6 p-8 bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 rounded-2xl border border-blue-200/50 shadow-lg">
              <h4 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Simulation Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Episodes</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{result.episodes}</div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Avg Reward</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{result.avgTotalReward.toFixed(3)}</div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Avg Steps</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">{result.avgSteps.toFixed(1)}</div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Path Length</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{result.pathAnalysis.avgPathLength.toFixed(1)}</div>
                </div>
              </div>
              <div className="bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-white/50 shadow-lg">
                <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Terminal Distribution</div>
                <div className="text-sm font-mono text-gray-800 bg-gray-50 p-4 rounded-lg border">{terminalPretty}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
        {mdp ? (
          <div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">MDP Graph Visualization</h3>
            <MDPGraph mdp={mdp} />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-lg text-gray-600">
              Configure your MDP using the visual configurator above to see the graph.
            </p>
          </div>
        )}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-xs text-gray-500 bg-gray-100 p-2 rounded-lg">
            Debug: MDP state is {mdp ? 'loaded' : 'null'}
          </div>
        )}
      </section>

      {result && (
        <>
          {/* Results Interpretation */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Results Analysis</h2>
            <ResultsInterpreter result={result} mdp={{ states: mdp!.states, actions: mdp!.actions, gamma: mdp!.gamma || 0.9 }} />
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Monte Carlo Reward Distribution</h2>
            <DistributionChart values={result.rewards} bins={bins} />
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">Terminal State Distribution</h2>
            <TerminalPie counts={result.terminalDist} />
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Most Common Transitions</h3>
              <div className="space-y-3">
                {topTransitions.map(({ transition, count }) => (
                  <div key={transition} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-mono text-sm">{transition}</span>
                    <span className="font-bold text-blue-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
              <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Action Usage</h3>
              <div className="space-y-3">
                {topActions.map(({ action, count }) => (
                  <div key={action} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Action {action}</span>
                    <span className="font-bold text-green-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mt-8">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Most Common Paths</h3>
            <div className="space-y-3">
              {result.pathAnalysis.mostCommonPaths.map(({ path, count }) => (
                <div key={path} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-mono text-sm">{path}</span>
                  <span className="font-bold text-purple-600">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Agent Optimizer - Only show after all Monte Carlo results */}
      {mdp && result && (
        <section className="space-y-4">
          <AgentOptimizer 
            mdp={mdp} 
            startState={start}
            baselineResult={result}
            onOptimizedMdp={handleOptimizedMdp}
            onOptimizationComplete={(result) => {
              setOptimizationResult(result);
            }}
          />
        </section>
      )}

      {/* Advanced Visualizations and Optimizations */}
      {mdp && (
        <section className="space-y-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">Advanced Features</h2>
            <p className="text-xl text-gray-600">Explore advanced visualizations and optimization techniques</p>
          </div>



          {/* Interactive Charts */}
          <InteractiveCharts 
            mdp={mdp}
            valueFunction={optimizationResult?.valueFunction}
            policy={optimizationResult?.bestPolicy}
            convergenceHistory={optimizationResult?.convergenceHistory}
            progressHistory={optimizationResult?.convergenceHistory ? optimizationResult.convergenceHistory.map((delta, index) => ({
              iteration: index,
              delta,
              valueFunction: optimizationResult.valueFunction,
              policy: optimizationResult.bestPolicy,
              method: 'optimization'
            })) : undefined}
          />

          {/* Hyperparameter Tuning */}
          <HyperparameterTuner 
            mdp={mdp}
            startState={start}
            onTuningComplete={(bestConfig, bestResult) => {
              setOptimizationResult(bestResult);
            }}
          />

          {/* Multi-Objective Optimization */}
          <MultiObjectiveOptimizer 
            mdp={mdp}
            startState={start}
            onOptimizationComplete={(results) => {
              if (results.length > 0) {
                setOptimizationResult(results[0].result);
              }
            }}
          />
        </section>
      )}
    </div>
  </main>
  );
}

