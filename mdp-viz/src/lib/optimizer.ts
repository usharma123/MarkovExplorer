import type { MDP, Transition } from "@/types/mdp";
import { actionsFromState, transitionsFor } from "@/types/mdp";

export interface OptimizationResult {
  bestPolicy: Record<string, string>; // state -> action
  bestValue: number;
  iterations: number;
  convergenceHistory: number[];
  policyHistory: Record<string, string>[];
  valueFunction: Record<string, number>;
}

export interface PolicyIterationResult extends OptimizationResult {
  deltaHistory: number[];
}

export interface ValueIterationResult extends OptimizationResult {
  deltaHistory: number[];
}

export interface QLearningResult extends OptimizationResult {
  qTable: Record<string, Record<string, number>>; // state -> action -> value
  learningCurve: number[];
}

export interface OptimizationConfig {
  maxIterations?: number;
  tolerance?: number;
  gamma?: number;
  learningRate?: number;
  epsilon?: number;
  episodes?: number;
  lambda?: number;
}

export interface OptimizationProgress {
  iteration: number;
  delta: number;
  valueFunction: Record<string, number>;
  policy: Record<string, string>;
  method: string;
  confidence?: number;
}

export interface OptimizationCallback {
  onProgress?: (progress: OptimizationProgress) => void;
  onComplete?: (result: OptimizationResult) => void;
  onError?: (error: Error) => void;
}

// Value Iteration Algorithm
export function valueIteration(
  mdp: MDP,
  config: OptimizationConfig = {},
  _callback?: OptimizationCallback
): ValueIterationResult {
  const {
    maxIterations = 1000,
    tolerance = 1e-6,
    gamma = mdp.gamma ?? 0.9
  } = config;

  const states = mdp.states;
  const valueFunction: Record<string, number> = {};
  const deltaHistory: number[] = [];
  const convergenceHistory: number[] = [];

  // Initialize value function
  states.forEach(state => {
    valueFunction[state] = 0;
  });

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let delta = 0;

    for (const state of states) {
      const actions = actionsFromState(mdp, state);
      if (actions.length === 0) continue;

      let maxValue = -Infinity;

      for (const action of actions) {
        const transitions = transitionsFor(mdp, state, action);
        let actionValue = 0;

        for (const transition of transitions) {
          const reward = transition.reward ?? 0;
          const nextValue = valueFunction[transition.nextState] ?? 0;
          actionValue += transition.probability * (reward + gamma * nextValue);
        }

        if (actionValue > maxValue) {
          maxValue = actionValue;
        }
      }

      const oldValue = valueFunction[state];
      valueFunction[state] = maxValue;
      delta = Math.max(delta, Math.abs(maxValue - oldValue));
    }

    deltaHistory.push(delta);
    convergenceHistory.push(delta);

    // Report progress in real-time
    if (_callback?.onProgress) {
      // Extract current policy for progress reporting
      const currentPolicy: Record<string, string> = {};
      for (const state of states) {
        const actions = actionsFromState(mdp, state);
        if (actions.length === 0) continue;

        let maxValue = -Infinity;
        let bestAction = actions[0];

        for (const action of actions) {
          const transitions = transitionsFor(mdp, state, action);
          let actionValue = 0;

          for (const transition of transitions) {
            const reward = transition.reward ?? 0;
            const nextValue = valueFunction[transition.nextState] ?? 0;
            actionValue += transition.probability * (reward + gamma * nextValue);
          }

          if (actionValue > maxValue) {
            maxValue = actionValue;
            bestAction = action;
          }
        }
        currentPolicy[state] = bestAction;
      }

      _callback.onProgress({
        iteration,
        delta,
        valueFunction: { ...valueFunction },
        policy: currentPolicy,
        method: "Value Iteration"
      });
    }

    if (delta < tolerance) {
      break;
    }
  }

  // Extract optimal policy
  const bestPolicy: Record<string, string> = {};
  for (const state of states) {
    const actions = actionsFromState(mdp, state);
    if (actions.length === 0) continue;

    let maxValue = -Infinity;

    for (const action of actions) {
      const transitions = transitionsFor(mdp, state, action);
      let actionValue = 0;

      for (const transition of transitions) {
        const reward = transition.reward ?? 0;
        const nextValue = valueFunction[transition.nextState] ?? 0;
        actionValue += transition.probability * (reward + gamma * nextValue);
      }

      if (actionValue > maxValue) {
        maxValue = actionValue;
      }
    }

    bestPolicy[state] = actions[0]; // Fallback to first action if all are equal
  }

  const bestValue = Math.max(...Object.values(valueFunction));

  return {
    bestPolicy,
    bestValue,
    iterations: deltaHistory.length,
    convergenceHistory,
    policyHistory: [bestPolicy],
    valueFunction,
    deltaHistory
  };
}

