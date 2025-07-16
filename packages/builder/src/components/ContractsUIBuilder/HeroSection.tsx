interface HeroSectionProps {
  currentStepIndex: number;
}

export function HeroSection({ currentStepIndex }: HeroSectionProps) {
  return (
    <div
      className={`text-center transition-all duration-300 ${currentStepIndex === 0 ? 'mb-12' : 'mb-6'}`}
    >
      <div className="mx-auto max-w-4xl">
        {/* Main Headline - Responsive sizing based on step */}
        <h1
          className={`bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text font-bold leading-tight text-transparent transition-all duration-300 ${
            currentStepIndex === 0
              ? 'mb-4 text-4xl sm:text-5xl lg:text-6xl'
              : 'mb-0 text-lg sm:text-xl font-semibold opacity-70'
          }`}
        >
          Build a UI for any contract call
        </h1>

        {/* Description - Only show on first step */}
        {currentStepIndex === 0 && (
          <p className="mx-auto max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Spin up a front-end for any contract call in seconds. Select the function, auto-generate
            a React UI with wallet connect and multi-network support, and export a complete app.
          </p>
        )}
      </div>
    </div>
  );
}
