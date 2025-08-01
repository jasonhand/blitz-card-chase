
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Shuffle, Hand } from "lucide-react";
import { Card as CardType } from "@/types/game";

interface GameControlsProps {
  gamePhase: string;
  isCurrentPlayerTurn: boolean;
  canKnock: boolean;
  canDraw: boolean;
  canDiscard: boolean;
  hasSelectedCard: boolean;
  topDiscardCard: CardType | null;
  onKnock: () => void;
  onDrawFromDeck: () => void;
  onDrawFromDiscard: () => void;
  onDiscard: () => void;
  onNewGame: () => void;
  message: string;
}

const GameControls = ({
  gamePhase,
  isCurrentPlayerTurn,
  canKnock,
  canDraw,
  canDiscard,
  hasSelectedCard,
  topDiscardCard,
  onKnock,
  onDrawFromDeck,
  onDrawFromDiscard,
  onDiscard,
  onNewGame,
  message
}: GameControlsProps) => {
  if (gamePhase === 'setup') {
    return (
      <Card className="p-6 bg-slate-800 text-center">
        <div className="text-white text-lg">Setting up game...</div>
      </Card>
    );
  }

  // Game end phase handled by GameOverModal, not here
  if (gamePhase === 'gameEnd') {
    return null;
  }

  return (
    <Card className="p-6 bg-slate-800 space-y-4">
      {/* Game Status */}
      <div className="text-center">
        <div className="text-white text-lg font-semibold mb-2">{message}</div>
        {gamePhase === 'finalRound' && (
          <div className="text-yellow-400 text-sm">
            Final Round - Everyone gets one last turn!
          </div>
        )}
      </div>

      {/* Turn Actions */}
      {isCurrentPlayerTurn && (gamePhase === 'playing' || gamePhase === 'finalRound') && (
        <div className="space-y-4">
          {/* Knock or Continue Decision */}
          <div className="flex gap-4 justify-center">
            <Button
              onClick={onKnock}
              disabled={!canKnock}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
              data-dd-action-name="Knock Button"
            >
              <Hand className="w-4 h-4 mr-2" />
              Knock!
            </Button>
            <div className="text-slate-400 self-center">OR</div>
            <div className="text-white self-center">Continue Playing</div>
          </div>

          {/* Draw Actions */}
          {canDraw && (
            <div className="space-y-2">
              <div className="text-center text-slate-300 text-sm">Choose where to draw from:</div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={onDrawFromDeck}
                  className="bg-blue-600 hover:bg-blue-700"
                  data-dd-action-name="Draw From Deck"
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Draw from Deck
                </Button>
                {topDiscardCard && (
                  <Button
                    onClick={onDrawFromDiscard}
                    className="bg-green-600 hover:bg-green-700"
                    data-dd-action-name="Draw From Discard"
                  >
                    Draw from Discard
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Discard Action */}
          {canDiscard && (
            <div className="text-center">
              <div className="text-slate-300 text-sm mb-2">
                Select a card from your hand, then discard it:
              </div>
              <Button
                onClick={onDiscard}
                disabled={!hasSelectedCard}
                className="bg-purple-600 hover:bg-purple-700"
                data-dd-action-name="Discard Selected Card"
              >
                Discard Selected Card
              </Button>
            </div>
          )}
        </div>
      )}

      {isCurrentPlayerTurn && gamePhase === 'finalRound' && canDraw && (
        <div className="space-y-4">
          <div className="text-center text-yellow-400 text-sm">
            Final turn - make it count!
          </div>
          <div className="flex gap-4 justify-center">
            <Button
              onClick={onDrawFromDeck}
              className="bg-blue-600 hover:bg-blue-700"
              data-dd-action-name="Draw From Deck Final Round"
            >
              <Shuffle className="w-4 h-4 mr-2" />
              Draw from Deck
            </Button>
            {topDiscardCard && (
              <Button
                onClick={onDrawFromDiscard}
                className="bg-green-600 hover:bg-green-700"
                data-dd-action-name="Draw From Discard Final Round"
              >
                Draw from Discard
              </Button>
            )}
          </div>
          
          {canDiscard && (
            <div className="text-center">
              <div className="text-slate-300 text-sm mb-2">
                Select a card from your hand, then discard it:
              </div>
              <Button
                onClick={onDiscard}
                disabled={!hasSelectedCard}
                className="bg-purple-600 hover:bg-purple-700"
                data-dd-action-name="Discard Selected Card Final Round"
              >
                Discard Selected Card
              </Button>
            </div>
          )}
        </div>
      )}

      {/* New Game Button */}
      <div className="text-center pt-4">
        <Button
          onClick={onNewGame}
          variant="outline"
          className="text-slate-300 border-slate-600 hover:bg-slate-700"
          data-dd-action-name="Start New Game"
        >
          Start New Game
        </Button>
      </div>
    </Card>
  );
};

export default GameControls;
