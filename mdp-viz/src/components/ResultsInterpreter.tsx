"use client";

import { useMemo } from "react";

interface ResultsInterpreterProps {
  result: {
    episodes: number;
    avgTotalReward: number;
    avgSteps: number;
    pathAnalysis: {
      avgPathLength: number;
      mostCommonPaths: Array<{ path: string; count: number }>;
    };
    terminalDist: Record<string, number>;
  };
  mdp: {
    states: string[];
    actions: string[];
    gamma: number;
  };
}

export default function ResultsInterpreter({ result, mdp }: ResultsInterpreterProps) {
  const interpretation = useMemo(() => {
    const { episodes, avgTotalReward, avgSteps, pathAnalysis, terminalDist } = result;
    
    // Analyze reward performance
    const rewardAnalysis = (() => {
      if (avgTotalReward > 10) return {
        level: "excellent",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        message: "This MDP configuration shows excellent performance with high average rewards."
      };
      if (avgTotalReward > 5) return {
        level: "good",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
        message: "This MDP shows good performance with positive average rewards."
      };
      if (avgTotalReward > 0) return {
        level: "moderate",
        color: "text-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        message: "This MDP shows moderate performance with slightly positive rewards."
      };
      return {
        level: "poor",
        color: "text-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        message: "This MDP shows poor performance with negative average rewards."
      };
    })();

    // Analyze efficiency
    const efficiencyAnalysis = (() => {
      const efficiency = avgTotalReward / avgSteps;
      if (efficiency > 0.1) return {
        level: "highly efficient",
        message: "The agent is highly efficient, achieving good rewards with minimal steps."
      };
      if (efficiency > 0.05) return {
        level: "efficient",
        message: "The agent is efficient, achieving reasonable rewards per step."
      };
      if (efficiency > 0) return {
        level: "moderately efficient",
        message: "The agent is moderately efficient, with some positive reward per step."
      };
      return {
        level: "inefficient",
        message: "The agent is inefficient, taking many steps for little reward."
      };
    })();

    // Analyze terminal states
    const terminalAnalysis = (() => {
      const terminalEntries = Object.entries(terminalDist);
      const totalEpisodes = episodes;
      const mostCommonTerminal = terminalEntries.reduce((a, b) => 
        (terminalDist[a[0]] || 0) > (terminalDist[b[0]] || 0) ? a : b
      );
      const terminalPercentage = ((mostCommonTerminal[1] || 0) / totalEpisodes) * 100;
      
      if (terminalPercentage > 80) return {
        level: "highly predictable",
        message: `The agent consistently reaches ${mostCommonTerminal[0]} (${terminalPercentage.toFixed(1)}% of episodes).`
      };
      if (terminalPercentage > 50) return {
        level: "predictable",
        message: `The agent often reaches ${mostCommonTerminal[0]} (${terminalPercentage.toFixed(1)}% of episodes).`
      };
      return {
        level: "unpredictable",
        message: `The agent shows varied terminal states, with ${mostCommonTerminal[0]} being most common (${terminalPercentage.toFixed(1)}% of episodes).`
      };
    })();

    // Analyze path complexity
    const pathComplexityAnalysis = (() => {
      const avgPathLength = pathAnalysis.avgPathLength;
      if (avgPathLength < 5) return {
        level: "simple",
        message: "The agent typically finds short, direct paths to goals."
      };
      if (avgPathLength < 15) return {
        level: "moderate",
        message: "The agent takes moderately complex paths to reach goals."
      };
      return {
        level: "complex",
        message: "The agent often takes complex, longer paths to reach goals."
      };
    })();

    return {
      rewardAnalysis,
      efficiencyAnalysis,
      terminalAnalysis,
      pathComplexityAnalysis
    };
  }, [result]);

  const suggestions = useMemo(() => {
    const suggestions = [];
    
    if (result.avgTotalReward < 0) {
      suggestions.push("Consider increasing positive rewards or reducing negative rewards in your transitions.");
    }
    
    if (result.avgSteps > 50) {
      suggestions.push("The agent takes many steps. Consider adding more direct paths or reducing step penalties.");
    }
    
    const terminalEntries = Object.entries(result.terminalDist);
    if (terminalEntries.length === 1) {
      suggestions.push("The agent always reaches the same terminal state. Consider adding more variety in outcomes.");
    }
    
    if (result.avgTotalReward / result.avgSteps < 0.01) {
      suggestions.push("The agent is very inefficient. Consider restructuring rewards or adding better paths.");
    }
    
    return suggestions;
  }, [result]);

  return (
    <div className="space-y-6">
      {/* Overall Performance Summary */}
      <div className={`p-4 rounded-lg border ${interpretation.rewardAnalysis.bgColor} ${interpretation.rewardAnalysis.borderColor}`}>
        <h4 className={`font-semibold mb-2 ${interpretation.rewardAnalysis.color}`}>
          Performance Analysis
        </h4>
        <p className="text-gray-700">{interpretation.rewardAnalysis.message}</p>
        <p className="text-sm text-gray-600 mt-2">
          Average reward: {result.avgTotalReward.toFixed(3)} | 
          Average steps: {result.avgSteps.toFixed(1)} | 
          Efficiency: {(result.avgTotalReward / result.avgSteps).toFixed(4)} reward/step
        </p>
      </div>

      {/* Detailed Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h5 className="font-semibold text-gray-800 mb-2">Efficiency</h5>
          <p className="text-sm text-gray-600">{interpretation.efficiencyAnalysis.message}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h5 className="font-semibold text-gray-800 mb-2">Terminal Behavior</h5>
          <p className="text-sm text-gray-600">{interpretation.terminalAnalysis.message}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h5 className="font-semibold text-gray-800 mb-2">Path Complexity</h5>
          <p className="text-sm text-gray-600">{interpretation.pathComplexityAnalysis.message}</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h5 className="font-semibold text-gray-800 mb-2">Simulation Quality</h5>
          <p className="text-sm text-gray-600">
            Based on {result.episodes} episodes, this provides a {result.episodes > 1000 ? "very reliable" : result.episodes > 500 ? "reliable" : "preliminary"} estimate of the MDP's behavior.
          </p>
        </div>
      </div>

      {/* Improvement Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <h5 className="font-semibold text-blue-800 mb-3">💡 Improvement Suggestions</h5>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                <span className="text-blue-500 mt-0.5">•</span>
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* MDP Context */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h5 className="font-semibold text-gray-800 mb-2">MDP Context</h5>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">States:</span> {mdp.states.length}
          </div>
          <div>
            <span className="font-medium text-gray-600">Actions:</span> {mdp.actions.length}
          </div>
          <div>
            <span className="font-medium text-gray-600">Discount (γ):</span> {mdp.gamma}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          A discount factor of {mdp.gamma} means future rewards are valued at {(mdp.gamma * 100).toFixed(0)}% of immediate rewards.
        </p>
      </div>
    </div>
  );
} 