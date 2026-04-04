import React from "react";
import { Config } from "@web-builder/puck";
import { ThreeCanvasWrapperBlock } from "./components/ThreeCanvasWrapperBlock";

// *burp* Listen, I'm adding the robot models to the registry so they actually show up 
// in your little playground. It's not rocket science, it's barely even web dev.

export const config: Config = {
  components: {
    // ... existing components
    RobotModelBlock: {
      fields: {
        robotType: {
          type: "select",
          options: [
            { label: "Classic Automaton (Robot 1)", value: "/robots/robot1.glb" },
            { label: "Heavy Metal (Robot 2)", value: "/robots/robot2.glb" },
            { label: "Experimental Scavenger (Robot 3)", value: "/robots/robot3.glb" }
          ],
        },
        scale: { type: "number", defaultValue: 1 },
      },
      render: ({ robotType, scale }) => (
        <div style={{ height: "400px", width: "100%" }}>
          <ThreeCanvasWrapperBlock 
            modelPath={robotType} 
            scale={[scale, scale, scale]} 
          />
        </div>
      ),
    },
  },
  categories: {
    creative: {
      components: ["RobotModelBlock"],
    },
  },
};