// Policy Iteration Algorithm
export function policyIteration(
  mdp: MDP,
  config: OptimizationConfig = {},
  _callback?: OptimizationCallback
): PolicyIterationResult {
  const {
    maxIterations = 1000,
    tolerance = 1e-6,
    gamma = mdp.gamma ?? 0.9
  } = config;

  const states = mdp.states;
  const policyHistory: Record<string, string>[] = [];
  const deltaHistory: number[] = [];
  const convergenceHistory: number[] = [];
  let valueFunction: Record<string, number> = {};

  // Initialize random policy
  const policy: Record<string, string> = {};
  for (const state of states) {
    const actions = actionsFromState(mdp, state);
    if (actions.length > 0) {
      policy[state] = actions[Math.floor(Math.random() * actions.length)];
    }
  }

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Policy Evaluation
    valueFunction = {};
    states.forEach(state => {
      valueFunction[state] = 0;
    });

    let delta = 0;
    for (let evalIter = 0; evalIter < 100; evalIter++) {
      delta = 0;
      for (const state of states) {
        const action = policy[state];
        if (!action) continue;

        const transitions = transitionsFor(mdp, state, action);
        let newValue = 0;

        for (const transition of transitions) {
          const reward = transition.reward ?? 0;
          const nextValue = valueFunction[transition.nextState] ?? 0;
          newValue += transition.probability * (reward + gamma * nextValue);
        }

        const oldValue = valueFunction[state];
        valueFunction[state] = newValue;
        delta = Math.max(delta, Math.abs(newValue - oldValue));
      }

      if (delta < tolerance) break;
    }

    // Policy Improvement
    let policyStable = true;
    for (const state of states) {
      const actions = actionsFromState(mdp, state);
      if (actions.length === 0) continue;

      let maxValue = -Infinity;
      let bestAction = actions[0];

      for (const action of actions) {
        const transitions = transitionsFor(mdp, state, action);
        let actionValue = 0;

        for (const transition of transitions) {
          const reward = transition.reward ?? 0;
          const nextValue = valueFunction[transition.nextState] ?? 0;
          actionValue += transition.probability * (reward + gamma * nextValue);
        }

        if (actionValue > maxValue) {
          maxValue = actionValue;
          bestAction = action;
        }
      }

      if (policy[state] !== bestAction) {
        policy[state] = bestAction;
        policyStable = false;
      }
    }

    policyHistory.push({ ...policy });
    deltaHistory.push(delta);
    convergenceHistory.push(delta);

    if (policyStable) {
      break;
    }
  }

  const bestValue = Math.max(...Object.values(valueFunction));

  return {
    bestPolicy: policy,
    bestValue,
    iterations: deltaHistory.length,
    convergenceHistory,
    policyHistory,
    valueFunction,
    deltaHistory
  };
}

// Q-Learning Algorithm
export function qLearning(
  mdp: MDP,
  startState: string,
  config: OptimizationConfig = {},
  _callback?: OptimizationCallback
): QLearningResult {
  const {
    learningRate = 0.1,
    gamma = mdp.gamma ?? 0.9,
    epsilon = 0.1,
    episodes = 1000
  } = config;

  const states = mdp.states;
  const qTable: Record<string, Record<string, number>> = {};
  const learningCurve: number[] = [];

  // Initialize Q-table
  for (const state of states) {
    const actions = actionsFromState(mdp, state);
    qTable[state] = {};
    for (const action of actions) {
      qTable[state][action] = 0;
    }
  }

  for (let episode = 0; episode < episodes; episode++) {
    let state = startState;
    let totalReward = 0;
    let steps = 0;
    const maxSteps = 100;

    while (steps < maxSteps) {
      const actions = actionsFromState(mdp, state);
      if (actions.length === 0) break;

      // Epsilon-greedy action selection
      let action: string;
      if (Math.random() < epsilon) {
        action = actions[Math.floor(Math.random() * actions.length)];
      } else {
        action = actions.reduce((best, current) => 
          (qTable[state][current] ?? 0) > (qTable[state][best] ?? 0) ? current : best
        );
      }

      const transitions = transitionsFor(mdp, state, action);
      if (transitions.length === 0) break;

      // Sample next state
      const r = Math.random();
      let acc = 0;
      let selectedTransition: Transition | null = null;
      
      for (const transition of transitions) {
        acc += transition.probability;
        if (r <= acc) {
          selectedTransition = transition;
          break;
        }
      }
      
      if (!selectedTransition) {
        selectedTransition = transitions[transitions.length - 1];
      }

      const nextState = selectedTransition.nextState;
      const reward = selectedTransition.reward ?? 0;

      // Q-learning update
      const nextActions = actionsFromState(mdp, nextState);
      let maxNextQ = 0;
      if (nextActions.length > 0) {
        maxNextQ = Math.max(...nextActions.map(a => qTable[nextState][a] ?? 0));
      }

      const currentQ = qTable[state][action] ?? 0;
      qTable[state][action] = currentQ + learningRate * (reward + gamma * maxNextQ - currentQ);

      totalReward += reward;
      state = nextState;
      steps++;
    }

    learningCurve.push(totalReward);
  }

  // Extract optimal policy
  const bestPolicy: Record<string, string> = {};
  for (const state of states) {
    const actions = actionsFromState(mdp, state);
    if (actions.length === 0) continue;

    const bestAction = actions.reduce((best, current) => 
      (qTable[state][current] ?? 0) > (qTable[state][best] ?? 0) ? current : best
    );
    bestPolicy[state] = bestAction;
  }

  const valueFunction: Record<string, number> = {};
  for (const state of states) {
    const actions = actionsFromState(mdp, state);
    if (actions.length === 0) {
      valueFunction[state] = 0;
      continue;
    }
    valueFunction[state] = Math.max(...actions.map(a => qTable[state][a] ?? 0));
  }

  const bestValue = Math.max(...Object.values(valueFunction));

  return {
    bestPolicy,
    bestValue,
    iterations: episodes,
    convergenceHistory: learningCurve,
    policyHistory: [bestPolicy],
    valueFunction,
    qTable,
    learningCurve
  };
}

