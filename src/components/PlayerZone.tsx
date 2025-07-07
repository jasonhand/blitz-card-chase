
import { Player } from "@/types/game";
import { Card } from "@/components/ui/card";
import { Coins } from "lucide-react";

interface PlayerZoneProps {
  player: Player;
  isCurrentPlayer: boolean;
  onCardSelect?: (cardIndex: number) => void;
  selectedCardIndex?: number;
  showCards?: boolean;
}

const PlayerZone = ({ 
  player, 
  isCurrentPlayer, 
  onCardSelect, 
  selectedCardIndex,
  showCards = true 
}: PlayerZoneProps) => {
  const getSuitColor = (suit: string) => {
    if (suit === 'hearts' || suit === 'diamonds') return 'text-red-500';
    return 'text-slate-700';
  };

  return (
    <Card className={`p-4 transition-all duration-300 ${
      isCurrentPlayer 
        ? 'ring-2 ring-blue-400 bg-blue-50/10 shadow-lg' 
        : player.isEliminated 
          ? 'opacity-50 bg-slate-800/50' 
          : 'bg-slate-800 hover:bg-slate-700'
    }`}>
      <div className="space-y-3">
        {/* Player Info */}
        <div className="flex items-center justify-between">
          <h3 className={`font-bold ${
            isCurrentPlayer ? 'text-blue-400' : 'text-white'
          }`}>
            {player.name}
            {isCurrentPlayer && <span className="ml-2 text-sm">(Your Turn)</span>}
          </h3>
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="text-yellow-400 font-bold">{player.coins}</span>
          </div>
        </div>

        {/* Cards */}
        {showCards && (
          <div className="flex gap-1 flex-wrap">
            {player.cards.map((card, index) => (
              <div
                key={card.code}
                className={`relative cursor-pointer transition-all duration-200 ${
                  selectedCardIndex === index 
                    ? 'transform -translate-y-2 ring-2 ring-red-400' 
                    : 'hover:transform hover:-translate-y-1'
                }`}
                onClick={() => onCardSelect?.(index)}
              >
                <img
                  src={card.image}
                  alt={`${card.value} of ${card.suit}`}
                  className="w-12 h-16 rounded shadow-md"
                />
              </div>
            ))}
          </div>
        )}

        {/* Scores */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(player.scores).map(([suit, score]) => (
            <div
              key={suit}
              className={`flex justify-between items-center p-1 rounded ${
                suit === player.bestSuit 
                  ? 'bg-green-600/20 text-green-400 font-bold' 
                  : 'bg-slate-700/50 text-slate-300'
              }`}
            >
              <span className="capitalize">{suit}:</span>
              <span>{score}</span>
            </div>
          ))}
        </div>

        {/* Best Score */}
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">
            Best: {player.bestScore}
          </div>
          <div className="text-xs text-slate-400 capitalize">
            in {player.bestSuit}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PlayerZone;
