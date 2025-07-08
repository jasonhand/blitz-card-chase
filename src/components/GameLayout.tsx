import { Player, Card as CardType } from "@/types/game";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hand, Coins, Info, X } from "lucide-react";
import UserHand from "./UserHand";
import { Dialog, DialogTrigger, DialogContent } from "./ui/dialog";
import React from "react";

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
  knocker: number | null;
  discardLog: Array<{ playerName: string; card: CardType; turn: number }>;
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
  message,
  knocker,
  discardLog
}: GameLayoutProps) => {
  const otherPlayers = players.filter(p => p.id !== 0);
  const isUserTurn = currentPlayerIndex === 0;
  const isKnocker = gamePhase === 'finalRound' && currentPlayerIndex === userPlayer.id && knocker === userPlayer.id;
  const canSelectCards = turnPhase === 'discard' && isUserTurn && !(gamePhase === 'finalRound' && currentPlayerIndex === userPlayer.id && knocker === userPlayer.id);

  const handleDiscardCard = (cardIndex: number) => {
    if (turnPhase === 'discard' && isUserTurn) {
      onCardSelect(cardIndex);
      onDiscard();
    }
  };

  // Suit emoji map
  const suitEmojis: Record<string, string> = {
    hearts: '♥️',
    diamonds: '♦️',
    clubs: '♣️',
    spades: '♠️',
  };

  // Add state for random video and discard log visibility
  const videoOptions = ["/Bill_images/Bill_01.mp4", "/Bill_images/Bill_02.mp4"];
  const [rulesOpen, setRulesOpen] = React.useState(false);
  const [videoSrc, setVideoSrc] = React.useState(videoOptions[0]);
  const [showRulesText, setShowRulesText] = React.useState(true);
  const [showDiscardLog, setShowDiscardLog] = React.useState(false);
  
  React.useEffect(() => {
    if (rulesOpen) {
      setVideoSrc(videoOptions[Math.floor(Math.random() * videoOptions.length)]);
    }
  }, [rulesOpen]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden game-container no-select">
      {/* Top Section - AI Players and Game Info */}
      <div className="flex-1 flex flex-col p-4">
        {/* AI Players Row - Compact and centered */}
        <div className="flex justify-center items-center gap-6 mb-4">
          {otherPlayers.map((player, idx) => {
            const isBill = idx === 0;
            const displayName = isBill ? 'Bill' : 'Bot';
            return (
              <div key={player.id} className="flex flex-col items-center relative">
                {/* Bill's Pixel Art - Smaller and positioned better */}
                {isBill && (
                                  <img
                  src="/Bill_images/Bill_pixel.png"
                  alt="Bill"
                  className="absolute -top-16 -left-8 w-20 h-20 z-10 touch-image"
                  style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
                />
                )}
                <Card className={`p-2 transition-all duration-300 ${
                  player.id === currentPlayerIndex 
                    ? 'ring-2 ring-blue-400 bg-blue-50/10 shadow-lg' 
                    : player.isEliminated 
                      ? 'opacity-50 bg-slate-800/50' 
                      : 'bg-slate-800 hover:bg-slate-700'
                }`}>
                  <div className="flex flex-col items-center">
                    <h3 className={`font-bold text-sm ${
                      player.id === currentPlayerIndex ? 'text-blue-400' : 'text-white'
                    }`}>
                      {displayName}
                      {player.id === currentPlayerIndex && <span className="ml-1 text-xs">(Playing)</span>}
                    </h3>
                    <div className="flex items-center gap-1 mt-1 text-sm">
                      <Coins className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">{player.coins}</span>
                    </div>
                  </div>
                </Card>
                {/* Comic bubble for Bill - Smaller and positioned better */}
                {isBill && message && (
                  <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-20">
                    <div className="bg-white text-black px-3 py-2 rounded-xl shadow-lg border-2 border-black font-bold text-sm max-w-32 text-center">
                      {message}
                    </div>
                    <div className="absolute left-1/2 -bottom-2 transform -translate-x-1/2 w-0 h-0 border-t-4 border-t-white border-x-4 border-x-transparent border-b-0 border-solid" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Center Game Area - Cards and Controls */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Discard and Draw Piles - Smaller for iPad */}
          <div className="flex justify-center items-center gap-6 mb-4">
            {/* Discard Pile */}
            <Card className="p-3 bg-slate-800 text-center">
              <div className="text-white font-semibold text-sm mb-1">Discard</div>
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
                    className="w-24 h-32 rounded shadow-lg object-cover"
                  />
                ) : (
                  <div className="w-24 h-32 bg-slate-700 rounded-lg border-2 border-dashed border-slate-500 flex items-center justify-center">
                    <div className="text-slate-500 text-xs">Empty</div>
                  </div>
                )}
              </div>
            </Card>
            {/* Deck Pile */}
            <Card className="p-3 bg-slate-800 text-center">
              <div className="text-white font-semibold text-sm mb-1">Draw</div>
              <div 
                className={`w-24 h-32 bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg border-2 border-blue-400 flex items-center justify-center shadow-lg ${
                  turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''
                }`}
                onClick={() => turnPhase === 'decision' && isUserTurn && onDrawFromDeck()}
              >
                <img
                  src="/Bill_images/Card_back.jpg"
                  alt="Deck Card Back"
                  className="w-24 h-32 object-cover rounded"
                />
              </div>
              <div className="text-slate-400 text-xs mt-1">{deckRemaining} cards</div>
            </Card>
          </div>

          {/* Knock Button - Centered and touch-friendly */}
          {isUserTurn && turnPhase === 'decision' && canKnock && (
            <button
              onClick={onKnock}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-3 rounded-xl shadow-lg text-lg flex items-center gap-2 border-2 border-yellow-600 transition-colors touch-button ipad-button"
            >
              <span className="text-xl">✊</span>
              Knock
            </button>
          )}
        </div>
      </div>

      {/* Bottom Section - User Hand and Info */}
      <div className="flex-shrink-0 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent p-4">
        {/* User's Hand - Smaller cards for iPad */}
        <div className="flex flex-col items-center">
          <UserHand
            cards={userPlayer.cards}
            onCardSelect={onCardSelect}
            selectedCardIndex={selectedCardIndex}
            canSelectCards={canSelectCards}
            cardSize="normal"
            onDiscardCard={turnPhase === 'discard' && isUserTurn && !isKnocker ? handleDiscardCard : undefined}
          />
          {/* User Coins - Compact */}
          <Card className="p-2 mt-2 bg-slate-800 text-center">
            <div className="flex items-center justify-center gap-2">
              <Coins className="w-6 h-6 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-xl">{userPlayer.coins}</span>
            </div>
            <div className="text-slate-400 text-xs">Your Coins</div>
          </Card>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        {/* Discard Log Toggle Button */}
        <button
          onClick={() => setShowDiscardLog(!showDiscardLog)}
          className="bg-slate-800/80 hover:bg-yellow-400 hover:text-black text-yellow-300 rounded-full p-2 shadow-lg border-2 border-yellow-400 transition-colors touch-button ipad-button"
          aria-label="Toggle Discard Log"
        >
          <Hand className="w-5 h-5" />
        </button>
        
        {/* Info Button */}
        <Dialog open={rulesOpen} onOpenChange={open => { setRulesOpen(open); if (!open) setShowRulesText(true); }}>
          <DialogTrigger asChild>
            <button
              className="bg-slate-800/80 hover:bg-yellow-400 hover:text-black text-yellow-300 rounded-full p-2 shadow-lg border-2 border-yellow-400 transition-colors touch-button ipad-button"
              aria-label="Show Game Rules"
            >
              <Info className="w-5 h-5" />
            </button>
          </DialogTrigger>
          <DialogContent className="p-0 overflow-hidden max-w-2xl w-full bg-transparent border-none shadow-2xl">
            <div className="relative w-full h-[70vh] flex items-center justify-center">
              <video
                src={videoSrc}
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              {showRulesText && (
                <div className="relative z-10 bg-black/70 rounded-lg p-8 max-w-xl mx-auto text-white text-lg shadow-xl border-2 border-yellow-400">
                  <h2 className="text-2xl font-bold mb-4 text-yellow-300">How to Play Blitz Card Chase</h2>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Each player starts with 4 coins and is dealt 3 cards.</li>
                    <li>On your turn, draw a card from the draw pile or take the top card from the discard pile.</li>
                    <li>After drawing, discard one card from your hand.</li>
                    <li>Your goal is to get the highest total in a single suit (♥️, ♦️, ♣️, ♠️). 31 is the best possible hand (Blitz).</li>
                    <li>You may "Knock" if you think you have the best hand. After a knock, all other players get one final turn to improve their hand.</li>
                    <li>If a player gets 31 (Blitz), the hand ends immediately and all other players lose a coin to the winner.</li>
                    <li>After the final turn, the player with the best hand wins the round and takes a coin from the lowest scorer.</li>
                    <li>Players with 0 coins are eliminated. The last player with coins wins the game!</li>
                  </ol>
                  <div className="mt-6 text-center text-yellow-200 text-base">Good luck and have fun!</div>
                </div>
              )}
              <button
                className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-2 rounded-full shadow-lg border-2 border-yellow-600 transition-colors"
                onClick={() => setShowRulesText(v => !v)}
              >
                {showRulesText ? 'Hide Rules & Enjoy Video' : 'Show Rules'}
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Score Panel - Compact and positioned better */}
      <div className="absolute bottom-4 left-4 z-40">
        <Card className="p-3 bg-slate-800/90 backdrop-blur-sm shadow-2xl border-2 border-yellow-400">
          <div className="flex gap-3 text-lg font-bold justify-center mb-2">
            {Object.entries(userPlayer.scores).map(([suit, score]) => (
              <div
                key={suit}
                className={`flex flex-col items-center p-1 rounded-lg text-xl ${
                  suit === userPlayer.bestSuit 
                    ? 'bg-green-600/30 text-green-300 border border-green-400' 
                    : 'bg-slate-700/70 text-slate-200'
                }`}
              >
                <span className="text-lg">{suitEmojis[suit]}</span>
                <span className="text-2xl">{score}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <div className="text-2xl font-extrabold text-green-400">
              {userPlayer.bestScore}
            </div>
            <div className="text-sm text-slate-400 capitalize">
              Best: {suitEmojis[userPlayer.bestSuit]} {userPlayer.bestSuit}
            </div>
          </div>
        </Card>
      </div>

      {/* Discard Log Panel - Slide in from right, not covering players */}
      {showDiscardLog && (
        <div className="absolute top-0 right-0 h-full w-80 bg-slate-900/95 border-l-2 border-yellow-400 z-50 overflow-y-auto p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center mb-4">
            <div className="text-yellow-300 font-bold text-lg">Discard Log</div>
            <button
              onClick={() => setShowDiscardLog(false)}
              className="text-slate-400 hover:text-white touch-button ipad-button"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {discardLog.length === 0 && <div className="text-slate-400 text-sm">No discards yet.</div>}
          {discardLog.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-slate-800 rounded p-2 shadow">
              <span className="font-bold text-yellow-200 text-sm">{entry.playerName}</span>
              <span className="text-white text-sm">discarded</span>
              <span className="bg-slate-700 px-2 py-1 rounded text-green-300 font-mono text-sm flex items-center gap-1">
                {entry.card.value} <span>{suitEmojis[entry.card.suit.toLowerCase()]}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameLayout;
