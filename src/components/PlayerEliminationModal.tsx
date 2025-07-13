import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";

interface PlayerEliminationModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  playerImage: string;
}

const PlayerEliminationModal = ({
  isOpen,
  onClose,
  playerName,
  playerImage
}: PlayerEliminationModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-red-400">
            Player Eliminated!
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="relative">
            <img
              src={playerImage}
              alt={playerName}
              className="w-32 h-32 rounded-full object-cover border-4 border-red-400"
            />
            <div className="absolute inset-0 bg-red-500/20 rounded-full flex items-center justify-center">
              <span className="text-6xl">❌</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">{playerName}</h3>
            <p className="text-gray-300">
              Has run out of coins and is eliminated from the game!
            </p>
          </div>
        </div>
        
        <Button onClick={onClose} className="w-full">
          Continue Game
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default PlayerEliminationModal;