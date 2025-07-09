
import { Card } from "@/components/ui/card";
import { Card as CardType } from "@/types/game";

interface CenterAreaProps {
  topDiscardCard: CardType | null;
  deckRemaining: number;
}

const CenterArea = ({ topDiscardCard, deckRemaining }: CenterAreaProps) => {
  return (
    <div className="flex justify-center gap-8 items-center">
      {/* Deck Pile */}
      <Card className="p-4 bg-slate-800 text-center" data-dd-action-name="Deck Pile">
        <div className="text-white font-semibold mb-2">Deck</div>
        <div className="w-16 h-24 bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg border-2 border-blue-400 flex items-center justify-center shadow-lg">
          <div className="text-white text-xs">
            {deckRemaining}
          </div>
        </div>
        <div className="text-slate-400 text-xs mt-1">{deckRemaining} cards</div>
      </Card>

      {/* Discard Pile */}
      <Card className="p-4 bg-slate-800 text-center" data-dd-action-name="Discard Pile">
        <div className="text-white font-semibold mb-2">Discard</div>
        <div className="w-16 h-24 flex items-center justify-center">
          {topDiscardCard ? (
            <img
              src={topDiscardCard.image}
              alt={`${topDiscardCard.value} of ${topDiscardCard.suit}`}
              className="w-16 h-24 rounded shadow-lg"
            />
          ) : (
            <div className="w-16 h-24 bg-slate-700 rounded-lg border-2 border-dashed border-slate-500 flex items-center justify-center">
              <div className="text-slate-500 text-xs">Empty</div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default CenterArea;
