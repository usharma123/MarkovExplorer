"use client";
import { useEffect, useRef } from "react";
import type { MDP } from "@/types/mdp";
import { Network, DataSet, Node, Edge } from "vis-network/standalone";

export default function MDPGraph({ mdp }: { mdp: MDP }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Create nodes with better styling and larger size for better spacing
    const nodes = new DataSet<Node>(
      mdp.states.map((s) => ({
        id: s,
        label: s,
        shape: "circle",
        size: 60, // Increased size for better spacing
        color: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "#4C51BF",
          highlight: { 
            background: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%)", 
            border: "#5B21B6" 
          },
        },
        font: { 
          color: "white", 
          size: 20, 
          face: "Inter, Arial, sans-serif",
          strokeWidth: 2,
          strokeColor: "rgba(0,0,0,0.3)"
        },
        borderWidth: 3,
        shadow: {
          enabled: true,
          color: "rgba(0,0,0,0.2)",
          size: 10,
          x: 2,
          y: 2
        },
        mass: 3, // Increased mass for better stability
      }))
    );

    // Create edges with simplified labels and better spacing
    const edges = new DataSet<Edge>(
      Object.entries(mdp.transitions).flatMap(([key, targets]) => {
        const [state, action] = key.split("|");
        const typedTargets = targets as Array<{ nextState: string; probability: number; reward?: number }>;
        return typedTargets.map((t) => ({
          from: state,
          to: t.nextState,
          // Simplified label to reduce crowding
          label: t.probability === 1.0 ? action : `${action} (${t.probability.toFixed(1)})`,
          arrows: {
            to: {
              enabled: true,
              scaleFactor: 1.2,
              type: "arrow"
            }
          },
          smooth: { enabled: true, type: "curvedCW", roundness: 0.3 },
          color: {
            color: "#8B5CF6",
            highlight: "#7C3AED",
            hover: "#A855F7",
            opacity: 0.7
          },
          font: { 
            size: 12, 
            face: "Inter, Arial, sans-serif",
            color: "#1F2937",
            strokeWidth: 3,
            strokeColor: "rgba(255,255,255,0.9)",
            align: "middle"
          },
          width: 2,
          selectionWidth: 3,
          length: 400, // Increased length for better spacing
          shadow: {
            enabled: true,
            color: "rgba(0,0,0,0.1)",
            size: 5,
            x: 1,
            y: 1
          }
        }));
      })
    );

    const network = new Network(
      ref.current,
      { nodes, edges },
      {
        physics: { 
          stabilization: true,
          barnesHut: {
            gravitationalConstant: -5000, // Stronger repulsion
            centralGravity: 0.1, // Reduced central gravity
            springLength: 500, // Increased spring length
            springConstant: 0.02, // Reduced spring constant
            damping: 0.15, // Increased damping
            avoidOverlap: 1.0 // Maximum overlap avoidance
          }
        },
        nodes: { 
          shape: "circle",
          borderWidth: 3,
          shadow: {
            enabled: true,
            color: "rgba(0,0,0,0.2)",
            size: 10,
            x: 2,
            y: 2
          }
        },
        edges: { 
          font: { size: 12 }, 
          color: { opacity: 0.7 },
          shadow: true,
          smooth: {
            enabled: true,
            type: "curvedCW",
            roundness: 0.3
          }
        },
        interaction: { 
          hover: true,
          tooltipDelay: 200,
          zoomView: true,
          dragView: true
        },
        layout: {
          improvedLayout: true,
          hierarchical: false
        },
        height: "100%",
        width: "100%"
      }
    );

    // Add event listeners for better UX
    network.on("stabilizationProgress", function() {
      // Optional: show loading progress
    });

    network.on("stabilizationIterationsDone", function() {
      // Optional: hide loading indicator
    });

    // Note: Tooltips removed to prevent positioning errors
    // Edge details are now shown in simplified labels

    return () => network.destroy();
  }, [mdp]);

  return (
    <div className="w-full space-y-4">
      <div 
        ref={ref} 
        style={{ 
          height: 700, // Increased height for better spacing
          width: "100%", 
          minHeight: "700px",
          background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
          borderRadius: "12px",
          border: "1px solid #e2e8f0"
        }} 
      />
      <div className="text-sm text-gray-600 text-center bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <p className="font-medium">
          <span className="text-blue-600 font-semibold">States:</span> {mdp.states.join(", ")} | 
          <span className="text-green-600 font-semibold"> Actions:</span> {mdp.actions.join(", ")} | 
          <span className="text-purple-600 font-semibold"> γ:</span> {mdp.gamma ?? 1.0}
        </p>
      </div>
    </div>
  );
}
