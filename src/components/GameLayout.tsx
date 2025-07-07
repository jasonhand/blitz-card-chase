import { Player, Card as CardType } from "@/types/game";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hand, Coins } from "lucide-react";
import PlayerZone from "./PlayerZone";
import UserHand from "./UserHand";

interface GameLayoutProps {
  players: Player[];
  userPlayer: Player;
  currentPlayerIndex: number;
  topDiscardCard: CardType | null;
  deckRemaining: number;
  selectedCardIndex: number | null;
  turnPhase: 'decision' | 'draw' | 'discard';
  gamePhase: string;
  canKnock: boolean;
  onCardSelect: (cardIndex: number) => void;
  onDrawFromDeck: () => void;
  onDrawFromDiscard: () => void;
  onKnock: () => void;
  onDiscard: () => void;
  hasSelectedCard: boolean;
  message: string;
}

const GameLayout = ({
  players,
  userPlayer,
  currentPlayerIndex,
  topDiscardCard,
  deckRemaining,
  selectedCardIndex,
  turnPhase,
  gamePhase,
  canKnock,
  onCardSelect,
  onDrawFromDeck,
  onDrawFromDiscard,
  onKnock,
  onDiscard,
  hasSelectedCard,
  message
}: GameLayoutProps) => {
  const otherPlayers = players.filter(p => p.id !== 0); // Assuming user is player 0
  const isUserTurn = currentPlayerIndex === 0;
  const canSelectCards = turnPhase === 'discard' && isUserTurn;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Other Players - Top Row */}
      <div className="grid grid-cols-3 gap-4">
        {otherPlayers.map((player, index) => (
          <PlayerZone
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === currentPlayerIndex}
            showCards={false}
            isUser={false}
          />
        ))}
      </div>

      {/* Game Status Message */}
      <div className="text-center">
        <div className="text-white text-lg font-semibold mb-2">{message}</div>
        {gamePhase === 'finalRound' && (
          <div className="text-yellow-400 text-sm">
            Final Round - Everyone gets one last turn!
          </div>
        )}
      </div>

      {/* Main Game Area */}
      <div className="flex items-center justify-between gap-8">
        {/* Left Side: Discard Pile and Deck */}
        <div className="flex gap-4">
          {/* Discard Pile */}
          <Card className="p-4 bg-slate-800 text-center">
            <div className="text-white font-semibold mb-2">Discard</div>
            <div 
              className={`w-20 h-28 flex items-center justify-center ${
                topDiscardCard && turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-green-400' : ''
              }`}
              onClick={() => topDiscardCard && turnPhase === 'decision' && isUserTurn && onDrawFromDiscard()}
            >
              {topDiscardCard ? (
                <img
                  src={topDiscardCard.image}
                  alt={`${topDiscardCard.value} of ${topDiscardCard.suit}`}
                  className="w-20 h-28 rounded shadow-lg"
                />
              ) : (
                <div className="w-20 h-28 bg-slate-700 rounded-lg border-2 border-dashed border-slate-500 flex items-center justify-center">
                  <div className="text-slate-500 text-xs">Empty</div>
                </div>
              )}
            </div>
          </Card>

          {/* Deck Pile */}
          <Card className="p-4 bg-slate-800 text-center">
            <div className="text-white font-semibold mb-2">Deck</div>
            <div 
              className={`w-20 h-28 bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg border-2 border-blue-400 flex items-center justify-center shadow-lg ${
                turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''
              }`}
              onClick={() => turnPhase === 'decision' && isUserTurn && onDrawFromDeck()}
            >
              <div className="text-4xl">🐱</div>
            </div>
            <div className="text-slate-400 text-xs mt-1">{deckRemaining} cards</div>
          </Card>
        </div>

        {/* Center: User's Hand */}
        <div className="flex-1">
          <UserHand
            cards={userPlayer.cards}
            onCardSelect={onCardSelect}
            selectedCardIndex={selectedCardIndex}
            canSelectCards={canSelectCards}
          />
        </div>

        {/* Right Side: Actions and Coins */}
        <div className="space-y-4">
          {/* User Coins */}
          <Card className="p-4 bg-slate-800 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-6 h-6 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-xl">{userPlayer.coins}</span>
            </div>
            <div className="text-slate-400 text-sm">Your Coins</div>
          </Card>

          {/* Action Buttons */}
          {isUserTurn && (
            <div className="space-y-2">
              {turnPhase === 'decision' && canKnock && (
                <Button
                  onClick={onKnock}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold"
                >
                  <Hand className="w-4 h-4 mr-2" />
                  Knock!
                </Button>
              )}
              
              {turnPhase === 'discard' && (
                <Button
                  onClick={onDiscard}
                  disabled={!hasSelectedCard}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Discard Selected
                </Button>
              )}
            </div>
          )}

          {/* User Scores */}
          <Card className="p-4 bg-slate-800">
            <div className="text-white font-semibold mb-2 text-center">Your Scores</div>
            <div className="space-y-2 text-xs">
              {Object.entries(userPlayer.scores).map(([suit, score]) => (
                <div
                  key={suit}
                  className={`flex justify-between items-center p-2 rounded ${
                    suit === userPlayer.bestSuit 
                      ? 'bg-green-600/20 text-green-400 font-bold' 
                      : 'bg-slate-700/50 text-slate-300'
                  }`}
                >
                  <span className="capitalize">{suit}:</span>
                  <span>{score}</span>
                </div>
              ))}
            </div>
            <div className="text-center mt-3">
              <div className="text-lg font-bold text-green-400">
                Best: {userPlayer.bestScore}
              </div>
              <div className="text-xs text-slate-400 capitalize">
                in {userPlayer.bestSuit}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GameLayout;
