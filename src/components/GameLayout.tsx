
import { Player, Card as CardType } from "@/types/game";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hand, Coins } from "lucide-react";
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
  const otherPlayers = players.filter(p => p.id !== 0);
  const isUserTurn = currentPlayerIndex === 0;
  const canSelectCards = turnPhase === 'discard' && isUserTurn;

  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col justify-between py-4 space-y-4">
      {/* User's Hand - Top Section */}
      <div className="flex-1 flex flex-col justify-center items-center space-y-4">
        <UserHand
          cards={userPlayer.cards}
          onCardSelect={onCardSelect}
          selectedCardIndex={selectedCardIndex}
          canSelectCards={canSelectCards}
        />
        
        {/* User Scores */}
        <Card className="p-4 bg-slate-800">
          <div className="text-white font-semibold mb-2 text-center">Your Scores</div>
          <div className="flex gap-4 text-sm">
            {Object.entries(userPlayer.scores).map(([suit, score]) => (
              <div
                key={suit}
                className={`flex flex-col items-center p-2 rounded ${
                  suit === userPlayer.bestSuit 
                    ? 'bg-green-600/20 text-green-400 font-bold' 
                    : 'bg-slate-700/50 text-slate-300'
                }`}
              >
                <span className="capitalize text-xs">{suit}</span>
                <span className="text-lg">{score}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-3">
            <div className="text-2xl font-bold text-green-400">
              Best: {userPlayer.bestScore}
            </div>
            <div className="text-sm text-slate-400 capitalize">
              in {userPlayer.bestSuit}
            </div>
          </div>
        </Card>
      </div>

      {/* Game Status Message */}
      <div className="text-center py-2">
        <div className="text-white text-lg font-semibold mb-2">{message}</div>
        {gamePhase === 'finalRound' && (
          <div className="text-yellow-400 text-sm">
            Final Round - Everyone gets one last turn!
          </div>
        )}
      </div>

      {/* Game Controls - Center Section */}
      <div className="flex items-center justify-center gap-8">
        {/* Discard Pile */}
        <Card className="p-4 bg-slate-800 text-center">
          <div className="text-white font-semibold mb-2">Discard</div>
          <div 
            className={`w-24 h-32 flex items-center justify-center ${
              topDiscardCard && turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-green-400' : ''
            }`}
            onClick={() => topDiscardCard && turnPhase === 'decision' && isUserTurn && onDrawFromDiscard()}
          >
            {topDiscardCard ? (
              <img
                src={topDiscardCard.image}
                alt={`${topDiscardCard.value} of ${topDiscardCard.suit}`}
                className="w-24 h-32 rounded shadow-lg"
              />
            ) : (
              <div className="w-24 h-32 bg-slate-700 rounded-lg border-2 border-dashed border-slate-500 flex items-center justify-center">
                <div className="text-slate-500 text-xs">Empty</div>
              </div>
            )}
          </div>
        </Card>

        {/* Deck Pile */}
        <Card className="p-4 bg-slate-800 text-center">
          <div className="text-white font-semibold mb-2">Deck</div>
          <div 
            className={`w-24 h-32 bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg border-2 border-blue-400 flex items-center justify-center shadow-lg ${
              turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''
            }`}
            onClick={() => turnPhase === 'decision' && isUserTurn && onDrawFromDeck()}
          >
            <div className="text-4xl">🐱</div>
          </div>
          <div className="text-slate-400 text-xs mt-1">{deckRemaining} cards</div>
        </Card>

        {/* User Actions */}
        <div className="flex flex-col items-center space-y-4">
          {/* User Coins */}
          <Card className="p-4 bg-slate-800 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-8 h-8 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-2xl">{userPlayer.coins}</span>
            </div>
            <div className="text-slate-400 text-sm">Your Coins</div>
          </Card>

          {/* Action Buttons */}
          {isUserTurn && (
            <div className="space-y-2">
              {turnPhase === 'decision' && canKnock && (
                <Button
                  onClick={onKnock}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3"
                >
                  <Hand className="w-5 h-5 mr-2" />
                  Knock!
                </Button>
              )}
              
              {turnPhase === 'discard' && (
                <Button
                  onClick={onDiscard}
                  disabled={!hasSelectedCard}
                  className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3"
                >
                  Discard Selected
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Players - Bottom Section */}
      <div className="grid grid-cols-3 gap-4">
        {otherPlayers.map((player) => (
          <Card key={player.id} className={`p-3 transition-all duration-300 ${
            player.id === currentPlayerIndex 
              ? 'ring-2 ring-blue-400 bg-blue-50/10 shadow-lg' 
              : player.isEliminated 
                ? 'opacity-50 bg-slate-800/50' 
                : 'bg-slate-800 hover:bg-slate-700'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`font-bold text-sm ${
                  player.id === currentPlayerIndex ? 'text-blue-400' : 'text-white'
                }`}>
                  {player.name}
                  {player.id === currentPlayerIndex && <span className="ml-1 text-xs">(Playing)</span>}
                </h3>
                <div className="flex gap-1 mt-1">
                  {Array.from({ length: player.cards.length }).map((_, index) => (
                    <div key={index} className="w-4 h-6 bg-slate-700 rounded shadow-sm flex items-center justify-center text-xs">
                      🐱
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 font-bold">{player.coins}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default GameLayout;
