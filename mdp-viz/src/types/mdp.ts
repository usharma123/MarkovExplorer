import { z } from "zod";

export const transitionSchema = z.object({
  nextState: z.string(),
  probability: z.number().min(0).max(1),
  reward: z.number().optional(),
});

export const mdpSchema = z.object({
  states: z.array(z.string()).min(1),
  actions: z.array(z.string()).min(1),
  transitions: z.record(z.string(), z.array(transitionSchema)), // key: `${state}|${action}`
  gamma: z.number().min(0).max(1).optional(),
});

export type MDP = z.infer<typeof mdpSchema>;
export type Transition = z.infer<typeof transitionSchema>;

export function actionsFromState(mdp: MDP, state: string): string[] {
  const set = new Set<string>();
  Object.keys(mdp.transitions).forEach((k) => {
    const [s, a] = k.split("|");
    if (s === state) set.add(a);
  });
  return [...set];
}

export function transitionsFor(mdp: MDP, state: string, action: string): Transition[] {
  const key = `${state}|${action}`;
  return (mdp.transitions[key] as Transition[]) ?? [];
}

export function validateTransitionMass(mdp: MDP): string[] {
  const errs: string[] = [];
  for (const [key, arr] of Object.entries(mdp.transitions)) {
    const transitions = arr as Transition[];
    const sum = transitions.reduce((acc, t) => acc + t.probability, 0);
    if (Math.abs(sum - 1) > 1e-6) errs.push(`${key} sums to ${sum}`);
  }
  return errs;
}
