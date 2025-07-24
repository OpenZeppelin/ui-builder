export function HeroSection() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between w-full">
        {/* Main Title */}
        <h1 className="text-2xl font-semibold text-black">Contracts UI Builder</h1>

        {/* Description - positioned to the right */}
        <div className="max-w-[572px] text-right">
          <p className="text-xs text-neutral-500 leading-4">
            Spin up a front-end for any contract call in seconds. Select the function, auto-generate
            a React UI with wallet connect and multi-network support, and export a complete app.
          </p>
        </div>
      </div>
    </div>
  );
}
