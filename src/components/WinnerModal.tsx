import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Trophy, RotateCcw } from "lucide-react";

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  winnerName: string;
}

const WinnerModal = ({
  isOpen,
  onClose,
  onPlayAgain,
  winnerName
}: WinnerModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-yellow-400 flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8" />
            Game Over!
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-6">
          <div className="text-6xl animate-bounce">🎉</div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">{winnerName}</h3>
            <p className="text-xl text-yellow-400 font-semibold">
              Wins the Game!
            </p>
            <p className="text-gray-300">
              Congratulations on collecting all the coins!
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button onClick={onClose} variant="outline" className="flex-1">
            Close
          </Button>
          <Button onClick={onPlayAgain} className="flex-1 flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Play Again
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WinnerModal;