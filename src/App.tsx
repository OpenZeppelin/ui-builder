import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

function App() {
  const [count, setCount] = useState(0);
  const { toast } = useToast();

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Transaction Form Builder</h1>
          <p className="text-muted-foreground mt-3 text-lg">
            Build and customize transaction forms for your blockchain applications
          </p>
        </div>

        <div className="bg-card flex flex-col items-center justify-center rounded-lg border p-8 shadow-sm">
          <Button
            onClick={() => {
              setCount((count) => count + 1);
              toast({
                title: 'Counter incremented',
                description: `The count is now ${count + 1}`,
              });
            }}
            className="w-full"
          >
            Count is {count}
          </Button>
          <p className="text-muted-foreground mt-4 text-sm">
            Edit <code className="bg-muted rounded p-1 font-mono">src/App.tsx</code> and save to
            test HMR
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
