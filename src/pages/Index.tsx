
import BlitzGame from "@/components/BlitzGame";
const Index = () => {
  // Track page view for RUM
  window.DD_RUM && window.DD_RUM.addAction('page_view', {
    page: 'game',
    message: 'User entered the Blitz Card Chase game'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <BlitzGame />
      </div>
    </div>
  );
};

export default Index;
