
import BlitzGame from "@/components/BlitzGame";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Bill's Blitz
          </h1>
        </div>
        <BlitzGame />
      </div>
    </div>
  );
};

export default Index;