// SARSA Algorithm (State-Action-Reward-State-Action)
export function sarsa(
  mdp: MDP,
  startState: string,
  config: OptimizationConfig = {},
  _callback?: OptimizationCallback
): QLearningResult {
  const {
    learningRate = 0.1,
    gamma = mdp.gamma ?? 0.9,
    epsilon = 0.1,
    episodes = 1000
  } = config;

  const states = mdp.states;
  const qTable: Record<string, Record<string, number>> = {};
  const learningCurve: number[] = [];

  // Initialize Q-table
  for (const state of states) {
    const actions = actionsFromState(mdp, state);
    qTable[state] = {};
    for (const action of actions) {
      qTable[state][action] = 0;
    }
  }

  for (let episode = 0; episode < episodes; episode++) {
    let state = startState;
    let totalReward = 0;
    let steps = 0;
    const maxSteps = 100;

    // Choose initial action
    const actions = actionsFromState(mdp, state);
    if (actions.length === 0) break;

    let action: string;
    if (Math.random() < epsilon) {
      action = actions[Math.floor(Math.random() * actions.length)];
    } else {
      action = actions.reduce((best, current) => 
        (qTable[state][current] ?? 0) > (qTable[state][best] ?? 0) ? current : best
      );
    }

    while (steps < maxSteps) {
      const transitions = transitionsFor(mdp, state, action);
      if (transitions.length === 0) break;

      // Sample next state
      const r = Math.random();
      let acc = 0;
      let selectedTransition: Transition | null = null;
      
      for (const transition of transitions) {
        acc += transition.probability;
        if (r <= acc) {
          selectedTransition = transition;
          break;
        }
      }
      
      if (!selectedTransition) {
        selectedTransition = transitions[transitions.length - 1];
      }

      const nextState = selectedTransition.nextState;
      const reward = selectedTransition.reward ?? 0;

      // Choose next action (SARSA is on-policy)
      const nextActions = actionsFromState(mdp, nextState);
      let nextAction: string;
      if (nextActions.length === 0) break;

      if (Math.random() < epsilon) {
        nextAction = nextActions[Math.floor(Math.random() * nextActions.length)];
      } else {
        nextAction = nextActions.reduce((best, current) => 
          (qTable[nextState][current] ?? 0) > (qTable[nextState][best] ?? 0) ? current : best
        );
      }

      // SARSA update: Q(s,a) ← Q(s,a) + α[r + γQ(s',a') - Q(s,a)]
      const currentQ = qTable[state][action] ?? 0;
      const nextQ = qTable[nextState][nextAction] ?? 0;
      qTable[state][action] = currentQ + learningRate * (reward + gamma * nextQ - currentQ);

      totalReward += reward;
      state = nextState;
      action = nextAction;
      steps++;
    }

    learningCurve.push(totalReward);

    // Report progress
    if (_callback?.onProgress && episode % 100 === 0) {
      const currentPolicy: Record<string, string> = {};
      for (const s of states) {
        const availableActions = actionsFromState(mdp, s);
        if (availableActions.length > 0) {
          currentPolicy[s] = availableActions.reduce((best, current) => 
            (qTable[s][current] ?? 0) > (qTable[s][best] ?? 0) ? current : best
          );
        }
      }

      _callback.onProgress({
        iteration: episode,
        delta: learningCurve[learningCurve.length - 1] - (learningCurve[learningCurve.length - 2] ?? 0),
        valueFunction: Object.fromEntries(
          states.map(s => [s, Math.max(...actionsFromState(mdp, s).map(a => qTable[s][a] ?? 0))])
        ),
        policy: currentPolicy,
        method: "SARSA"
      });
    }
  }

  // Extract optimal policy
  const bestPolicy: Record<string, string> = {};
  for (const state of states) {
    const actions = actionsFromState(mdp, state);
    if (actions.length === 0) continue;

    const bestAction = actions.reduce((best, current) => 
      (qTable[state][current] ?? 0) > (qTable[state][best] ?? 0) ? current : best
    );
    bestPolicy[state] = bestAction;
  }

  const valueFunction: Record<string, number> = {};
  for (const state of states) {
    const actions = actionsFromState(mdp, state);
    if (actions.length > 0) {
      valueFunction[state] = Math.max(...actions.map(a => qTable[state][a] ?? 0));
    }
  }

  return {
    bestPolicy,
    bestValue: Math.max(...Object.values(valueFunction)),
    iterations: episodes,
    convergenceHistory: learningCurve,
    policyHistory: [bestPolicy],
    valueFunction,
    qTable,
    learningCurve
  };
}

