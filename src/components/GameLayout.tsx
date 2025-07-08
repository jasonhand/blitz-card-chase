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
  const [showDiscardLog, setShowDiscardLog] = React.useState(false);
  
  React.useEffect(() => {
    if (rulesOpen) {
      setVideoSrc(videoOptions[Math.floor(Math.random() * videoOptions.length)]);
    }
  }, [rulesOpen]);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden game-container no-select relative">
      {/* Responsive Grid Layout with bottom padding */}
      <div className="h-full grid grid-rows-[auto_1fr_auto] grid-cols-[auto_1fr_auto] gap-2 p-4 pb-8">
        
        {/* Top Row */}
        {/* Top Left - Message and Knock Button */}
        <div className="flex flex-col items-center justify-center gap-2">
          {/* Subtle Game Message - Responsive positioning */}
          {message && (
            <div className="bg-slate-800/90 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-lg border border-slate-600 animate-fade-in-out">
              <div className="text-center font-medium text-sm md:text-lg">
                {message}
              </div>
            </div>
          )}
          
          {/* Knock Button - Near top icons */}
          {isUserTurn && turnPhase === 'decision' && canKnock && (
            <button
              onClick={onKnock}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-3 py-2 md:px-4 md:py-2 rounded-xl shadow-lg text-sm md:text-base flex items-center gap-1 border-2 border-yellow-600 transition-colors touch-button ipad-button"
            >
              <span className="text-sm md:text-lg">✊</span>
              Knock
            </button>
          )}
        </div>
        
        {/* Top Center - Bot 1 - Much closer to table */}
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Card className={`p-1 md:p-2 transition-all duration-300 ${
              otherPlayers[1]?.id === currentPlayerIndex 
                ? 'ring-2 ring-blue-400 bg-blue-50/10 shadow-lg' 
                : otherPlayers[1]?.isEliminated 
                  ? 'opacity-50 bg-slate-800/50' 
                  : 'bg-slate-800 hover:bg-slate-700'
            }`}>
              <div className="flex flex-col items-center">
                <h3 className={`font-bold text-xs ${
                  otherPlayers[1]?.id === currentPlayerIndex ? 'text-blue-400' : 'text-white'
                }`}>
                  Bot 1
                  {otherPlayers[1]?.id === currentPlayerIndex && <span className="ml-1 text-xs">(Playing)</span>}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-sm">{otherPlayers[1]?.coins}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Top Right - Empty */}
        <div></div>

        {/* Middle Row */}
        {/* Middle Left - Bill - Much closer to table */}
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center">
            <img
              src="/Bill_images/Bill_pixel.png"
              alt="Bill"
              className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 mb-1 touch-image"
              style={{ imageRendering: 'pixelated', objectFit: 'contain' }}
            />
            <Card className={`p-1 md:p-2 transition-all duration-300 ${
              otherPlayers[0]?.id === currentPlayerIndex 
                ? 'ring-2 ring-blue-400 bg-blue-50/10 shadow-lg' 
                : otherPlayers[0]?.isEliminated 
                  ? 'opacity-50 bg-slate-800/50' 
                  : 'bg-slate-800 hover:bg-slate-700'
            }`}>
              <div className="flex flex-col items-center">
                <h3 className={`font-bold text-xs ${
                  otherPlayers[0]?.id === currentPlayerIndex ? 'text-blue-400' : 'text-white'
                }`}>
                  Bill
                  {otherPlayers[0]?.id === currentPlayerIndex && <span className="ml-1 text-xs">(Playing)</span>}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-sm">{otherPlayers[0]?.coins}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
        
        {/* Middle Center - Table and Cards */}
        <div className="flex items-center justify-center relative">
          <div className="relative">
            {/* Responsive Table */}
            <img
              src="/Bill_images/table.png"
              alt="Game Table"
              className="w-48 h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 object-cover touch-image"
            />
            
            {/* Discard and Draw Piles - Responsive sizing */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-2 md:gap-4">
              {/* Discard Pile */}
              <div className="flex flex-col items-center">
                <div className="text-white font-semibold text-xs md:text-sm mb-1">Discard</div>
                <div 
                  className={`w-12 h-16 md:w-16 md:h-20 lg:w-20 lg:h-28 flex items-center justify-center ${
                    topDiscardCard && turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-green-400' : ''
                  }`}
                  onClick={() => topDiscardCard && turnPhase === 'decision' && isUserTurn && onDrawFromDiscard()}
                >
                  {topDiscardCard ? (
                    <img
                      src={topDiscardCard.image}
                      alt={`${topDiscardCard.value} of ${topDiscardCard.suit}`}
                      className="w-12 h-16 md:w-16 md:h-20 lg:w-20 lg:h-28 rounded shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-16 md:w-16 md:h-20 lg:w-20 lg:h-28 bg-slate-700 rounded-lg border-2 border-dashed border-slate-500 flex items-center justify-center">
                      <div className="text-slate-500 text-xs">Empty</div>
                    </div>
                  )}
                </div>
              </div>
              {/* Deck Pile */}
              <div className="flex flex-col items-center">
                <div className="text-white font-semibold text-xs md:text-sm mb-1">Draw</div>
                <div 
                  className={`w-12 h-16 md:w-16 md:h-20 lg:w-20 lg:h-28 bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg border-2 border-blue-400 flex items-center justify-center shadow-lg ${
                    turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''
                  }`}
                  onClick={() => turnPhase === 'decision' && isUserTurn && onDrawFromDeck()}
                >
                  <img
                    src="/Bill_images/Card_back.jpg"
                    alt="Deck Card Back"
                    className="w-12 h-16 md:w-16 md:h-20 lg:w-20 lg:h-28 object-cover rounded"
                  />
                </div>
                <div className="text-slate-400 text-xs mt-1">{deckRemaining} cards</div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Middle Right - Bot 2 - Much closer to table */}
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Card className={`p-1 md:p-2 transition-all duration-300 ${
              otherPlayers[2]?.id === currentPlayerIndex 
                ? 'ring-2 ring-blue-400 bg-blue-50/10 shadow-lg' 
                : otherPlayers[2]?.isEliminated 
                  ? 'opacity-50 bg-slate-800/50' 
                  : 'bg-slate-800 hover:bg-slate-700'
            }`}>
              <div className="flex flex-col items-center">
                <h3 className={`font-bold text-xs ${
                  otherPlayers[2]?.id === currentPlayerIndex ? 'text-blue-400' : 'text-white'
                }`}>
                  Bot 2
                  {otherPlayers[2]?.id === currentPlayerIndex && <span className="ml-1 text-xs">(Playing)</span>}
                </h3>
                <div className="flex items-center gap-1 mt-1">
                  <Coins className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-sm">{otherPlayers[2]?.coins}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Bottom Row */}
        {/* Bottom Left - Score Panel */}
        <div className="flex items-end justify-start">
          <Card className="p-3 md:p-4 bg-slate-800/90 backdrop-blur-sm shadow-2xl border-2 border-yellow-400">
            <div className="flex gap-2 md:gap-3 text-sm md:text-lg font-bold justify-center mb-2">
              {Object.entries(userPlayer.scores).map(([suit, score]) => (
                <div
                  key={suit}
                  className={`flex flex-col items-center p-1 rounded-lg ${
                    suit === userPlayer.bestSuit 
                      ? 'bg-green-600/30 text-green-300 border border-green-400' 
                      : 'bg-slate-700/70 text-slate-200'
                  }`}
                >
                  <span className="text-sm md:text-lg">{suitEmojis[suit]}</span>
                  <span className="text-lg md:text-2xl">{score}</span>
                </div>
              ))}
            </div>
            <div className="text-center">
              <div className="text-xl md:text-3xl font-extrabold text-green-400">
                {userPlayer.bestScore}
              </div>
              <div className="text-xs md:text-sm text-slate-400 capitalize">
                Best: {suitEmojis[userPlayer.bestSuit]} {userPlayer.bestSuit}
              </div>
            </div>
          </Card>
        </div>
        
        {/* Bottom Center - User Hand closest to table */}
        <div className="flex items-end justify-center pb-2">
          <UserHand
            cards={userPlayer.cards}
            onCardSelect={onCardSelect}
            selectedCardIndex={selectedCardIndex}
            canSelectCards={canSelectCards}
            cardSize="normal"
            onDiscardCard={turnPhase === 'discard' && isUserTurn && !isKnocker ? handleDiscardCard : undefined}
          />
        </div>
        
        {/* Bottom Right - User Coins */}
        <div className="flex items-end justify-start pl-2">
          <Card className="p-2 md:p-3 bg-slate-800 text-center">
            <div className="flex items-center justify-center gap-2">
              <Coins className="w-4 h-4 md:w-6 md:h-6 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-lg md:text-2xl">{userPlayer.coins}</span>
            </div>
            <div className="text-slate-400 text-xs md:text-sm">Your Coins</div>
          </Card>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute top-6 right-6 flex gap-4">
        {/* Discard Log Toggle Button */}
        <button
          onClick={() => setShowDiscardLog(!showDiscardLog)}
          className="bg-slate-800/80 hover:bg-yellow-400 hover:text-black text-yellow-300 rounded-full p-4 shadow-lg border-2 border-yellow-400 transition-colors touch-button ipad-button"
          aria-label="Toggle Discard Log"
        >
          <Hand className="w-8 h-8" />
        </button>
        
        {/* Info Button */}
        <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
          <DialogTrigger asChild>
            <button
              className="bg-slate-800/80 hover:bg-yellow-400 hover:text-black text-yellow-300 rounded-full p-4 shadow-lg border-2 border-yellow-400 transition-colors touch-button ipad-button"
              aria-label="Show Game Rules"
            >
              <Info className="w-8 h-8" />
            </button>
          </DialogTrigger>
          <DialogContent className="p-0 overflow-hidden max-w-7xl w-full bg-slate-900 border-2 border-yellow-400 shadow-2xl">
            <div className="w-full h-[85vh] flex">
              {/* Rules Section - Left Side */}
              <div className="flex-1 p-8 bg-slate-900 text-white overflow-y-auto">
                <h2 className="text-3xl font-bold mb-6 text-yellow-300 text-center">How to Play Blitz Card Chase</h2>
                <ol className="list-decimal list-inside space-y-4 text-lg leading-relaxed">
                  <li>Each player starts with 4 coins and is dealt 3 cards.</li>
                  <li>On your turn, draw a card from the draw pile or take the top card from the discard pile.</li>
                  <li>After drawing, discard one card from your hand.</li>
                  <li>Your goal is to get the highest total in a single suit (♥️, ♦️, ♣️, ♠️). 31 is the best possible hand (Blitz).</li>
                  <li>You may "Knock" if you think you have the best hand. After a knock, all other players get one final turn to improve their hand.</li>
                  <li>If a player gets 31 (Blitz), the hand ends immediately and all other players lose a coin to the winner.</li>
                  <li>After the final turn, the player with the best hand wins the round and takes a coin from the lowest scorer.</li>
                  <li>Players with 0 coins are eliminated. The last player with coins wins the game!</li>
                </ol>
                <div className="mt-8 text-center text-yellow-200 text-xl font-semibold">Good luck and have fun!</div>
              </div>
              
              {/* Video Section - Right Side */}
              <div className="flex-1 bg-black flex items-center justify-center">
                <div className="w-full h-full flex items-center justify-center">
                  <video
                    src={videoSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Score Panel - Larger for iPad */}
      <div className="absolute bottom-6 left-6 z-40">
        <Card className="p-6 bg-slate-800/90 backdrop-blur-sm shadow-2xl border-2 border-yellow-400">
          <div className="flex gap-4 text-xl font-bold justify-center mb-3">
            {Object.entries(userPlayer.scores).map(([suit, score]) => (
              <div
                key={suit}
                className={`flex flex-col items-center p-2 rounded-lg text-2xl ${
                  suit === userPlayer.bestSuit 
                    ? 'bg-green-600/30 text-green-300 border border-green-400' 
                    : 'bg-slate-700/70 text-slate-200'
                }`}
              >
                <span className="text-2xl">{suitEmojis[suit]}</span>
                <span className="text-3xl">{score}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <div className="text-4xl font-extrabold text-green-400">
              {userPlayer.bestScore}
            </div>
            <div className="text-base text-slate-400 capitalize">
              Best: {suitEmojis[userPlayer.bestSuit]} {userPlayer.bestSuit}
            </div>
          </div>
        </Card>
      </div>

      {/* Discard Log Panel - Larger for iPad */}
      {showDiscardLog && (
        <div className="absolute top-0 right-0 h-full w-96 bg-slate-900/95 border-l-2 border-yellow-400 z-50 overflow-y-auto p-6 flex flex-col gap-3">
          <div className="flex justify-between items-center mb-6">
            <div className="text-yellow-300 font-bold text-xl">Discard Log</div>
            <button
              onClick={() => setShowDiscardLog(false)}
              className="text-slate-400 hover:text-white touch-button ipad-button"
            >
              <X className="w-8 h-8" />
            </button>
          </div>
          {discardLog.length === 0 && <div className="text-slate-400 text-base">No discards yet.</div>}
          {discardLog.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-3 bg-slate-800 rounded p-3 shadow">
              <span className="font-bold text-yellow-200 text-base">{entry.playerName}</span>
              <span className="text-white text-base">discarded</span>
              <span className="bg-slate-700 px-3 py-2 rounded text-green-300 font-mono text-base flex items-center gap-2">
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
