import type { MDP } from "@/types/mdp";
import { actionsFromState, transitionsFor } from "@/types/mdp";

export type EpisodeResult = {
  totalReward: number;
  steps: number;
  terminal: string;
  visited: Record<string, number>;
  path: string[];
  actions: string[];
};

export type MonteCarloSummary = {
  episodes: number;
  avgTotalReward: number;
  terminalDist: Record<string, number>;
  avgSteps: number;
  visitCounts: Record<string, number>;
  rewards: number[];
  transitionCounts: Record<string, number>;
  actionCounts: Record<string, number>;
  pathAnalysis: {
    avgPathLength: number;
    mostCommonPaths: Array<{ path: string; count: number }>;
  };
};

function sampleNext(
  transitions: { nextState: string; probability: number; reward?: number }[]
) {
  if (transitions.length === 0) {
    throw new Error("No transitions available");
  }
  const r = Math.random();
  let acc = 0;
  for (const t of transitions) {
    acc += t.probability;
    if (r <= acc) return t;
  }
  return transitions[transitions.length - 1];
}

export function simulateEpisode(
  mdp: MDP,
  startState: string,
  maxSteps = 100
): EpisodeResult {
  let s = startState;
  let rewardSum = 0;
  const visited: Record<string, number> = {};
  const path: string[] = [s];
  const actions: string[] = [];
  const gamma = mdp.gamma ?? 1.0;
  let discount = 1.0;

  for (let step = 0; step < maxSteps; step++) {
    visited[s] = (visited[s] ?? 0) + 1;

    const availableActions = actionsFromState(mdp, s);
    if (availableActions.length === 0) {
      return { totalReward: rewardSum, steps: step, terminal: s, visited, path, actions };
    }
    
    const a = availableActions[Math.floor(Math.random() * availableActions.length)];
    const transitions = transitionsFor(mdp, s, a);
    
    if (transitions.length === 0) {
      return { totalReward: rewardSum, steps: step, terminal: s, visited, path, actions };
    }
    
    const t = sampleNext(transitions);

    rewardSum += discount * (t.reward ?? 0);
    discount *= gamma;
    s = t.nextState;
    path.push(s);
    actions.push(a);
  }

  return { totalReward: rewardSum, steps: maxSteps, terminal: s, visited, path, actions };
}

export function runMonteCarlo(
  mdp: MDP,
  startState: string,
  episodes = 1000,
  maxSteps = 100
): MonteCarloSummary {
  let rewardAcc = 0;
  let stepAcc = 0;
  const terminals: Record<string, number> = {};
  const visits: Record<string, number> = {};
  const rewards: number[] = [];
  const transitionCounts: Record<string, number> = {};
  const actionCounts: Record<string, number> = {};
  const pathLengths: number[] = [];
  const pathCounts: Record<string, number> = {};

  for (let i = 0; i < episodes; i++) {
    const res = simulateEpisode(mdp, startState, maxSteps);
    rewards.push(res.totalReward);
    rewardAcc += res.totalReward;
    stepAcc += res.steps;
    pathLengths.push(res.path.length);
    
    terminals[res.terminal] = (terminals[res.terminal] ?? 0) + 1;
    
    // Count visits
    for (const [st, c] of Object.entries(res.visited)) {
      visits[st] = (visits[st] ?? 0) + c;
    }
    
    // Count transitions and actions
    for (let j = 0; j < res.path.length - 1; j++) {
      const from = res.path[j];
      const to = res.path[j + 1];
      const action = res.actions[j];
      
      const transitionKey = `${from}-${action}->${to}`;
      transitionCounts[transitionKey] = (transitionCounts[transitionKey] ?? 0) + 1;
      
      actionCounts[action] = (actionCounts[action] ?? 0) + 1;
    }
    
    // Count path patterns
    const pathKey = res.path.join("->");
    pathCounts[pathKey] = (pathCounts[pathKey] ?? 0) + 1;
  }

  // Analyze most common paths
  const sortedPaths = Object.entries(pathCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([path, count]) => ({ path, count }));

  return {
    episodes,
    avgTotalReward: rewardAcc / episodes,
    terminalDist: terminals,
    avgSteps: stepAcc / episodes,
    visitCounts: visits,
    rewards,
    transitionCounts,
    actionCounts,
    pathAnalysis: {
      avgPathLength: pathLengths.reduce((a, b) => a + b, 0) / pathLengths.length,
      mostCommonPaths: sortedPaths,
    },
  };
}