// Actor-Critic Algorithm
export function actorCritic(
  mdp: MDP,
  startState: string,
  config: OptimizationConfig = {},
  _callback?: OptimizationCallback
): OptimizationResult {
  const {
    learningRate = 0.01,
    gamma = mdp.gamma ?? 0.9,
    episodes = 1000
  } = config;

  const states = mdp.states;
  
  // Actor: policy parameters (action preferences)
  const actorParams: Record<string, Record<string, number>> = {};
  // Critic: value function
  const criticParams: Record<string, number> = {};
  const learningCurve: number[] = [];

  // Initialize parameters
  for (const state of states) {
    const availableActions = actionsFromState(mdp, state);
    actorParams[state] = {};
    for (const action of availableActions) {
      actorParams[state][action] = 0; // Equal initial preferences
    }
    criticParams[state] = 0;
  }

  for (let episode = 0; episode < episodes; episode++) {
    let state = startState;
    let totalReward = 0;
    let steps = 0;
    const maxSteps = 100;

    while (steps < maxSteps) {
      const availableActions = actionsFromState(mdp, state);
      if (availableActions.length === 0) break;

      // Actor: choose action based on current policy
      const preferences = availableActions.map(a => actorParams[state][a] ?? 0);
      const maxPref = Math.max(...preferences);
      const expPrefs = preferences.map(p => Math.exp(p - maxPref));
      const sumExp = expPrefs.reduce((sum, exp) => sum + exp, 0);
      const probs = expPrefs.map(exp => exp / sumExp);

      // Sample action
      const r = Math.random();
      let acc = 0;
      let selectedAction = availableActions[0];
      for (let i = 0; i < availableActions.length; i++) {
        acc += probs[i];
        if (r <= acc) {
          selectedAction = availableActions[i];
          break;
        }
      }

      const transitions = transitionsFor(mdp, state, selectedAction);
      if (transitions.length === 0) break;

      // Sample next state
      const r2 = Math.random();
      let acc2 = 0;
      let selectedTransition: Transition | null = null;
      
      for (const transition of transitions) {
        acc2 += transition.probability;
        if (r2 <= acc2) {
          selectedTransition = transition;
          break;
        }
      }
      
      if (!selectedTransition) {
        selectedTransition = transitions[transitions.length - 1];
      }

      const nextState = selectedTransition.nextState;
      const reward = selectedTransition.reward ?? 0;

      // Critic: compute TD error
      const currentValue = criticParams[state] ?? 0;
      const nextValue = criticParams[nextState] ?? 0;
      const tdError = reward + gamma * nextValue - currentValue;

      // Update critic
      criticParams[state] = currentValue + learningRate * tdError;

      // Update actor
      for (const action of availableActions) {
        const isSelected = action === selectedAction ? 1 : 0;
        const currentProb = probs[availableActions.indexOf(action)];
        actorParams[state][action] += learningRate * tdError * (isSelected - currentProb);
      }

      totalReward += reward;
      state = nextState;
      steps++;
    }

    learningCurve.push(totalReward);

    // Report progress
    if (_callback?.onProgress && episode % 100 === 0) {
      const currentPolicy: Record<string, string> = {};
      for (const s of states) {
        const availableActions = actionsFromState(mdp, s);
        if (availableActions.length > 0) {
          const preferences = availableActions.map(a => actorParams[s][a] ?? 0);
          const bestAction = availableActions[preferences.indexOf(Math.max(...preferences))];
          currentPolicy[s] = bestAction;
        }
      }

      _callback.onProgress({
        iteration: episode,
        delta: learningCurve[learningCurve.length - 1] - (learningCurve[learningCurve.length - 2] ?? 0),
        valueFunction: { ...criticParams },
        policy: currentPolicy,
        method: "Actor-Critic"
      });
    }
  }

  // Extract final policy
  const bestPolicy: Record<string, string> = {};
  for (const state of states) {
    const availableActions = actionsFromState(mdp, state);
    if (availableActions.length > 0) {
      const preferences = availableActions.map(a => actorParams[state][a] ?? 0);
      const bestAction = availableActions[preferences.indexOf(Math.max(...preferences))];
      bestPolicy[state] = bestAction;
    }
  }

  return {
    bestPolicy,
    bestValue: Math.max(...Object.values(criticParams)),
    iterations: episodes,
    convergenceHistory: learningCurve,
    policyHistory: [bestPolicy],
    valueFunction: criticParams
  };
}

