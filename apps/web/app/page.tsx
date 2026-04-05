import Homepage from './homepage';
import { AIWorkflowInput } from './components/AIWorkflowInput';

export default function Page() {
  return (
    <main className="min-h-screen bg-transparent">
      <div className="max-w-4xl mx-auto pt-20 px-4">
        <h1 className="text-5xl font-bold text-white text-center mb-8" style={{ fontFamily: 'cursive' }}>
          What are we building today?
        </h1>
        <AIWorkflowInput />
      </div>
      <Homepage />
    </main>
  );
}