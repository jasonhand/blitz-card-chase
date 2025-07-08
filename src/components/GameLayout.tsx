import { Player, Card as CardType } from "@/types/game";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hand, Coins, Info } from "lucide-react";
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

  // Add state for random video
  const videoOptions = ["/Bill_images/Bill_01.mp4", "/Bill_images/Bill_02.mp4"];
  const [rulesOpen, setRulesOpen] = React.useState(false);
  const [videoSrc, setVideoSrc] = React.useState(videoOptions[0]);
  const [showRulesText, setShowRulesText] = React.useState(true);
  React.useEffect(() => {
    if (rulesOpen) {
      setVideoSrc(videoOptions[Math.floor(Math.random() * videoOptions.length)]);
    }
  }, [rulesOpen]);

  return (
    <div className="max-w-6xl mx-auto h-screen flex flex-col justify-between py-4 space-y-4">
      {/* AI Players - Top Section */}
      <div className="relative mb-2">
        {/* Bill's Large Pixel Art - floating above and left of his card */}
        {otherPlayers.length > 0 && (
          <img
            src="/Bill_images/Bill_pixel.png"
            alt="Bill"
            className="absolute -top-32 -left-20 max-w-80 max-h-80 w-auto h-auto z-20"
            style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
          />
        )}
        <div className="grid grid-cols-3 gap-4">
          {otherPlayers.map((player, idx) => {
            const isBill = idx === 0;
            const displayName = isBill ? 'Bill' : 'Bot';
            return (
              <div key={player.id} className="flex flex-col items-center">
                <Card className={`p-3 transition-all duration-300 ${
                  player.id === currentPlayerIndex 
                    ? 'ring-2 ring-blue-400 bg-blue-50/10 shadow-lg' 
                    : player.isEliminated 
                      ? 'opacity-50 bg-slate-800/50' 
                      : 'bg-slate-800 hover:bg-slate-700'
                }`}>
                  <div className="flex flex-col items-center">
                    <h3 className={`font-bold text-lg md:text-xl ${
                      player.id === currentPlayerIndex ? 'text-blue-400' : 'text-white'
                    }`}>
                      {displayName}
                      {player.id === currentPlayerIndex && <span className="ml-1 text-base md:text-lg">(Playing)</span>}
                    </h3>
                    {/* No card backs for AI players */}
                    <div className="flex items-center gap-2 mt-2 text-lg md:text-xl">
                      <Coins className="w-6 h-6 text-yellow-400" />
                      <span className="text-yellow-400 font-bold">{player.coins}</span>
                    </div>
                  </div>
                </Card>
                {/* Comic bubble below Bill if this is Bill */}
                {isBill && message && (
                  <div className="relative flex flex-col items-start mt-2">
                    <div className="bg-white text-black px-6 py-3 rounded-2xl shadow-lg border-2 border-black font-bold text-lg max-w-xs comic-bubble">
                      {message}
                    </div>
                    <div className="absolute left-16 -bottom-4 w-0 h-0 border-t-8 border-t-white border-x-8 border-x-transparent border-b-0 border-b-transparent border-solid comic-bubble-tail" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {/* Centered Discard and Draw Deck piles - absolutely centered */}
      <div className="absolute top-1/2 left-1/2 z-30 flex justify-center items-center gap-8" style={{ transform: 'translate(-50%, -50%)' }}>
        {/* Discard Pile */}
        <Card className="p-4 bg-slate-800 text-center">
          <div className="text-white font-semibold mb-2">Discard</div>
          <div 
            className={`w-40 h-56 flex items-center justify-center ${
              topDiscardCard && turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-green-400' : ''
            }`}
            onClick={() => topDiscardCard && turnPhase === 'decision' && isUserTurn && onDrawFromDiscard()}
          >
            {topDiscardCard ? (
              <img
                src={topDiscardCard.image}
                alt={`${topDiscardCard.value} of ${topDiscardCard.suit}`}
                className="w-40 h-56 rounded shadow-lg object-cover"
              />
            ) : (
              <div className="w-40 h-56 bg-slate-700 rounded-lg border-2 border-dashed border-slate-500 flex items-center justify-center">
                <div className="text-slate-500 text-xs">Empty</div>
              </div>
            )}
          </div>
        </Card>
        {/* Deck Pile */}
        <Card className="p-4 bg-slate-800 text-center">
          <div className="text-white font-semibold mb-2">Draw</div>
          <div 
            className={`w-40 h-56 bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg border-2 border-blue-400 flex items-center justify-center shadow-lg ${
              turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''
            }`}
            onClick={() => turnPhase === 'decision' && isUserTurn && onDrawFromDeck()}
          >
            <img
              src="/Bill_images/Card_back.jpg"
              alt="Deck Card Back"
              className="w-40 h-56 object-cover rounded"
            />
          </div>
          <div className="text-slate-400 text-xs mt-1">{deckRemaining} cards</div>
        </Card>
      </div>
      {/* User's hand and coins at the bottom */}
      <div className="fixed bottom-0 left-0 w-full flex flex-col items-center pb-2 bg-gradient-to-t from-slate-900/90 via-slate-900/60 to-transparent z-40">
        <UserHand
          cards={userPlayer.cards}
          onCardSelect={onCardSelect}
          selectedCardIndex={selectedCardIndex}
          canSelectCards={canSelectCards}
          cardSize="large"
          onDiscardCard={turnPhase === 'discard' && isUserTurn && !isKnocker ? handleDiscardCard : undefined}
        />
        <Card className="p-2 mt-2 bg-slate-800 text-center">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Coins className="w-8 h-8 text-yellow-400" />
            <span className="text-yellow-400 font-bold text-2xl">{userPlayer.coins}</span>
          </div>
          <div className="text-slate-400 text-sm">Your Coins</div>
        </Card>
      </div>
      {/* Knock button in upper right corner, offset to clear discard log */}
      {isUserTurn && turnPhase === 'decision' && canKnock && (
        <button
          onClick={onKnock}
          className="fixed top-6 right-72 z-50 bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-4 rounded-2xl shadow-lg text-xl flex items-center gap-2 border-2 border-yellow-600"
        >
          <span className="text-2xl">✊</span>
          Knock
        </button>
      )}
      {/* Discard Log Panel */}
      <div className="fixed top-0 right-0 h-full w-64 bg-slate-900/95 border-l-2 border-yellow-400 z-50 overflow-y-auto p-4 flex flex-col gap-2">
        <div className="text-yellow-300 font-bold text-lg mb-2">Discard Log</div>
        {discardLog.length === 0 && <div className="text-slate-400 text-sm">No discards yet.</div>}
        {discardLog.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-slate-800 rounded p-2 shadow">
            <span className="font-bold text-yellow-200">{entry.playerName}</span>
            <span className="text-white">discarded</span>
            <span className="bg-slate-700 px-2 py-1 rounded text-green-300 font-mono flex items-center gap-1">
              {entry.card.value} <span>{suitEmojis[entry.card.suit.toLowerCase()]}</span>
            </span>
          </div>
        ))}
      </div>
      {/* Move and style the score info container (bottom left, large, easy to read) */}
      <div className="fixed bottom-4 left-4 z-50">
        <Card className="p-6 bg-slate-800 w-96 shadow-2xl border-4 border-yellow-400">
          <div className="flex gap-6 text-2xl font-bold justify-center mb-4">
            {Object.entries(userPlayer.scores).map(([suit, score]) => (
              <div
                key={suit}
                className={`flex flex-col items-center p-2 rounded-2xl text-3xl ${
                  suit === userPlayer.bestSuit 
                    ? 'bg-green-600/30 text-green-300 border-2 border-green-400' 
                    : 'bg-slate-700/70 text-slate-200'
                }`}
              >
                <span>{suitEmojis[suit]}</span>
                <span className="text-4xl">{score}</span>
              </div>
            ))}
          </div>
          <div className="text-center mt-2">
            <div className="text-3xl font-extrabold text-green-400">
              {userPlayer.bestScore}
            </div>
            <div className="text-lg text-slate-400 capitalize">
              Best: {suitEmojis[userPlayer.bestSuit]} {userPlayer.bestSuit}
            </div>
          </div>
        </Card>
      </div>
      {/* Info Button (lower right) */}
      <Dialog open={rulesOpen} onOpenChange={open => { setRulesOpen(open); if (!open) setShowRulesText(true); }}>
        <DialogTrigger asChild>
          <button
            className="fixed bottom-6 right-6 z-50 bg-slate-800/80 hover:bg-yellow-400 hover:text-black text-yellow-300 rounded-full p-3 shadow-lg border-2 border-yellow-400 transition-colors"
            aria-label="Show Game Rules"
          >
            <Info className="w-7 h-7" />
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
  );
};

export default GameLayout;