// TD(λ) Algorithm
export function tdLambda(
  mdp: MDP,
  startState: string,
  config: OptimizationConfig = {},
  _callback?: OptimizationCallback
): OptimizationResult {
  const {
    learningRate = 0.1,
    gamma = mdp.gamma ?? 0.9,
    lambda = 0.7,
    episodes = 1000
  } = config;

  const states = mdp.states;
  const valueFunction: Record<string, number> = {};
  const eligibilityTraces: Record<string, number> = {};
  const learningCurve: number[] = [];

  // Initialize value function
  for (const state of states) {
    valueFunction[state] = 0;
  }

  for (let episode = 0; episode < episodes; episode++) {
    let state = startState;
    let totalReward = 0;
    let steps = 0;
    const maxSteps = 100;

    // Reset eligibility traces
    for (const s of states) {
      eligibilityTraces[s] = 0;
    }

    while (steps < maxSteps) {
      const availableActions = actionsFromState(mdp, state);
      if (availableActions.length === 0) break;

      // Choose action (random for simplicity)
      const action = availableActions[Math.floor(Math.random() * availableActions.length)];
      const transitions = transitionsFor(mdp, state, action);
      
      if (transitions.length === 0) break;

      // Sample next state
      const r = Math.random();
      let acc = 0;
      let selectedTransition: Transition | null = null;
      
      for (const transition of transitions) {
        acc += transition.probability;
        if (r <= acc) {
          selectedTransition = transition;
          break;
        }
      }
      
      if (!selectedTransition) {
        selectedTransition = transitions[transitions.length - 1];
      }

      const nextState = selectedTransition.nextState;
      const reward = selectedTransition.reward ?? 0;

      // TD(λ) update
      const currentValue = valueFunction[state];
      const nextValue = valueFunction[nextState] ?? 0;
      const tdError = reward + gamma * nextValue - currentValue;

      // Update eligibility traces
      eligibilityTraces[state] += 1;

      // Update all states
      for (const s of states) {
        if (eligibilityTraces[s] > 0) {
          valueFunction[s] += learningRate * tdError * eligibilityTraces[s];
          eligibilityTraces[s] *= gamma * lambda;
        }
      }

      totalReward += reward;
      state = nextState;
      steps++;
    }

    learningCurve.push(totalReward);

    // Report progress
    if (_callback?.onProgress && episode % 100 === 0) {
      const currentPolicy: Record<string, string> = {};
      for (const s of states) {
        const availableActions = actionsFromState(mdp, s);
        if (availableActions.length > 0) {
          // Simple policy: choose action that leads to highest value next state
          let bestAction = availableActions[0];
          let bestValue = -Infinity;
          
          for (const action of availableActions) {
            const transitions = transitionsFor(mdp, s, action);
            let actionValue = 0;
            
            for (const transition of transitions) {
              actionValue += transition.probability * (valueFunction[transition.nextState] ?? 0);
            }
            
            if (actionValue > bestValue) {
              bestValue = actionValue;
              bestAction = action;
            }
          }
          
          currentPolicy[s] = bestAction;
        }
      }

      _callback.onProgress({
        iteration: episode,
        delta: learningCurve[learningCurve.length - 1] - (learningCurve[learningCurve.length - 2] ?? 0),
        valueFunction: { ...valueFunction },
        policy: currentPolicy,
        method: `TD(λ=${lambda})`
      });
    }
  }

  // Extract final policy
  const bestPolicy: Record<string, string> = {};
  for (const state of states) {
    const availableActions = actionsFromState(mdp, state);
    if (availableActions.length > 0) {
      let bestAction = availableActions[0];
      let bestValue = -Infinity;
      
      for (const action of availableActions) {
        const transitions = transitionsFor(mdp, state, action);
        let actionValue = 0;
        
        for (const transition of transitions) {
          actionValue += transition.probability * (valueFunction[transition.nextState] ?? 0);
        }
        
        if (actionValue > bestValue) {
          bestValue = actionValue;
          bestAction = action;
        }
      }
      
      bestPolicy[state] = bestAction;
    }
  }

  return {
    bestPolicy,
    bestValue: Math.max(...Object.values(valueFunction)),
    iterations: episodes,
    convergenceHistory: learningCurve,
    policyHistory: [bestPolicy],
    valueFunction
  };
}

