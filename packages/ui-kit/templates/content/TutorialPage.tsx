import React from 'react';
import { VideoPlayer } from '../../components/interactive/VideoPlayer';
import { StepProcess } from '../../components/marketing/StepProcess';
import { Heading } from '../../components/basics/Heading';

export const TutorialPage: React.FC = () => (
  <div className="space-y-10">
    <Heading />
    <VideoPlayer />
    <StepProcess />
  </div>
);
