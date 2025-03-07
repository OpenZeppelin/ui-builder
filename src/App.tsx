import { useState } from 'react';

import { Button } from './components/ui/button';
import { Toaster } from './components/ui/toaster';
import { useToast } from './components/ui/use-toast';

export default function App() {
  const { toast } = useToast();
  const [count, setCount] = useState(0);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[hsl(var(--background))] p-4 text-[hsl(var(--foreground))]">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Transaction Form Builder</h1>
          <p className="mt-3 text-lg text-[hsl(var(--muted-foreground))]">
            A toolkit for building blockchain transaction forms
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border bg-[hsl(var(--card))] p-8 shadow-sm">
          <h2 className="mb-6 text-2xl font-semibold">Counter Example</h2>
          <div className="flex flex-col items-center gap-4">
            <div className="text-3xl font-bold">{count}</div>
            <div className="flex flex-row gap-4">
              <Button onClick={() => setCount(count - 1)}>Decrease</Button>
              <Button onClick={() => setCount(count + 1)}>Increase</Button>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                toast({ title: 'Counter value', description: `Current count: ${count}` });
              }}
            >
              Show Toast
            </Button>
          </div>
          <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))]">
            Edit <code className="rounded bg-[hsl(var(--muted))] p-1 font-mono">src/App.tsx</code>{' '}
            and save to test live updates.
          </p>
        </div>
      </div>
      <Toaster />
    </div>
  );
}
