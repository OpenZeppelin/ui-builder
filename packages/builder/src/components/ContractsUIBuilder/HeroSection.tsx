interface HeroSectionProps {
  currentStepIndex: number;
}

export function HeroSection({ currentStepIndex }: HeroSectionProps) {
  return (
    <div
      className={`text-center transition-all duration-300 ${
        currentStepIndex === 0 ? 'mb-12' : 'mb-6'
      }`}
    >
      <div className="mx-auto max-w-4xl">
        {/* Hero Badge - Always visible but smaller during wizard */}
        <div
          className={`inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20 transition-all duration-300 ${
            currentStepIndex === 0 ? 'mb-6' : 'mb-3'
          }`}
        >
          <span className="mr-2">🚀</span>
          No-code Smart Contract UI Builder
        </div>

        {/* Main Headline - Responsive sizing */}
        <h1
          className={`bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-bold leading-tight text-transparent transition-all duration-300 ${
            currentStepIndex === 0
              ? 'mb-4 text-4xl sm:text-5xl lg:text-6xl'
              : 'mb-2 text-2xl sm:text-3xl'
          }`}
        >
          Build a UI for any contract call
        </h1>

        {/* Subtitle - Only show on initial step */}
        {currentStepIndex === 0 && (
          <p className="mb-6 text-xl text-muted-foreground sm:text-2xl">
            From contract to app in seconds
          </p>
        )}

        {/* Description - Only show on initial step */}
        {currentStepIndex === 0 && (
          <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Spin up a front-end for any contract call in seconds. Select the function, auto-generate
            a React UI with wallet connect and multi-network support, and export a complete app.
          </p>
        )}

        {/* Feature Pills - Only show on initial step */}
        {currentStepIndex === 0 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent-foreground">
              <span className="mr-1.5">⚡</span>
              Instant Generation
            </div>
            <div className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent-foreground">
              <span className="mr-1.5">🌐</span>
              Multi-Network
            </div>
            <div className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent-foreground">
              <span className="mr-1.5">👛</span>
              Wallet Ready
            </div>
            <div className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-sm font-medium text-accent-foreground">
              <span className="mr-1.5">📱</span>
              Responsive
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
