"use client";
import { useEffect, useRef } from "react";
import type { MDP } from "@/types/mdp";
import { Network, DataSet, Node, Edge } from "vis-network/standalone";

export default function MDPGraph({ mdp }: { mdp: MDP }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // Create nodes with better styling
    const nodes = new DataSet<Node>(
      mdp.states.map((s) => ({
        id: s,
        label: s,
        shape: "circle",
        size: 30,
        color: {
          background: "#4F46E5",
          border: "#3730A3",
          highlight: { background: "#6366F1", border: "#4F46E5" },
        },
        font: { color: "white", size: 16, face: "Arial" },
        borderWidth: 2,
      }))
    );

    // Create edges with better styling and more informative labels
    const edges = new DataSet<Edge>(
      Object.entries(mdp.transitions).flatMap(([key, targets]) => {
        const [state, action] = key.split("|");
        const typedTargets = targets as Array<{ nextState: string; probability: number; reward?: number }>;
        return typedTargets.map((t) => ({
          from: state,
          to: t.nextState,
          label: `${action} (${t.probability.toFixed(2)})${t.reward !== undefined ? `, r=${t.reward}` : ""}`,
          arrows: "to",
          smooth: { enabled: true, type: "curvedCW", roundness: 0.3 },
          color: {
            color: "#6B7280",
            highlight: "#374151",
            hover: "#4B5563",
          },
          font: { 
            size: 14, 
            face: "Arial",
            color: "#374151",
            strokeWidth: 3,
            strokeColor: "white",
            align: "middle"
          },
          width: 2,
          selectionWidth: 3,
          length: 200,
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
            gravitationalConstant: -2000,
            centralGravity: 0.3,
            springLength: 200,
            springConstant: 0.04,
            damping: 0.09,
          }
        },
        nodes: { 
          shape: "circle",
          shadow: true,
        },
        edges: { 
          font: { size: 12 }, 
          color: { opacity: 0.85 },
          shadow: true,
        },
        interaction: { 
          hover: true,
          tooltipDelay: 200,
        },
        layout: {
          improvedLayout: true,
        },
        height: "100%",
        width: "100%",
      }
    );

    // Add event listeners for better UX
    network.on("stabilizationProgress", function(params) {
      // Optional: show loading progress
    });

    network.on("stabilizationIterationsDone", function() {
      // Optional: hide loading indicator
    });

    return () => network.destroy();
  }, [mdp]);

  return (
    <div className="w-full space-y-4">
      <div ref={ref} style={{ height: 600, width: "100%", minHeight: "600px" }} />
      <div className="text-sm text-gray-600 text-center bg-gray-50 p-3 rounded-lg border border-gray-200">
        <p className="font-medium">
          <span className="text-blue-600">States:</span> {mdp.states.join(", ")} | 
          <span className="text-green-600"> Actions:</span> {mdp.actions.join(", ")} | 
          <span className="text-purple-600"> γ:</span> {mdp.gamma ?? 1.0}
        </p>
      </div>
    </div>
  );
}
