import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

function App() {
  const [count, setCount] = useState(0)
  const { toast } = useToast()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold">Transaction Form Builder</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Build and customize transaction forms for your blockchain applications
          </p>
        </div>

        <div className="flex flex-col items-center justify-center p-8 border rounded-lg shadow-sm bg-card">
          <Button
            onClick={() => {
              setCount((count) => count + 1)
              toast({
                title: "Counter incremented",
                description: `The count is now ${count + 1}`,
              })
            }}
            className="w-full"
          >
            Count is {count}
          </Button>
          <p className="mt-4 text-sm text-muted-foreground">
            Edit <code className="font-mono bg-muted p-1 rounded">src/App.tsx</code> and save to test HMR
          </p>
        </div>
      </div>
    </div>
  )
}

export default App 