"use client";

import { useState, useEffect } from "react";
import { type MDP, type Transition, validateTransitionMass } from "@/types/mdp";

interface MDPConfiguratorProps {
  onMDPChange: (mdp: MDP | null) => void;
  onError: (error: string | null) => void;
}

interface TransitionConfig {
  nextState: string;
  probability: number;
  reward: number;
}

interface StateActionConfig {
  [state: string]: {
    [action: string]: TransitionConfig[];
  };
}

export default function MDPConfigurator({ onMDPChange, onError }: MDPConfiguratorProps) {
  const [states, setStates] = useState<string[]>(["S0", "S1", "S2"]);
  const [actions, setActions] = useState<string[]>(["a", "b"]);
  const [gamma, setGamma] = useState<number>(0.95);
  const [editingStates, setEditingStates] = useState<{ [key: string]: string | undefined }>({});
  const [editingActions, setEditingActions] = useState<{ [key: string]: string | undefined }>({});
  const [transitions, setTransitions] = useState<StateActionConfig>({
    S0: {
      a: [
        { nextState: "S1", probability: 0.9, reward: 1 },
        { nextState: "S2", probability: 0.1, reward: 0 }
      ],
      b: [{ nextState: "S2", probability: 1.0, reward: 0 }]
    },
    S1: {
      a: [{ nextState: "S2", probability: 1.0, reward: 0 }],
      b: [{ nextState: "S0", probability: 1.0, reward: 0 }]
    },
    S2: {
      a: [{ nextState: "S2", probability: 1.0, reward: 0 }],
      b: [{ nextState: "S0", probability: 1.0, reward: 0 }]
    }
  });

  // Update MDP when configuration changes
  useEffect(() => {
    try {
      const mdpTransitions: MDP["transitions"] = {};
      
      // Convert our internal format to MDP format
      for (const state of states) {
        for (const action of actions) {
          const key = `${state}|${action}`;
          const transitionList = transitions[state]?.[action] || [];
          
          // Filter out transitions with 0 probability
          const validTransitions = transitionList.filter(t => t.probability > 0);
          
          if (validTransitions.length > 0) {
            mdpTransitions[key] = validTransitions;
          }
        }
      }

      const mdp: MDP = {
        states,
        actions,
        transitions: mdpTransitions,
        gamma
      };

      // Validate transition probabilities
      const massErrors = validateTransitionMass(mdp);
      if (massErrors.length > 0) {
        onError("Probability mass errors: " + massErrors.join(", "));
        onMDPChange(null);
        return;
      }

      onError(null);
      onMDPChange(mdp);
      console.log("MDPConfigurator: Updated MDP", mdp);
    } catch (error) {
      onError("Invalid MDP configuration");
      onMDPChange(null);
    }
  }, [states, actions, transitions, gamma]);

  const addState = () => {
    const newState = `S${states.length}`;
    setStates([...states, newState]);
    
    // Initialize transitions for new state
    const newTransitions = { ...transitions };
    newTransitions[newState] = {};
    for (const action of actions) {
      newTransitions[newState][action] = [{ nextState: states[0], probability: 1.0, reward: 0 }];
    }
    setTransitions(newTransitions);
  };

  const startEditingState = (state: string) => {
    setEditingStates(prev => ({ ...prev, [state]: state }));
  };

  const updateEditingState = (oldState: string, newValue: string) => {
    setEditingStates(prev => ({ ...prev, [oldState]: newValue }));
  };

  const finishEditingState = (oldState: string) => {
    const newState = editingStates[oldState];
    if (!newState || newState.trim() === '' || (newState !== oldState && states.includes(newState))) {
      // Reset to original if invalid
      setEditingStates(prev => ({ ...prev, [oldState]: oldState }));
      return;
    }
    
    if (newState === oldState) {
      // No change, just stop editing
      setEditingStates(prev => ({ ...prev, [oldState]: undefined }));
      return;
    }
    
    // Apply the rename
    setStates(states.map(s => s === oldState ? newState : s));
    
    // Update transitions to use new state name
    const newTransitions = { ...transitions };
    
    // Update the state key itself
    if (newTransitions[oldState]) {
      newTransitions[newState] = newTransitions[oldState];
      delete newTransitions[oldState];
    }
    
    // Update all references to the old state name
    for (const state of Object.keys(newTransitions)) {
      for (const action of Object.keys(newTransitions[state])) {
        newTransitions[state][action] = newTransitions[state][action].map(t => ({
          ...t,
          nextState: t.nextState === oldState ? newState : t.nextState
        }));
      }
    }
    
    setTransitions(newTransitions);
    setEditingStates(prev => ({ ...prev, [oldState]: undefined }));
  };

  const removeState = (stateToRemove: string) => {
    if (states.length <= 1) return;
    
    setStates(states.filter(s => s !== stateToRemove));
    
    // Remove transitions involving this state
    const newTransitions = { ...transitions };
    delete newTransitions[stateToRemove];
    
    // Update all transitions that reference the removed state
    for (const state of Object.keys(newTransitions)) {
      for (const action of Object.keys(newTransitions[state])) {
        newTransitions[state][action] = newTransitions[state][action]
          .filter(t => t.nextState !== stateToRemove)
          .map(t => t.nextState === stateToRemove ? { ...t, nextState: states[0] } : t);
        
        // If no transitions remain, add a default one
        if (newTransitions[state][action].length === 0) {
          newTransitions[state][action] = [{ nextState: states[0], probability: 1.0, reward: 0 }];
        }
      }
    }
    
    setTransitions(newTransitions);
  };

  const addAction = () => {
    const newAction = `action${actions.length}`;
    setActions([...actions, newAction]);
    
    // Initialize transitions for new action
    const newTransitions = { ...transitions };
    for (const state of states) {
      if (!newTransitions[state]) newTransitions[state] = {};
      newTransitions[state][newAction] = [{ nextState: states[0], probability: 1.0, reward: 0 }];
    }
    setTransitions(newTransitions);
  };

  const startEditingAction = (action: string) => {
    setEditingActions(prev => ({ ...prev, [action]: action }));
  };

  const updateEditingAction = (oldAction: string, newValue: string) => {
    setEditingActions(prev => ({ ...prev, [oldAction]: newValue }));
  };

  const finishEditingAction = (oldAction: string) => {
    const newAction = editingActions[oldAction];
    if (!newAction || newAction.trim() === '' || (newAction !== oldAction && actions.includes(newAction))) {
      // Reset to original if invalid
      setEditingActions(prev => ({ ...prev, [oldAction]: oldAction }));
      return;
    }
    
    if (newAction === oldAction) {
      // No change, just stop editing
      setEditingActions(prev => ({ ...prev, [oldAction]: undefined }));
      return;
    }
    
    // Apply the rename
    setActions(actions.map(a => a === oldAction ? newAction : a));
    
    // Update transitions to use new action name
    const newTransitions = { ...transitions };
    
    // Update all state-action keys
    for (const state of Object.keys(newTransitions)) {
      if (newTransitions[state][oldAction]) {
        newTransitions[state][newAction] = newTransitions[state][oldAction];
        delete newTransitions[state][oldAction];
      }
    }
    
    setTransitions(newTransitions);
    setEditingActions(prev => ({ ...prev, [oldAction]: undefined }));
  };

  const removeAction = (actionToRemove: string) => {
    if (actions.length <= 1) return;
    
    setActions(actions.filter(a => a !== actionToRemove));
    
    // Remove transitions for this action
    const newTransitions = { ...transitions };
    for (const state of Object.keys(newTransitions)) {
      delete newTransitions[state][actionToRemove];
    }
    setTransitions(newTransitions);
  };

  const updateTransition = (state: string, action: string, index: number, field: keyof TransitionConfig, value: any) => {
    const newTransitions = { ...transitions };
    if (!newTransitions[state]) newTransitions[state] = {};
    if (!newTransitions[state][action]) newTransitions[state][action] = [];
    
    newTransitions[state][action][index] = {
      ...newTransitions[state][action][index],
      [field]: value
    };
    
    setTransitions(newTransitions);
  };

  const addTransition = (state: string, action: string) => {
    const newTransitions = { ...transitions };
    if (!newTransitions[state]) newTransitions[state] = {};
    if (!newTransitions[state][action]) newTransitions[state][action] = [];
    
    newTransitions[state][action].push({
      nextState: states[0],
      probability: 0,
      reward: 0
    });
    
    setTransitions(newTransitions);
  };

  const removeTransition = (state: string, action: string, index: number) => {
    const newTransitions = { ...transitions };
    newTransitions[state][action].splice(index, 1);
    
    // If no transitions remain, add a default one
    if (newTransitions[state][action].length === 0) {
      newTransitions[state][action] = [{ nextState: states[0], probability: 1.0, reward: 0 }];
    }
    
    setTransitions(newTransitions);
  };

  const getTotalProbability = (state: string, action: string) => {
    const transitionList = transitions[state]?.[action] || [];
    return transitionList.reduce((sum, t) => sum + t.probability, 0);
  };

    return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">MDP Configuration</h2>
        <p className="text-gray-600">Configure your Markov Decision Process using the interactive controls below</p>
      </div>

      {/* States Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">States</h3>
            <p className="text-sm text-gray-600 mt-1">Define the possible states in your MDP</p>
          </div>
          <button
            onClick={addState}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add State
            </span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {states.map((state, index) => (
            <div key={state} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
                <input
                  type="text"
                  value={editingStates[state] !== undefined ? editingStates[state] || '' : state}
                  onChange={(e) => updateEditingState(state, e.target.value)}
                  onFocus={() => startEditingState(state)}
                  onBlur={() => finishEditingState(state)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      finishEditingState(state);
                    } else if (e.key === 'Escape') {
                      setEditingStates(prev => ({ ...prev, [state]: undefined }));
                    }
                  }}
                  className="font-mono font-semibold text-gray-800 bg-transparent border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 min-w-0 flex-1"
                  placeholder="State name"
                />
              </div>
              {states.length > 1 && (
                <button
                  onClick={() => removeState(state)}
                  className="text-red-500 hover:text-red-700 text-xl font-bold px-2 py-1 rounded-full hover:bg-red-100 transition-all duration-200 ml-2"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Actions</h3>
            <p className="text-sm text-gray-600 mt-1">Define the available actions in your MDP</p>
          </div>
          <button
            onClick={addAction}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Action
            </span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <div key={action} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{String.fromCharCode(97 + index)}</span>
                </div>
                <input
                  type="text"
                  value={editingActions[action] !== undefined ? editingActions[action] || '' : action}
                  onChange={(e) => updateEditingAction(action, e.target.value)}
                  onFocus={() => startEditingAction(action)}
                  onBlur={() => finishEditingAction(action)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      finishEditingAction(action);
                    } else if (e.key === 'Escape') {
                      setEditingActions(prev => ({ ...prev, [action]: undefined }));
                    }
                  }}
                  className="font-mono font-semibold text-gray-800 bg-transparent border-none outline-none focus:ring-2 focus:ring-green-500 rounded px-2 py-1 min-w-0 flex-1"
                  placeholder="Action name"
                />
              </div>
              {actions.length > 1 && (
                <button
                  onClick={() => removeAction(action)}
                  className="text-red-500 hover:text-red-700 text-xl font-bold px-2 py-1 rounded-full hover:bg-red-100 transition-all duration-200 ml-2"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Gamma Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Discount Factor (γ)</h3>
          <p className="text-sm text-gray-600">Controls how much future rewards are valued relative to immediate rewards</p>
        </div>
        <div className="space-y-4">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={gamma}
                onChange={(e) => setGamma(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
            <div className="bg-blue-100 px-4 py-2 rounded-lg">
              <span className="font-mono text-lg font-bold text-blue-800">{gamma.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
            <span className="font-medium">Current value:</span> {gamma.toFixed(2)} 
            {gamma < 0.5 && " (Low discount - future rewards matter less)"}
            {gamma >= 0.5 && gamma < 0.9 && " (Medium discount - balanced future consideration)"}
            {gamma >= 0.9 && " (High discount - future rewards matter more)"}
          </div>
        </div>
      </div>

      {/* Transitions Configuration */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Transitions</h3>
          <p className="text-sm text-gray-600">Configure state transitions, probabilities, and rewards for each action</p>
        </div>
        <div className="space-y-8">
          {states.map((state) => (
            <div key={state} className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{state}</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-800">State: {state}</h4>
              </div>
              <div className="space-y-6">
                {actions.map((action) => {
                  const transitionList = transitions[state]?.[action] || [];
                  const totalProb = getTotalProbability(state, action);
                  
                  return (
                    <div key={action} className="border-l-4 border-blue-400 pl-6 bg-white rounded-r-xl p-6 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-xs">{action}</span>
                          </div>
                          <h5 className="font-semibold text-gray-800">Action: {action}</h5>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className={`text-sm font-medium px-3 py-2 rounded-full ${
                            totalProb === 1 ? 'text-green-700 bg-green-100 border border-green-200' : 'text-red-700 bg-red-100 border border-red-200'
                          }`}>
                            Total: {totalProb.toFixed(3)}
                          </span>
                          <button
                            onClick={() => addTransition(state, action)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Add Transition
                            </span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        {transitionList.map((transition, index) => (
                          <div key={index} className="border border-gray-200 rounded-xl p-4 bg-gray-50">
                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                              <div className="space-y-2">
                                <label className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Next State</label>
                                <select
                                  value={transition.nextState}
                                  onChange={(e) => updateTransition(state, action, index, 'nextState', e.target.value)}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                >
                                  {states.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Probability</label>
                                <div className="flex items-center gap-4">
                                  <div className="flex-1">
                                    <input
                                      type="range"
                                      min="0"
                                      max="1"
                                      step="0.01"
                                      value={transition.probability}
                                      onChange={(e) => updateTransition(state, action, index, 'probability', Number(e.target.value))}
                                      className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                                    />
                                  </div>
                                  <div className="bg-blue-100 px-3 py-1 rounded-lg">
                                    <span className="font-mono text-sm font-bold text-blue-800 min-w-[3rem] text-center">
                                      {transition.probability.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-xs text-gray-600 font-semibold uppercase tracking-wide">Reward</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={transition.reward}
                                  onChange={(e) => updateTransition(state, action, index, 'reward', Number(e.target.value))}
                                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                                />
                              </div>
                              
                              <div className="flex items-end justify-end">
                                <button
                                  onClick={() => removeTransition(state, action, index)}
                                  className="text-red-500 hover:text-red-700 text-2xl font-bold px-3 py-2 rounded-full hover:bg-red-100 transition-all duration-200"
                                  disabled={transitionList.length <= 1}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 