// Monte Carlo Policy Evaluation
export function evaluatePolicy(
  mdp: MDP,
  policy: Record<string, string>,
  startState: string,
  episodes = 1000
): { valueFunction: Record<string, number>; avgReward: number } {
  const valueFunction: Record<string, number> = {};
  let totalReward = 0;

  for (let episode = 0; episode < episodes; episode++) {
    let state = startState;
    let episodeReward = 0;
    let steps = 0;
    const maxSteps = 100;
    const gamma = mdp.gamma ?? 0.9;

    while (steps < maxSteps) {
      const action = policy[state];
      if (!action) break;

      const transitions = transitionsFor(mdp, state, action);
      if (transitions.length === 0) break;

      // Sample next state
      const r = Math.random();
      let acc = 0;
      let selectedTransition: Transition | null = null;
      
      for (const transition of transitions) {
        acc += transition.probability;
        if (r <= acc) {
          selectedTransition = transition;
          break;
        }
      }
      
      if (!selectedTransition) {
        selectedTransition = transitions[transitions.length - 1];
      }

      const reward = selectedTransition.reward ?? 0;
      episodeReward += Math.pow(gamma, steps) * reward;
      state = selectedTransition.nextState;
      steps++;
    }

    totalReward += episodeReward;
  }

  return {
    valueFunction,
    avgReward: totalReward / episodes
  };
}

// Find optimal MDP configuration by varying parameters
export function optimizeMDPConfiguration(
  baseMdp: MDP,
  startState: string,
  config: OptimizationConfig = {},
  callback?: OptimizationCallback
): {
  bestMdp: MDP;
  bestResult: OptimizationResult;
  optimizationHistory: Array<{ mdp: MDP; result: OptimizationResult }>;
} {
  const optimizationHistory: Array<{ mdp: MDP; result: OptimizationResult }> = [];
  let bestMdp = baseMdp;
  let bestResult: OptimizationResult | null = null;
  let bestValue = -Infinity;

  // Try different gamma values
  const gammaValues = [0.7, 0.8, 0.9, 0.95, 0.99];
  
  for (const gamma of gammaValues) {
    const testMdp = { ...baseMdp, gamma };
    const result = valueIteration(testMdp, config, callback);
    
    optimizationHistory.push({ mdp: testMdp, result });
    
    if (result.bestValue > bestValue) {
      bestValue = result.bestValue;
      bestMdp = testMdp;
      bestResult = result;
    }
  }

  // Try optimizing rewards
  const rewardMultipliers = [0.5, 1.0, 1.5, 2.0];
  
  for (const multiplier of rewardMultipliers) {
    const testMdp = {
      ...baseMdp,
      transitions: Object.fromEntries(
        Object.entries(baseMdp.transitions).map(([key, transitions]) => [
          key,
          transitions.map(t => ({
            ...t,
            reward: (t.reward ?? 0) * multiplier
          }))
        ])
      )
    };
    
    const result = valueIteration(testMdp, config, callback);
    
    optimizationHistory.push({ mdp: testMdp, result });
    
    if (result.bestValue > bestValue) {
      bestValue = result.bestValue;
      bestMdp = testMdp;
      bestResult = result;
    }
  }

  return {
    bestMdp,
    bestResult: bestResult!,
    optimizationHistory
  };
} 

// Robust MDP Optimization that works for any MDP
export interface RobustOptimizationResult {
  bestPolicy: Record<string, string>;
  bestValue: number;
  actualPerformance: number;
  confidence: number;
  method: string;
  iterations: number;
  convergenceHistory: number[];
  valueFunction: Record<string, number>;
  policyHistory: Record<string, string>[];
  validationResults: {
    mcReward: number;
    mcStdDev: number;
    successRate: number;
    pathEfficiency: number;
  };
}

export interface OptimizationMethod {
  name: string;
  description: string;
  optimize: (mdp: MDP, startState: string, config: OptimizationConfig) => Promise<OptimizationResult>;
}

