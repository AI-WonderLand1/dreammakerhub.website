import React from 'react';
import { AgentTerminal } from '../../components/ai/AgentTerminal';
import { PromptInput } from '../../components/ai/PromptInput';
import { ModelStatus } from '../../components/ai/ModelStatus';

export const AgentControlTemplate: React.FC = () => (
  <div className="space-y-6">
    <ModelStatus />
    <AgentTerminal />
    <PromptInput />
  </div>
);
