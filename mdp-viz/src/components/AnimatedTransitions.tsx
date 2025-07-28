"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MDP } from '@/types/mdp';

interface AnimatedTransitionsProps {
  mdp: MDP;
  currentPolicy: Record<string, string>;
  targetPolicy: Record<string, string>;
  valueFunction?: Record<string, number>;
  onAnimationComplete?: () => void;
}

interface PolicyChange {
  state: string;
  oldAction: string;
  newAction: string;
  valueChange: number;
}

export default function AnimatedTransitions({
  mdp,
  currentPolicy,
  targetPolicy,
  valueFunction,
  onAnimationComplete
}: AnimatedTransitionsProps) {
  const [changes, setChanges] = useState<PolicyChange[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Calculate policy changes
    const policyChanges: PolicyChange[] = [];
    
    mdp.states.forEach(state => {
      const currentAction = currentPolicy[state];
      const targetAction = targetPolicy[state];
      
      if (currentAction !== targetAction) {
        const oldValue = valueFunction?.[state] ?? 0;
        const newValue = valueFunction?.[state] ?? 0;
        
        policyChanges.push({
          state,
          oldAction: currentAction,
          newAction: targetAction,
          valueChange: newValue - oldValue
        });
      }
    });
    
    setChanges(policyChanges);
  }, [mdp.states, currentPolicy, targetPolicy, valueFunction]);

  const startAnimation = () => {
    setIsAnimating(true);
    setCurrentStep(0);
    
    const animateStep = (step: number) => {
      if (step >= changes.length) {
        setIsAnimating(false);
        onAnimationComplete?.();
        return;
      }
      
      setCurrentStep(step);
      animationRef.current = setTimeout(() => animateStep(step + 1), 1000);
    };
    
    animateStep(0);
  };

  const stopAnimation = () => {
    if (animationRef.current) {
      clearTimeout(animationRef.current);
    }
    setIsAnimating(false);
  };

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, []);

  const getStateColor = (state: string) => {
    const value = valueFunction?.[state] ?? 0;
    const normalized = Math.max(0, Math.min(1, (value + 10) / 20));
    const hue = 120 + (normalized * 60); // Green to yellow
    return `hsl(${hue}, 70%, 50%)`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Policy Animation</h3>
          <p className="text-sm text-gray-600">Watch policy changes in real-time</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={startAnimation}
            disabled={isAnimating || changes.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnimating ? 'Animating...' : 'Start Animation'}
          </button>
          
          {isAnimating && (
            <button
              onClick={stopAnimation}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Progress indicator */}
      {isAnimating && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress: {currentStep + 1} / {changes.length}</span>
            <span>{Math.round(((currentStep + 1) / changes.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentStep + 1) / changes.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Policy changes visualization */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {changes.map((change, index) => (
            <motion.div
              key={change.state}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: isAnimating && index <= currentStep ? 1 : 0.6,
                scale: isAnimating && index === currentStep ? 1.05 : 1
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                isAnimating && index === currentStep
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : isAnimating && index < currentStep
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-800">{change.state}</h4>
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getStateColor(change.state) }}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Old Action:</span>
                  <span className="font-mono bg-red-100 text-red-800 px-2 py-1 rounded">
                    {change.oldAction}
                  </span>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: isAnimating && index <= currentStep ? 1 : 0,
                    x: isAnimating && index <= currentStep ? 0 : -20
                  }}
                  className="flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </motion.div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">New Action:</span>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ 
                      opacity: isAnimating && index <= currentStep ? 1 : 0,
                      scale: isAnimating && index <= currentStep ? 1 : 0.8
                    }}
                    className="font-mono bg-green-100 text-green-800 px-2 py-1 rounded"
                  >
                    {change.newAction}
                  </motion.span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Value Change:</span>
                  <span className={`font-mono px-2 py-1 rounded ${
                    change.valueChange > 0 
                      ? 'bg-green-100 text-green-800' 
                      : change.valueChange < 0 
                      ? 'bg-red-100 text-red-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {change.valueChange > 0 ? '+' : ''}{change.valueChange.toFixed(2)}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Summary */}
      {changes.length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Total Changes:</span>
              <div className="font-semibold">{changes.length}</div>
            </div>
            <div>
              <span className="text-gray-600">Positive Changes:</span>
              <div className="font-semibold text-green-600">
                {changes.filter(c => c.valueChange > 0).length}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Negative Changes:</span>
              <div className="font-semibold text-red-600">
                {changes.filter(c => c.valueChange < 0).length}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Net Value Change:</span>
              <div className={`font-semibold ${
                changes.reduce((sum, c) => sum + c.valueChange, 0) > 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {changes.reduce((sum, c) => sum + c.valueChange, 0).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {changes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">🎯</div>
          <p>No policy changes detected</p>
          <p className="text-sm">The current policy is already optimal</p>
        </div>
      )}
    </div>
  );
} 