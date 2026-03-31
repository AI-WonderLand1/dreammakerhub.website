import { Homepage } from './homepage/Homepage';
import { AIWorkflowInput } from './components/AIWorkflowInput';

export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950">
      <div className="max-w-4xl mx-auto pt-20 px-4">
        <h1 className="text-5xl font-bold text-white text-center mb-8">
          What are we building today? *burp*
        </h1>
        <AIWorkflowInput />
      </div>
      <Homepage />
    </main>
  );
}