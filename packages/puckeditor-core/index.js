"use client";

const React = require("react");

const PuckContext = React.createContext(null);

// Main Component
export function Puck({ config, data, onDataChange, children }) {
  const [internalData, setInternalData] = React.useState(data || { content: [] });

  React.useEffect(() => {
    setInternalData(data);
  }, [data]);

  const addBlock = (type) => {
    const newData = { 
      ...internalData, 
      content: [...(internalData.content || []), { type, props: {} }] 
    };
    setInternalData(newData);
    if (onDataChange) onDataChange(newData);
  };

  const removeBlock = (index) => {
    const newData = {
      ...internalData,
      content: internalData.content.filter((_, i) => i !== index),
    };
    setInternalData(newData);
    if (onDataChange) onDataChange(newData);
  };

  return React.createElement(
    PuckContext.Provider,
    { value: { config, data: internalData, addBlock, removeBlock } },
    React.createElement(PuckLayout)
  );
}

// Layout Component
function PuckLayout() {
  const context = React.useContext(PuckContext);
  if (!context) return React.createElement("div", null, "Editor configuration missing.");

  const { config, data, addBlock, removeBlock } = context;

  return React.createElement(
    "div",
    { className: "puck-root" },
    React.createElement(
      "div",
      { className: "puck-toolbar" },
      ...Object.entries(config.components).map(([type, definition]) =>
        React.createElement(
          "button",
          { key: type, type: "button", onClick: () => addBlock(type) },
          `+ ${definition.label ?? type}`
        )
      )
    ),
    React.createElement(
      "div",
      { className: "puck-content" },
      ...(data?.content ?? []).map((item, index) => {
        const component = config.components[item.type];
        if (!component) return null;
        return React.createElement(
          "div",
          { key: `${item.type}-${index}`, className: "puck-node" },
          React.createElement(
            "button",
            { className: "puck-node-remove", type: "button", onClick: () => removeBlock(index) },
            "Remove"
          ),
          component.render(item.props ?? {})
        );
      })
    )
  );
}

Puck.Layout = PuckLayout;

// Rich Text Menu
function RichTextMenu({ children }) {
  return React.createElement("div", { className: "puck-richtext-menu" }, children);
}

RichTextMenu.Group = function Group({ children }) {
  return React.createElement("div", { className: "puck-richtext-menu-group" }, children);
};

RichTextMenu.Bold = function Bold() {
  return React.createElement("button", { type: "button" }, "Bold");
};

export { RichTextMenu };

export default Puck;