// Adaptive optimization that tries multiple methods and validates results
export async function robustOptimizeMDP(
  mdp: MDP,
  startState: string,
  config: OptimizationConfig = {},
  callback?: OptimizationCallback
): Promise<RobustOptimizationResult> {
  const methods: OptimizationMethod[] = [
    {
      name: "Value Iteration",
      description: "Classical dynamic programming approach",
      optimize: async (mdp, startState, config) => valueIteration(mdp, config, callback)
    },
    {
      name: "Policy Iteration", 
      description: "Iterative policy improvement",
      optimize: async (mdp, startState, config) => policyIteration(mdp, config, callback)
    },
    {
      name: "Q-Learning",
      description: "Model-free reinforcement learning",
      optimize: async (mdp, startState, config) => qLearning(mdp, startState, config, callback)
    },
    {
      name: "Monte Carlo Policy Search",
      description: "Direct policy optimization via simulation",
      optimize: async (mdp, startState, config) => monteCarloPolicySearch(mdp, startState, config, callback)
    }
  ];

  const results: Array<{method: string; result: OptimizationResult; validation: {
    mcReward: number;
    mcStdDev: number;
    successRate: number;
    pathEfficiency: number;
  }}> = [];

  // Try each optimization method
  for (const method of methods) {
    try {
      console.log(`Trying ${method.name}...`);
      const result = await method.optimize(mdp, startState, config);
      
      // Validate the result with Monte Carlo simulation
      const validation = validatePolicyWithMonteCarlo(mdp, result.bestPolicy, startState);
      
      results.push({
        method: method.name,
        result,
        validation
      });
    } catch (error) {
      console.warn(`${method.name} failed:`, error);
    }
  }

  // Select the best result based on validation
  const bestResult = selectBestResult(results);
  
  return {
    ...bestResult.result,
    actualPerformance: bestResult.validation.mcReward,
    confidence: calculateConfidence(bestResult.validation),
    method: bestResult.method,
    validationResults: bestResult.validation
  };
}

// Monte Carlo Policy Search - directly optimizes policy through simulation
export function monteCarloPolicySearch(
  mdp: MDP,
  startState: string,
  config: OptimizationConfig = {},
  _callback?: OptimizationCallback
): OptimizationResult {
  const { episodes = 1000 } = config;
  const states = mdp.states;
  
  // Initialize random policy
  const policy: Record<string, string> = {};
  for (const state of states) {
    const availableActions = actionsFromState(mdp, state);
    if (availableActions.length > 0) {
      policy[state] = availableActions[Math.floor(Math.random() * availableActions.length)];
    }
  }

  let bestPolicy = { ...policy };
  let bestReward = -Infinity;
  const convergenceHistory: number[] = [];

  // Iterative policy improvement
  for (let iteration = 0; iteration < 50; iteration++) {
    let totalReward = 0;
    
    // Evaluate current policy
    for (let episode = 0; episode < episodes / 50; episode++) {
      const episodeReward = simulateEpisodeWithPolicy(mdp, policy, startState);
      totalReward += episodeReward;
    }
    
    const avgReward = totalReward / (episodes / 50);
    convergenceHistory.push(avgReward);
    
    if (avgReward > bestReward) {
      bestReward = avgReward;
      bestPolicy = { ...policy };
    }
    
    // Policy improvement: try different actions for each state
    for (const state of states) {
      const availableActions = actionsFromState(mdp, state);
      if (availableActions.length <= 1) continue;
      
      let bestAction = policy[state];
      let bestActionReward = avgReward;
      
      for (const action of availableActions) {
        if (action === policy[state]) continue;
        
        // Test this action
        const testPolicy = { ...policy, [state]: action };
        let testReward = 0;
        
        for (let testEpisode = 0; testEpisode < 10; testEpisode++) {
          testReward += simulateEpisodeWithPolicy(mdp, testPolicy, startState);
        }
        
        if (testReward > bestActionReward) {
          bestAction = action;
          bestActionReward = testReward;
        }
      }
      
      policy[state] = bestAction;
    }
  }

  // Calculate value function from best policy
  const valueFunction: Record<string, number> = {};
  for (const state of states) {
    valueFunction[state] = bestReward; // Simplified
  }

  return {
    bestPolicy,
    bestValue: bestReward,
    iterations: convergenceHistory.length,
    convergenceHistory,
    policyHistory: [bestPolicy],
    valueFunction
  };
}

// Simulate episode following a specific policy
function simulateEpisodeWithPolicy(
  mdp: MDP,
  policy: Record<string, string>,
  startState: string,
  maxSteps = 100
): number {
  let state = startState;
  let totalReward = 0;
  const gamma = mdp.gamma ?? 0.9;
  let discount = 1.0;

  for (let step = 0; step < maxSteps; step++) {
    const action = policy[state];
    if (!action) break;

    const transitions = transitionsFor(mdp, state, action);
    if (transitions.length === 0) break;

    // Sample next state
    const r = Math.random();
    let acc = 0;
    let selectedTransition: Transition | null = null;
    
    for (const transition of transitions) {
      acc += transition.probability;
      if (r <= acc) {
        selectedTransition = transition;
        break;
      }
    }
    
    if (!selectedTransition) {
      selectedTransition = transitions[transitions.length - 1];
    }

    const reward = selectedTransition.reward ?? 0;
    totalReward += discount * reward;
    discount *= gamma;
    state = selectedTransition.nextState;
  }

  return totalReward;
}

