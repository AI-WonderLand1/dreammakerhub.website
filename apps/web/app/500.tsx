export default function Custom500() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">500</h1>
        <p className="text-xl text-muted-foreground mb-6">Something went wrong on our end.</p>
        <a href="/" className="px-6 py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90">
          Return Home
        </a>
      </div>
    </div>
  );
}