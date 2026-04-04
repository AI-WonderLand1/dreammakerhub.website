import React from "react";
import { Config } from "@measured/puck";
import { NavigationBlock, NavigationBlockProps } from "./components/NavigationBlock";
import { ThreeCanvasWrapperBlock } from "./components/ThreeCanvasWrapperBlock";

type Props = {
  Navigation: NavigationBlockProps;
  RobotModelBlock: {
    robotType: string;
    scale: number;
  };
};

export const config: Config<Props> = {
  components: {
    Navigation: {
      fields: {
        logoText: { type: "text" },
        links: {
          type: "array",
          getItemSummary: (item) => item.label || "Link",
          arrayFields: {
            label: { type: "text" },
            href: { type: "text" },
          },
        },
        ctaText: { type: "text" },
        ctaHref: { type: "text" },
      },
      render: (props) => <NavigationBlock {...props} />,
    },
    RobotModelBlock: {
      fields: {
        robotType: {
          type: "select",
          options: [
            { label: "Classic Automaton", value: "/robots/robot1.glb" },
            { label: "Heavy Metal", value: "/robots/robot2.glb" },
            { label: "Experimental Scavenger", value: "/robots/robot3.glb" }
          ],
        },
        scale: { type: "number", defaultValue: 1 },
      },
      render: ({ robotType, scale }) => (
        <div style={{ height: "400px", width: "100%", position: "relative" }}>
          <ThreeCanvasWrapperBlock modelPath={robotType} scale={scale} />
        </div>
      ),
    },
  },
  categories: {
    layout: {
      components: ["Navigation"],
    },
    creative: {
      components: ["RobotModelBlock"],
    },
  },
};