# MarkovExplorer - MDP Visualization & Optimization Tool

A comprehensive web application for visualizing, simulating, and optimizing Markov Decision Processes (MDPs) using modern reinforcement learning techniques.

## Features

### **MDP Configuration & Visualization**
- **Visual MDP Builder**: Interactive interface for creating and editing MDPs
- **Graph Visualization**: Dynamic visualization of states, actions, and transitions
- **Preset Examples**: Pre-built MDP examples for learning and testing
- **Real-time Validation**: Instant feedback on MDP configuration errors

### **Monte Carlo Simulation**
- **Configurable Parameters**: Episodes, max steps, start state, histogram bins
- **Comprehensive Results**: Average reward, steps, terminal distribution, path analysis
- **Visual Analytics**: 
  - Reward distribution histograms
  - Terminal state pie charts
  - Transition frequency analysis
  - Action usage statistics
  - Most common paths

### **Agent Optimizer**
- **Multi-Method Optimization**: Value Iteration, Policy Iteration, Q-Learning, Monte Carlo Policy Search
- **Robust Optimization**: Automatically tries multiple algorithms and validates results
- **Performance Comparison**: Baseline vs. optimized performance metrics
- **Policy Evaluation**: Real-world testing of optimized policies
- **Confidence Metrics**: Reliability scores for optimization results

### **Advanced Analytics**
- **Results Interpreter**: AI-powered analysis of simulation results
- **Performance Metrics**: Success rates, path efficiency, standard deviation
- **Convergence Tracking**: Visual charts showing optimization progress
- **Policy Validation**: Monte Carlo validation of theoretical optimizations

## Architecture

### **Frontend (Next.js 14 + TypeScript)**
```
src/
├── app/                    # Next.js app router
│   ├── page.tsx           # Main application page
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── MDPConfigurator.tsx    # MDP builder interface
│   ├── MDPGraph.tsx           # Graph visualization
│   ├── PresetSelector.tsx     # Preset examples
│   ├── DistributionChart.tsx  # Reward distribution
│   ├── TerminalPie.tsx        # Terminal state chart
│   ├── ResultsInterpreter.tsx # AI analysis
│   └── AgentOptimizer.tsx     # Optimization interface
├── lib/                   # Core logic
│   ├── presets.ts         # MDP examples
│   ├── sim.ts             # Monte Carlo simulation
│   └── optimizer.ts       # RL optimization algorithms
└── types/                 # TypeScript definitions
    └── mdp.ts            # MDP data structures
```

### **Key Technologies**
- **Next.js 14**: React framework with app router
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first styling
- **Chart.js**: Data visualization
- **Zod**: Runtime type validation

## MDP Examples

### **Educational Presets**
- **Simple 3-State MDP**: Basic Markov chain for learning
- **2x2 Grid World**: Classic navigation problem
- **Robot Navigation**: Multi-room environment

### **Research Presets**
- **Gambler's Problem**: Classic RL problem
- **Complex Navigation**: Advanced multi-state scenarios

## Optimization Algorithms

### **Value Iteration**
- Classical dynamic programming approach
- Guaranteed convergence to optimal policy
- Best for small to medium MDPs

### **Policy Iteration**
- Iterative policy evaluation and improvement
- Often faster convergence than value iteration
- Good for structured MDPs

### **Q-Learning**
- Model-free reinforcement learning
- Works without complete MDP knowledge
- Robust for uncertain environments

### **Monte Carlo Policy Search**
- Direct policy optimization through simulation
- Validates results against real performance
- Handles complex reward structures

### **Robust Optimization**
- **Multi-Method Approach**: Tries all algorithms automatically
- **Validation**: Monte Carlo testing of theoretical results
- **Confidence Scoring**: Reliability metrics for each method
- **Adaptive Selection**: Chooses best method for your MDP

## Performance Metrics

### **Baseline Analysis**
- Average reward per episode
- Terminal state distribution
- Path length analysis
- Action usage patterns

### **Optimization Results**
- Theoretical optimal value
- Actual performance (Monte Carlo validated)
- Policy improvement percentage
- Confidence scores

### **Validation Metrics**
- Success rate (goal achievement)
- Path efficiency (reward per step)
- Standard deviation (consistency)
- Convergence history

## Getting Started

### **Prerequisites**
- Node.js 18+ 
- npm, yarn, pnpm, or bun

### **Installation**
```bash
# Clone the repository
git clone <repository-url>
cd mdp-viz

# Install dependencies
npm install
# or
pnpm install

# Start development server
npm run dev
# or
pnpm dev
```

### **Usage**
1. **Configure MDP**: Use the visual builder or load a preset
2. **Run Simulation**: Execute Monte Carlo analysis
3. **Review Results**: Analyze performance metrics and visualizations
4. **Optimize Policy**: Use the Agent Optimizer to find optimal policies
5. **Validate Results**: Compare theoretical vs. actual performance

## Technical Details

### **MDP Data Structure**
```typescript
interface MDP {
  states: string[];
  actions: string[];
  transitions: Record<string, Transition[]>;
  gamma?: number; // discount factor
}

interface Transition {
  nextState: string;
  probability: number;
  reward?: number;
}
```

### **Simulation Engine**
- **Monte Carlo Simulation**: Episodic sampling with configurable parameters
- **Episode Tracking**: Path analysis, visit counts, action frequencies
- **Statistical Analysis**: Mean, variance, distribution analysis

### **Optimization Engine**
- **Multi-Algorithm Support**: Value iteration, policy iteration, Q-learning
- **Validation Pipeline**: Monte Carlo testing of theoretical results
- **Confidence Metrics**: Reliability scoring for optimization results

## UI/UX Features

### **Responsive Design**
- Mobile-friendly interface
- Adaptive layouts for different screen sizes
- Touch-friendly controls

### **Interactive Visualizations**
- **MDP Graph**: Draggable nodes, zoomable interface
- **Charts**: Interactive histograms and pie charts
- **Real-time Updates**: Live parameter adjustment

### **User Experience**
- **Progressive Disclosure**: Information revealed as needed
- **Error Handling**: Clear feedback for invalid configurations
- **Loading States**: Visual feedback during computations

## Roadmap

### **Upcoming Features**
- **Gap Minimization**: Advanced techniques to reduce theory-practice gaps
- **Multi-Objective Optimization**: Balancing multiple performance metrics
- **Policy Comparison**: Side-by-side analysis of different policies
- **Export/Import**: Save and load MDP configurations
- **Advanced Visualizations**: 3D graphs, animated transitions

### **Gap Minimization (Next Priority)**
- **Theory-Practice Alignment**: Reducing differences between theoretical and actual performance
- **Robust Policy Design**: Policies that work well under uncertainty
- **Adaptive Optimization**: Dynamic adjustment based on validation results
- **Confidence Intervals**: Statistical bounds on optimization results

## Contributing

### **Development Setup**
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests (when implemented)
npm test

# Build for production
npm run build
```

### **Code Style**
- TypeScript for type safety
- ESLint for code quality
- Prettier for formatting
- Component-based architecture

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- **Next.js Team**: For the excellent React framework
- **Reinforcement Learning Community**: For foundational algorithms
- **Open Source Contributors**: For various libraries and tools

---

**MarkovExplorer** - Making MDPs accessible, understandable, and optimizable through interactive visualization and advanced reinforcement learning techniques.
