import VisionInsightApp from '@/components/VisionInsightApp';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-primary">
            Vision Insight
          </h1>
          <p className="text-muted-foreground text-lg">
            Intelligent image analysis and defect detection
          </p>
        </div>
        <VisionInsightApp />
      </div>
    </main>
  );
}