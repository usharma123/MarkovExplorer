import { type MDP } from "@/types/mdp";

export interface PresetExample {
  id: string;
  name: string;
  description: string;
  category: "educational" | "research" | "gaming";
  difficulty: "beginner" | "intermediate" | "advanced";
  mdp: MDP;
}

export const presetExamples: PresetExample[] = [
  {
    id: "simple-3-state",
    name: "Simple 3-State MDP",
    description: "A basic 3-state Markov chain with deterministic transitions. Great for learning the basics.",
    category: "educational",
    difficulty: "beginner",
    mdp: {
      states: ["Start", "Middle", "Goal"],
      actions: ["Forward", "Stay"],
      gamma: 0.9,
      transitions: {
        "Start|Forward": [
          { nextState: "Middle", probability: 0.8, reward: 0 },
          { nextState: "Start", probability: 0.2, reward: 0 }
        ],
        "Start|Stay": [
          { nextState: "Start", probability: 1.0, reward: 0 }
        ],
        "Middle|Forward": [
          { nextState: "Goal", probability: 0.9, reward: 10 },
          { nextState: "Middle", probability: 0.1, reward: 0 }
        ],
        "Middle|Stay": [
          { nextState: "Middle", probability: 1.0, reward: 1 }
        ],
        "Goal|Forward": [
          { nextState: "Goal", probability: 1.0, reward: 0 }
        ],
        "Goal|Stay": [
          { nextState: "Goal", probability: 1.0, reward: 0 }
        ]
      }
    }
  },
  {
    id: "grid-world-2x2",
    name: "2x2 Grid World",
    description: "A classic grid world problem where an agent navigates to reach a goal while avoiding obstacles.",
    category: "educational",
    difficulty: "beginner",
    mdp: {
      states: ["(0,0)", "(0,1)", "(1,0)", "(1,1)"],
      actions: ["Up", "Down", "Left", "Right"],
      gamma: 0.95,
      transitions: {
        "(0,0)|Up": [
          { nextState: "(0,0)", probability: 1.0, reward: -1 }
        ],
        "(0,0)|Down": [
          { nextState: "(1,0)", probability: 0.8, reward: 0 },
          { nextState: "(0,0)", probability: 0.2, reward: -1 }
        ],
        "(0,0)|Left": [
          { nextState: "(0,0)", probability: 1.0, reward: -1 }
        ],
        "(0,0)|Right": [
          { nextState: "(0,1)", probability: 0.8, reward: 0 },
          { nextState: "(0,0)", probability: 0.2, reward: -1 }
        ],
        "(0,1)|Up": [
          { nextState: "(0,1)", probability: 1.0, reward: -1 }
        ],
        "(0,1)|Down": [
          { nextState: "(1,1)", probability: 0.8, reward: 0 },
          { nextState: "(0,1)", probability: 0.2, reward: -1 }
        ],
        "(0,1)|Left": [
          { nextState: "(0,0)", probability: 0.8, reward: 0 },
          { nextState: "(0,1)", probability: 0.2, reward: -1 }
        ],
        "(0,1)|Right": [
          { nextState: "(0,1)", probability: 1.0, reward: -1 }
        ],
        "(1,0)|Up": [
          { nextState: "(0,0)", probability: 0.8, reward: 0 },
          { nextState: "(1,0)", probability: 0.2, reward: -1 }
        ],
        "(1,0)|Down": [
          { nextState: "(1,0)", probability: 1.0, reward: -1 }
        ],
        "(1,0)|Left": [
          { nextState: "(1,0)", probability: 1.0, reward: -1 }
        ],
        "(1,0)|Right": [
          { nextState: "(1,1)", probability: 0.8, reward: 0 },
          { nextState: "(1,0)", probability: 0.2, reward: -1 }
        ],
        "(1,1)|Up": [
          { nextState: "(0,1)", probability: 0.8, reward: 0 },
          { nextState: "(1,1)", probability: 0.2, reward: -1 }
        ],
        "(1,1)|Down": [
          { nextState: "(1,1)", probability: 1.0, reward: -1 }
        ],
        "(1,1)|Left": [
          { nextState: "(1,0)", probability: 0.8, reward: 0 },
          { nextState: "(1,1)", probability: 0.2, reward: -1 }
        ],
        "(1,1)|Right": [
          { nextState: "(1,1)", probability: 1.0, reward: 100 }
        ]
      }
    }
  },
  {
    id: "gamblers-problem",
    name: "Gambler's Problem",
    description: "A classic reinforcement learning problem where a gambler tries to reach a target amount.",
    category: "research",
    difficulty: "intermediate",
    mdp: {
      states: ["$0", "$1", "$2", "$3", "$4", "$5"],
      actions: ["Bet $1", "Bet $2", "Bet $3", "Bet $4", "Bet $5"],
      gamma: 0.9,
      transitions: {
        "$0|Bet $1": [{ nextState: "$0", probability: 1.0, reward: 0 }],
        "$0|Bet $2": [{ nextState: "$0", probability: 1.0, reward: 0 }],
        "$0|Bet $3": [{ nextState: "$0", probability: 1.0, reward: 0 }],
        "$0|Bet $4": [{ nextState: "$0", probability: 1.0, reward: 0 }],
        "$0|Bet $5": [{ nextState: "$0", probability: 1.0, reward: 0 }],
        "$1|Bet $1": [
          { nextState: "$2", probability: 0.4, reward: 0 },
          { nextState: "$0", probability: 0.6, reward: 0 }
        ],
        "$1|Bet $2": [{ nextState: "$1", probability: 1.0, reward: 0 }],
        "$1|Bet $3": [{ nextState: "$1", probability: 1.0, reward: 0 }],
        "$1|Bet $4": [{ nextState: "$1", probability: 1.0, reward: 0 }],
        "$1|Bet $5": [{ nextState: "$1", probability: 1.0, reward: 0 }],
        "$2|Bet $1": [
          { nextState: "$3", probability: 0.4, reward: 0 },
          { nextState: "$1", probability: 0.6, reward: 0 }
        ],
        "$2|Bet $2": [
          { nextState: "$4", probability: 0.4, reward: 0 },
          { nextState: "$0", probability: 0.6, reward: 0 }
        ],
        "$2|Bet $3": [{ nextState: "$2", probability: 1.0, reward: 0 }],
        "$2|Bet $4": [{ nextState: "$2", probability: 1.0, reward: 0 }],
        "$2|Bet $5": [{ nextState: "$2", probability: 1.0, reward: 0 }],
        "$3|Bet $1": [
          { nextState: "$4", probability: 0.4, reward: 0 },
          { nextState: "$2", probability: 0.6, reward: 0 }
        ],
        "$3|Bet $2": [
          { nextState: "$5", probability: 0.4, reward: 0 },
          { nextState: "$1", probability: 0.6, reward: 0 }
        ],
        "$3|Bet $3": [
          { nextState: "$6", probability: 0.4, reward: 0 },
          { nextState: "$0", probability: 0.6, reward: 0 }
        ],
        "$3|Bet $4": [{ nextState: "$3", probability: 1.0, reward: 0 }],
        "$3|Bet $5": [{ nextState: "$3", probability: 1.0, reward: 0 }],
        "$4|Bet $1": [
          { nextState: "$5", probability: 0.4, reward: 0 },
          { nextState: "$3", probability: 0.6, reward: 0 }
        ],
        "$4|Bet $2": [
          { nextState: "$6", probability: 0.4, reward: 0 },
          { nextState: "$2", probability: 0.6, reward: 0 }
        ],
        "$4|Bet $3": [
          { nextState: "$7", probability: 0.4, reward: 0 },
          { nextState: "$1", probability: 0.6, reward: 0 }
        ],
        "$4|Bet $4": [
          { nextState: "$8", probability: 0.4, reward: 0 },
          { nextState: "$0", probability: 0.6, reward: 0 }
        ],
        "$4|Bet $5": [{ nextState: "$4", probability: 1.0, reward: 0 }],
        "$5|Bet $1": [
          { nextState: "$6", probability: 0.4, reward: 0 },
          { nextState: "$4", probability: 0.6, reward: 0 }
        ],
        "$5|Bet $2": [
          { nextState: "$7", probability: 0.4, reward: 0 },
          { nextState: "$3", probability: 0.6, reward: 0 }
        ],
        "$5|Bet $3": [
          { nextState: "$8", probability: 0.4, reward: 0 },
          { nextState: "$2", probability: 0.6, reward: 0 }
        ],
        "$5|Bet $4": [
          { nextState: "$9", probability: 0.4, reward: 0 },
          { nextState: "$1", probability: 0.6, reward: 0 }
        ],
        "$5|Bet $5": [
          { nextState: "$10", probability: 0.4, reward: 0 },
          { nextState: "$0", probability: 0.6, reward: 0 }
        ]
      }
    }
  },
  {
    id: "robot-navigation",
    name: "Robot Navigation",
    description: "A robot navigating through a simple environment with obstacles and goals.",
    category: "research",
    difficulty: "intermediate",
    mdp: {
      states: ["Start", "Hallway", "Room A", "Room B", "Goal"],
      actions: ["Move Forward", "Turn Left", "Turn Right", "Wait"],
      gamma: 0.8,
      transitions: {
        "Start|Move Forward": [
          { nextState: "Hallway", probability: 0.7, reward: 0 },
          { nextState: "Start", probability: 0.3, reward: -1 }
        ],
        "Start|Turn Left": [
          { nextState: "Start", probability: 1.0, reward: -1 }
        ],
        "Start|Turn Right": [
          { nextState: "Start", probability: 1.0, reward: -1 }
        ],
        "Start|Wait": [
          { nextState: "Start", probability: 1.0, reward: -1 }
        ],
        "Hallway|Move Forward": [
          { nextState: "Room A", probability: 0.4, reward: 0 },
          { nextState: "Room B", probability: 0.4, reward: 0 },
          { nextState: "Hallway", probability: 0.2, reward: -1 }
        ],
        "Hallway|Turn Left": [
          { nextState: "Room A", probability: 0.8, reward: 0 },
          { nextState: "Hallway", probability: 0.2, reward: -1 }
        ],
        "Hallway|Turn Right": [
          { nextState: "Room B", probability: 0.8, reward: 0 },
          { nextState: "Hallway", probability: 0.2, reward: -1 }
        ],
        "Hallway|Wait": [
          { nextState: "Hallway", probability: 1.0, reward: -1 }
        ],
        "Room A|Move Forward": [
          { nextState: "Goal", probability: 0.6, reward: 10 },
          { nextState: "Room A", probability: 0.4, reward: -1 }
        ],
        "Room A|Turn Left": [
          { nextState: "Room A", probability: 1.0, reward: -1 }
        ],
        "Room A|Turn Right": [
          { nextState: "Room A", probability: 1.0, reward: -1 }
        ],
        "Room A|Wait": [
          { nextState: "Room A", probability: 1.0, reward: -1 }
        ],
        "Room B|Move Forward": [
          { nextState: "Goal", probability: 0.3, reward: 5 },
          { nextState: "Room B", probability: 0.7, reward: -1 }
        ],
        "Room B|Turn Left": [
          { nextState: "Room B", probability: 1.0, reward: -1 }
        ],
        "Room B|Turn Right": [
          { nextState: "Room B", probability: 1.0, reward: -1 }
        ],
        "Room B|Wait": [
          { nextState: "Room B", probability: 1.0, reward: -1 }
        ],
        "Goal|Move Forward": [
          { nextState: "Goal", probability: 1.0, reward: 0 }
        ],
        "Goal|Turn Left": [
          { nextState: "Goal", probability: 1.0, reward: 0 }
        ],
        "Goal|Turn Right": [
          { nextState: "Goal", probability: 1.0, reward: 0 }
        ],
        "Goal|Wait": [
          { nextState: "Goal", probability: 1.0, reward: 0 }
        ]
      }
    }
  }
];

export function getPresetById(id: string): PresetExample | undefined {
  return presetExamples.find(preset => preset.id === id);
}

export function getPresetsByCategory(category: PresetExample['category']): PresetExample[] {
  return presetExamples.filter(preset => preset.category === category);
}

export function getPresetsByDifficulty(difficulty: PresetExample['difficulty']): PresetExample[] {
  return presetExamples.filter(preset => preset.difficulty === difficulty);
} 