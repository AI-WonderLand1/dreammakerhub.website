"use client";

import { useState } from "react";
import {
  Square, Type, Palette, BorderAll, Smartphone,
  Tablet, Monitor,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Breakpoint = "desktop" | "tablet" | "mobile";

interface StyleState {
  padding: string;
  margin: string;
  bgColor: string;
  textColor: string;
  fontSize: string;
  fontWeight: string;
  fontFamily: string;
  borderRadius: string;
  borderWidth: string;
  borderColor: string;
  width: string;
  textAlign: string;
}

const defaultStyles: StyleState = {
  padding: "16px",
  margin: "0",
  bgColor: "",
  textColor: "",
  fontSize: "16px",
  fontWeight: "400",
  fontFamily: "Inter",
  borderRadius: "8px",
  borderWidth: "0",
  borderColor: "rgba(255,255,255,0.1)",
  width: "100%",
  textAlign: "left",
};

const styleOverrides: Record<Breakpoint, Partial<StyleState>> = {
  desktop: {},
  tablet: {},
  mobile: {},
};

interface PropertiesPanelProps {
  selectedElement: { type: string; props: Record<string, unknown> } | null;
  onUpdateProps?: (props: Record<string, unknown>) => void;
}

export function PropertiesPanel({ selectedElement, onUpdateProps }: PropertiesPanelProps) {
  const [activeTab, setActiveTab] = useState<string>("style");
  const [breakpoint, setBreakpoint] = useState<Breakpoint>("desktop");
  const [styles, setStyles] = useState<StyleState>(defaultStyles);

  if (!selectedElement) {
    return (
      <div className="flex h-full items-center justify-center p-4">
        <div className="text-center">
          <Square className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-xs text-white/30">Select an element to edit its properties</p>
        </div>
      </div>
    );
  }

  function updateStyle(key: keyof StyleState, value: string) {
    const merged = { ...styles, [key]: value };
    if (breakpoint !== "desktop") {
      styleOverrides[breakpoint][key] = value;
    }
    setStyles(merged);
    onUpdateProps?.({ ...selectedElement.props, [`style_${breakpoint}`]: merged });
  }

  const breakpoints: { key: Breakpoint; label: string; icon: React.ElementType }[] = [
    { key: "desktop", label: "Desktop", icon: Monitor },
    { key: "tablet", label: "Tablet", icon: Tablet },
    { key: "mobile", label: "Mobile", icon: Smartphone },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="p-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-white/80 capitalize">
            {selectedElement.type.replace(/([A-Z])/g, " $1").trim()}
          </span>
        </div>
        <div className="flex gap-1">
          {breakpoints.map((bp) => {
            const Icon = bp.icon;
            return (
              <button
                key={bp.key}
                onClick={() => setBreakpoint(bp.key)}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  breakpoint === bp.key
                    ? "bg-violet-600 text-white"
                    : "text-white/40 hover:text-white/60 bg-white/5"
                }`}
              >
                <Icon className="w-3 h-3" />
                {bp.label}
              </button>
            );
          })}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="mx-3 mt-2 bg-white/5 border border-white/10">
          <TabsTrigger value="style" className="text-xs data-[state=active]:bg-violet-600">Style</TabsTrigger>
          <TabsTrigger value="typography" className="text-xs data-[state=active]:bg-violet-600">Typography</TabsTrigger>
          <TabsTrigger value="border" className="text-xs data-[state=active]:bg-violet-600">Border</TabsTrigger>
          <TabsTrigger value="props" className="text-xs data-[state=active]:bg-violet-600">Props</TabsTrigger>
        </TabsList>

        <TabsContent value="style" className="flex-1 overflow-y-auto p-3 space-y-3 mt-0">
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Background Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={styles.bgColor || "#000000"}
                onChange={(e) => updateStyle("bgColor", e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10"
              />
              <Input
                size={1}
                value={styles.bgColor}
                onChange={(e) => updateStyle("bgColor", e.target.value)}
                placeholder="bg color"
                className="flex-1 text-xs h-8"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Text Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={styles.textColor || "#ffffff"}
                onChange={(e) => updateStyle("textColor", e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10"
              />
              <Input
                size={1}
                value={styles.textColor}
                onChange={(e) => updateStyle("textColor", e.target.value)}
                placeholder="text color"
                className="flex-1 text-xs h-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/40 mb-1 block">Padding</label>
              <Input
                size={1}
                value={styles.padding}
                onChange={(e) => updateStyle("padding", e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 mb-1 block">Margin</label>
              <Input
                size={1}
                value={styles.margin}
                onChange={(e) => updateStyle("margin", e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/40 mb-1 block">Text Align</label>
              <select
                value={styles.textAlign}
                onChange={(e) => updateStyle("textAlign", e.target.value)}
                className="w-full h-8 rounded-md border border-white/10 bg-white/5 text-xs text-white px-2"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-white/40 mb-1 block">Width</label>
              <Input
                size={1}
                value={styles.width}
                onChange={(e) => updateStyle("width", e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="typography" className="flex-1 overflow-y-auto p-3 space-y-3 mt-0">
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Font Family</label>
            <select
              value={styles.fontFamily}
              onChange={(e) => updateStyle("fontFamily", e.target.value)}
              className="w-full h-8 rounded-md border border-white/10 bg-white/5 text-xs text-white px-2"
            >
              <option value="Inter">Inter</option>
              <option value="system-ui">System UI</option>
              <option value="Georgia">Georgia</option>
              <option value="monospace">Monospace</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/40 mb-1 block">Font Size</label>
              <Input
                size={1}
                value={styles.fontSize}
                onChange={(e) => updateStyle("fontSize", e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 mb-1 block">Font Weight</label>
              <select
                value={styles.fontWeight}
                onChange={(e) => updateStyle("fontWeight", e.target.value)}
                className="w-full h-8 rounded-md border border-white/10 bg-white/5 text-xs text-white px-2"
              >
                <option value="400">Regular 400</option>
                <option value="500">Medium 500</option>
                <option value="600">Semibold 600</option>
                <option value="700">Bold 700</option>
              </select>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="border" className="flex-1 overflow-y-auto p-3 space-y-3 mt-0">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-white/40 mb-1 block">Border Radius</label>
              <Input
                size={1}
                value={styles.borderRadius}
                onChange={(e) => updateStyle("borderRadius", e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <div>
              <label className="text-[10px] text-white/40 mb-1 block">Border Width</label>
              <Input
                size={1}
                value={styles.borderWidth}
                onChange={(e) => updateStyle("borderWidth", e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] text-white/40 mb-1 block">Border Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={styles.borderColor || "#ffffff"}
                onChange={(e) => updateStyle("borderColor", e.target.value)}
                className="w-8 h-8 rounded cursor-pointer bg-transparent border border-white/10"
              />
              <Input
                size={1}
                value={styles.borderColor}
                onChange={(e) => updateStyle("borderColor", e.target.value)}
                placeholder="border color"
                className="flex-1 text-xs h-8"
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="props" className="flex-1 overflow-y-auto p-3 mt-0">
          <div className="space-y-2">
            {Object.entries(selectedElement.props || {}).map(([key, value]) => {
              if (key.startsWith("style_")) return null;
              return (
                <div key={key}>
                  <label className="text-[10px] text-white/40 mb-0.5 block capitalize">
                    {key.replace(/([A-Z])/g, " $1").trim()}
                  </label>
                  <Input
                    size={1}
                    value={String(value ?? "")}
                    onChange={(e) => {
                      const newProps = { ...selectedElement.props, [key]: e.target.value };
                      onUpdateProps?.(newProps);
                    }}
                    className="text-xs h-8"
                  />
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
