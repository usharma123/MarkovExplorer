"use client";

import { useMemo, useState } from "react";
import MDPGraph from "@/components/MDPGraph";
import DistributionChart from "@/components/DistributionChart";
import TerminalPie from "@/components/TerminalPie";
import { mdpSchema, type MDP, validateTransitionMass } from "@/types/mdp";
import { runMonteCarlo } from "@/lib/sim";

const SAMPLE = `{
  "states": ["S0", "S1", "S2", "S3"],
  "actions": ["a", "b"],
  "gamma": 0.95,
  "transitions": {
    "S0|a": [
      { "nextState": "S1", "probability": 0.9, "reward": 1 },
      { "nextState": "S2", "probability": 0.1, "reward": 0 }
    ],
    "S0|b": [
      { "nextState": "S1", "probability": 0.4, "reward": 0 },
      { "nextState": "S3", "probability": 0.6, "reward": 2 }
    ],
    "S1|a": [
      { "nextState": "S3", "probability": 1.0, "reward": 0 }
    ],
    "S1|b": [
      { "nextState": "S0", "probability": 1.0, "reward": 0 }
    ],
    "S2|a": [
      { "nextState": "S2", "probability": 1.0, "reward": 0 }
    ],
    "S2|b": [
      { "nextState": "S3", "probability": 1.0, "reward": 0 }
    ],
    "S3|a": [
      { "nextState": "S0", "probability": 0.5, "reward": 0 },
      { "nextState": "S3", "probability": 0.5, "reward": 0 }
    ],
    "S3|b": [
      { "nextState": "S0", "probability": 0.5, "reward": 0 },
      { "nextState": "S3", "probability": 0.5, "reward": 0 }
    ]
  }
}`;

export default function Home() {
  const [json, setJson] = useState(SAMPLE);
  const [mdp, setMdp] = useState<MDP | null>(null);
  const [start, setStart] = useState("S0");
  const [episodes, setEpisodes] = useState(1000);
  const [maxSteps, setMaxSteps] = useState(100);
  const [bins, setBins] = useState(30);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReturnType<typeof runMonteCarlo> | null>(null);

  const canSim = Boolean(mdp && mdp.states.includes(start));

  function handleRender() {
    setError(null);
    setResult(null);
    try {
      const parsed = mdpSchema.parse(JSON.parse(json));
      const massErrs = validateTransitionMass(parsed);
      if (massErrs.length) {
        setError("Probability mass errors: " + massErrs.join(", "));
        setMdp(null);
        return;
      }
      setMdp(parsed);
      if (!parsed.states.includes(start)) setStart(parsed.states[0]);
    } catch (e: any) {
      setError(e?.message ?? "Invalid JSON/MDP");
      setMdp(null);
    }
  }

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
      <h1 className="text-2xl font-semibold">MDP Visualizer & Simulator</h1>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="font-medium">MDP JSON</label>
          <textarea 
            className="w-full h-64 p-3 border rounded font-mono text-sm" 
            value={json} 
            onChange={(e) => setJson(e.target.value)} 
            placeholder="Enter MDP definition in JSON format..."
          />
          <button 
            onClick={handleRender} 
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Render Graph
          </button>
          {error && (
            <div className="text-red-600 text-sm mt-2 p-2 bg-red-50 border border-red-200 rounded">
              {error}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="w-32 font-medium">Start state</label>
            <select 
              className="border rounded px-2 py-1" 
              value={start} 
              onChange={(e) => setStart(e.target.value)} 
              disabled={!mdp}
            >
              {(mdp?.states ?? []).map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <label className="w-32 font-medium">Episodes</label>
            <input 
              type="number" 
              className="border rounded px-2 py-1" 
              value={episodes} 
              onChange={(e) => setEpisodes(Number(e.target.value))} 
              min={1} 
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-32 font-medium">Max steps/ep</label>
            <input 
              type="number" 
              className="border rounded px-2 py-1" 
              value={maxSteps} 
              onChange={(e) => setMaxSteps(Number(e.target.value))} 
              min={1} 
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="w-32 font-medium">Histogram bins</label>
            <input 
              type="number" 
              className="border rounded px-2 py-1" 
              value={bins} 
              onChange={(e) => setBins(Number(e.target.value))} 
              min={5} 
              max={120} 
            />
          </div>

          <button 
            onClick={handleSim} 
            disabled={!canSim} 
            className={`px-4 py-2 rounded text-white transition-colors ${
              canSim ? "bg-green-600 hover:bg-green-700" : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Run Monte Carlo
          </button>

          {result && (
            <div className="mt-3 space-y-2 text-sm bg-gray-50 p-3 rounded">
              <div className="grid grid-cols-2 gap-4">
                <div><b>Episodes:</b> {result.episodes}</div>
                <div><b>Avg total reward:</b> {result.avgTotalReward.toFixed(3)}</div>
                <div><b>Avg steps:</b> {result.avgSteps.toFixed(1)}</div>
                <div><b>Avg path length:</b> {result.pathAnalysis.avgPathLength.toFixed(1)}</div>
              </div>
              <div><b>Terminal distribution:</b> {terminalPretty}</div>
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
          <p className="text-sm text-gray-600">Paste JSON and click "Render Graph" to visualize the MDP.</p>
        )}
      </section>

      {result && (
        <>
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

