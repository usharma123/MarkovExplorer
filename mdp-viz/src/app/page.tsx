"use client";

import { useMemo, useState, useCallback } from "react";
import MDPGraph from "@/components/MDPGraph";
import DistributionChart from "@/components/DistributionChart";
import TerminalPie from "@/components/TerminalPie";
import MDPConfigurator from "@/components/MDPConfigurator";
import PresetSelector from "@/components/PresetSelector";
import ResultsInterpreter from "@/components/ResultsInterpreter";
import { type MDP } from "@/types/mdp";
import { type PresetExample } from "@/lib/presets";
import { runMonteCarlo } from "@/lib/sim";

export default function Home() {
  const [mdp, setMdp] = useState<MDP | null>(null);
  const [start, setStart] = useState("S0");
  const [episodes, setEpisodes] = useState(1000);
  const [maxSteps, setMaxSteps] = useState(100);
  const [bins, setBins] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof runMonteCarlo> | null>(null);
  const [loadedPreset, setLoadedPreset] = useState<string | null>(null);

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
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <section className="space-y-8">
        {/* Preset Examples */}
        <PresetSelector onLoadPreset={handleLoadPreset} />
        
        {/* MDP Configuration */}
        <div className="space-y-4">
          {loadedPreset && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Preset Loaded</h3>
                  <p className="text-sm text-blue-700">Currently using: <span className="font-semibold">{loadedPreset}</span></p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Monte Carlo Simulation</h3>
            <p className="text-sm text-gray-600">Configure simulation parameters and run Monte Carlo analysis</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start State</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                  value={start} 
                  onChange={(e) => setStart(e.target.value)} 
                  disabled={!mdp}
                >
                  {(mdp?.states ?? []).map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Episodes</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
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
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
                  value={maxSteps} 
                  onChange={(e) => setMaxSteps(Number(e.target.value))} 
                  min={1} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Histogram Bins</label>
                <input 
                  type="number" 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200" 
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
              className={`px-6 py-3 rounded-lg text-white transition-all duration-200 shadow-sm hover:shadow-md ${
                canSim 
                  ? "bg-green-600 hover:bg-green-700" 
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Run Monte Carlo Simulation
              </span>
            </button>
          </div>

          {result && (
            <div className="mt-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Simulation Results</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Episodes</div>
                  <div className="text-lg font-bold text-gray-800">{result.episodes}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Avg Reward</div>
                  <div className="text-lg font-bold text-gray-800">{result.avgTotalReward.toFixed(3)}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Avg Steps</div>
                  <div className="text-lg font-bold text-gray-800">{result.avgSteps.toFixed(1)}</div>
                </div>
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <div className="text-xs text-gray-600 font-medium uppercase tracking-wide">Path Length</div>
                  <div className="text-lg font-bold text-gray-800">{result.pathAnalysis.avgPathLength.toFixed(1)}</div>
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <div className="text-xs text-gray-600 font-medium uppercase tracking-wide mb-1">Terminal Distribution</div>
                <div className="text-sm font-mono text-gray-800">{terminalPretty}</div>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="border rounded p-3 bg-white">
        {mdp ? (
          <div>
            <h3 className="text-lg font-medium mb-3">MDP Graph Visualization</h3>
            <MDPGraph mdp={mdp} />
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            Configure your MDP using the visual configurator above to see the graph.
          </p>
        )}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 text-xs text-gray-500">
            Debug: MDP state is {mdp ? 'loaded' : 'null'}
          </div>
        )}
      </section>

      {result && (
        <>
          {/* Results Interpretation */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Results Analysis</h2>
            <ResultsInterpreter result={result} mdp={{ states: mdp!.states, actions: mdp!.actions, gamma: mdp!.gamma || 0.9 }} />
          </div>

          <h2 className="text-xl font-semibold">Monte Carlo Reward Distribution</h2>
          <div className="border rounded p-3 bg-white">
            <DistributionChart values={result.rewards} bins={bins} />
          </div>

          <h2 className="text-xl font-semibold mt-6">Terminal State Distribution</h2>
          <div className="border rounded p-3 bg-white">
            <TerminalPie counts={result.terminalDist} />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Most Common Transitions</h3>
              <div className="border rounded p-3 bg-white">
                <div className="space-y-2">
                  {topTransitions.map(({ transition, count }) => (
                    <div key={transition} className="flex justify-between text-sm">
                      <span className="font-mono">{transition}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Action Usage</h3>
              <div className="border rounded p-3 bg-white">
                <div className="space-y-2">
                  {topActions.map(({ action, count }) => (
                    <div key={action} className="flex justify-between text-sm">
                      <span className="font-medium">Action {action}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Most Common Paths</h3>
            <div className="border rounded p-3 bg-white">
              <div className="space-y-2">
                {result.pathAnalysis.mostCommonPaths.map(({ path, count }) => (
                  <div key={path} className="flex justify-between text-sm">
                    <span className="font-mono">{path}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}

