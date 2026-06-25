import React from "react";

interface Props {
  selectedTemplate: string;
  repoUrl: string;
}

const BuildIDEButton: React.FC<Props> = ({ selectedTemplate, repoUrl }) => {
  const handleClick = async () => {
    if (!selectedTemplate || !repoUrl) {
      alert("Please select a template and provide a repo URL.");
      return;
    }
    const res = await fetch("/api/build-ide", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template: selectedTemplate, repoUrl }),
    });

    const data = await res.json();
    if (res.ok) {
      window.location.href = data.workspaceUrl;
    } else {
      alert("Failed to create workspace: " + data.error);
    }
  };

  return <button onClick={handleClick}>Build IDE</button>;
};

export default BuildIDEButton;