// Validate policy with Monte Carlo simulation
function validatePolicyWithMonteCarlo(
  mdp: MDP,
  policy: Record<string, string>,
  startState: string,
  episodes = 1000
): {
  mcReward: number;
  mcStdDev: number;
  successRate: number;
  pathEfficiency: number;
} {
  const rewards: number[] = [];
  let successfulEpisodes = 0;
  let totalPathLength = 0;

  for (let episode = 0; episode < episodes; episode++) {
    const episodeResult = simulateEpisodeWithPolicy(mdp, policy, startState);
    rewards.push(episodeResult);
    
    if (episodeResult > 0) successfulEpisodes++;
    totalPathLength += Math.min(100, episodeResult > 0 ? 50 : 100); // Estimate path length
  }

  const avgReward = rewards.reduce((a, b) => a + b, 0) / rewards.length;
  const variance = rewards.reduce((acc, r) => acc + Math.pow(r - avgReward, 2), 0) / rewards.length;
  const stdDev = Math.sqrt(variance);
  const successRate = successfulEpisodes / episodes;
  const pathEfficiency = avgReward / (totalPathLength / episodes);

  return {
    mcReward: avgReward,
    mcStdDev: stdDev,
    successRate,
    pathEfficiency
  };
}

// Select best result based on validation
function selectBestResult(results: Array<{method: string; result: OptimizationResult; validation: {
  mcReward: number;
  mcStdDev: number;
  successRate: number;
  pathEfficiency: number;
}}>) {
  if (results.length === 0) {
    throw new Error("No optimization methods succeeded");
  }

  // Score each result based on multiple criteria
  const scoredResults = results.map(({ method, result, validation }) => {
    const score = 
      validation.mcReward * 0.4 + // 40% weight to actual performance
      validation.successRate * 0.3 + // 30% weight to success rate
      (1 / (1 + validation.mcStdDev)) * 0.2 + // 20% weight to consistency (lower std dev is better)
      validation.pathEfficiency * 0.1; // 10% weight to efficiency

    return { method, result, validation, score };
  });

  // Return the highest scoring result
  return scoredResults.reduce((best, current) => 
    current.score > best.score ? current : best
  );
}

// Calculate confidence in the optimization result
function calculateConfidence(validation: {
  mcReward: number;
  mcStdDev: number;
  successRate: number;
  pathEfficiency: number;
}) {
  const { mcReward, mcStdDev, successRate, pathEfficiency } = validation;
  
  // Higher confidence for:
  // - Higher success rate
  // - Lower standard deviation (more consistent)
  // - Higher path efficiency
  // - Positive rewards
  const confidence = 
    (successRate * 0.4) +
    (Math.max(0, 1 - mcStdDev / Math.abs(mcReward || 1)) * 0.3) +
    (Math.max(0, Math.min(1, pathEfficiency)) * 0.2) +
    (mcReward > 0 ? 0.1 : 0);

  return Math.min(1, Math.max(0, confidence));
}

// Enhanced configuration optimization that considers validation
export function robustOptimizeMDPConfiguration(
  baseMdp: MDP,
  startState: string,
  config: OptimizationConfig = {},
  callback?: OptimizationCallback
): Promise<{
  bestMdp: MDP;
  bestResult: RobustOptimizationResult;
  optimizationHistory: Array<{ mdp: MDP; result: RobustOptimizationResult }>;
}> {
  return new Promise(async (resolve) => {
    const optimizationHistory: Array<{ mdp: MDP; result: RobustOptimizationResult }> = [];
    let bestMdp = baseMdp;
    let bestResult: RobustOptimizationResult | null = null;
    let bestScore = -Infinity;

    // Try different gamma values
    const gammaValues = [0.7, 0.8, 0.9, 0.95, 0.99];
    
    for (const gamma of gammaValues) {
      const testMdp = { ...baseMdp, gamma };
      try {
        const result = await robustOptimizeMDP(testMdp, startState, config, callback);
        optimizationHistory.push({ mdp: testMdp, result });
        
        const score = result.actualPerformance * result.confidence;
        if (score > bestScore) {
          bestScore = score;
          bestMdp = testMdp;
          bestResult = result;
        }
      } catch (error) {
        console.warn(`Gamma ${gamma} failed:`, error);
      }
    }

    // Try reward scaling
    const rewardScales = [0.5, 1.0, 1.5, 2.0];
    
    for (const scale of rewardScales) {
      const testMdp = {
        ...baseMdp,
        transitions: Object.fromEntries(
          Object.entries(baseMdp.transitions).map(([key, transitions]) => [
            key,
            transitions.map(t => ({
              ...t,
              reward: (t.reward ?? 0) * scale
            }))
          ])
        )
      };
      
      try {
        const result = await robustOptimizeMDP(testMdp, startState, config, callback);
        optimizationHistory.push({ mdp: testMdp, result });
        
        const score = result.actualPerformance * result.confidence;
        if (score > bestScore) {
          bestScore = score;
          bestMdp = testMdp;
          bestResult = result;
        }
      } catch (error) {
        console.warn(`Reward scale ${scale} failed:`, error);
      }
    }

    resolve({
      bestMdp,
      bestResult: bestResult!,
      optimizationHistory
    });
  });
} 