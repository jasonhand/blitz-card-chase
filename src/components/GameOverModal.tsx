import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface GameOverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
}

const GameOverModal = ({
  isOpen,
  onClose,
  onPlayAgain
}: GameOverModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center bg-slate-800 border-2 border-red-500">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-red-400 mb-4">
            Game Over!
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Bill's Avatar */}
          <div className="flex justify-center mb-4">
            <img
              src="/Bill_images/Bill_pixel.png"
              alt="Bill"
              className="w-24 h-24 md:w-32 md:h-32 object-contain"
            />
          </div>
          
          <div className="text-6xl mb-4">💸</div>
          
          <div className="space-y-3">
            <h3 className="text-2xl font-bold text-white">You Lost!</h3>
            <p className="text-lg text-gray-300">
              You ran out of coins...
            </p>
            <p className="text-xl font-semibold text-yellow-400">
              Try the kids table instead! 🎮
            </p>
          </div>
        </div>
        
        <Button 
          onClick={onPlayAgain} 
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg py-3"
        >
          Play Again
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default GameOverModal;