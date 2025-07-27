"use client";

import { presetExamples, type PresetExample } from "@/lib/presets";

interface PresetSelectorProps {
  onLoadPreset: (preset: PresetExample) => void;
}

export default function PresetSelector({ onLoadPreset }: PresetSelectorProps) {
  const filteredPresets = presetExamples;

  const getDifficultyColor = (difficulty: PresetExample['difficulty']) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: PresetExample['category']) => {
    switch (category) {
      case 'educational': return '🎓';
      case 'research': return '🔬';
      case 'gaming': return '🎮';
      default: return '📚';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-3">Load Preset Examples</h3>
        <p className="text-gray-600 max-w-2xl mx-auto">Choose from pre-built MDP examples to get started quickly</p>
      </div>

      {/* Preset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPresets.map((preset) => (
          <div
            key={preset.id}
            className="group border border-gray-200 rounded-xl p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-white to-gray-50 hover:from-blue-50 hover:to-white"
            onClick={() => onLoadPreset(preset)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg text-white text-xl shadow-md">
                  {getCategoryIcon(preset.category)}
                </div>
                <div>
                  <h4 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">{preset.name}</h4>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${getDifficultyColor(preset.difficulty)}`}>
                    {preset.difficulty}
                  </span>
                </div>
              </div>
            </div>
            
            <p className="text-gray-600 mb-4 leading-relaxed">{preset.description}</p>
            
            <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
              <div className="flex items-center gap-1">
                <span className="font-semibold">{preset.mdp.states.length}</span>
                <span>states</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">{preset.mdp.actions.length}</span>
                <span>actions</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-semibold">γ = {preset.mdp.gamma}</span>
              </div>
            </div>
            
            <button className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
              Load Example
            </button>
          </div>
        ))}
      </div>

      {filteredPresets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No presets available.</p>
        </div>
      )}
    </div>
  );
} 