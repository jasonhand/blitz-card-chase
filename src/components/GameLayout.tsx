import { Player, Card as CardType } from "@/types/game";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Hand, Coins, Info, X, User as UserIcon } from "lucide-react";
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
  showChangeNameBtn?: boolean;
  onChangeName?: () => void;
  pendingDrawCard?: CardType | null;
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
  discardLog,
  showChangeNameBtn,
  onChangeName,
  pendingDrawCard,
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
  const videoOptions = ["/Bill_images/Bill_01.mp4", "/Bill_images/Bill_02.mp4", "/Bill_images/Peggy.mp4"];
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
      {/* iPad-optimized Grid Layout with proper spacing */}
      <div className="h-screen grid grid-rows-[auto_1fr_auto] grid-cols-[auto_1fr_auto] gap-y-2 gap-x-4 p-0 m-0 max-h-screen overflow-hidden">
        
        {/* Top Row */}
        {/* Top Left - Message */}
        <div className="flex flex-col items-center justify-center gap-1 relative h-[56px] md:h-[64px] lg:h-[72px] overflow-hidden">
          {/* Game Message - absolutely positioned, smaller font, lowered by 10px, fixed height */}
          <div className="absolute left-0 top-[10px] w-full h-full flex items-center justify-center text-center animate-fade-in-out select-none pointer-events-none">
            <span className="text-white font-extrabold text-base md:text-lg lg:text-xl drop-shadow-lg w-full block">
              {message}
            </span>
          </div>
        </div>
        
        {/* Top Center - Peggy positioned at top */}
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center justify-center">
            <img
              src="/Bill_images/Peggy.png"
              alt="Peggy"
              className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain"
            />
            <div className="flex flex-col justify-center ml-4">
              <div className="flex flex-col items-start">
                <h3 className={`font-extrabold text-3xl md:text-4xl lg:text-5xl ${
                  otherPlayers[1]?.id === currentPlayerIndex ? 'text-blue-400' : 'text-yellow-100'
                }`}>
                  Peggy
                  {otherPlayers[1]?.id === currentPlayerIndex && <span className="ml-2 text-lg align-top">(Playing)</span>}
                </h3>
                <div className="flex items-center gap-2 mt-2">
                  <Coins className="w-6 h-6 text-yellow-400" />
                  <span className="text-yellow-400 font-bold text-xl">{otherPlayers[1]?.coins}</span>
                </div>
              </div>
            </div>
          </div>
          {/* Knock Button - now between Peggy and the piles */}
          {isUserTurn && turnPhase === 'decision' && canKnock && (
            <div className="flex justify-center mt-2 mb-2">
              <button
                onClick={onKnock}
                className="bg-transparent hover:bg-yellow-400/20 text-yellow-400 hover:text-yellow-300 font-bold px-6 py-3 rounded-xl shadow-lg text-xl flex items-center gap-2 border-2 border-yellow-400/50 hover:border-yellow-400 transition-all duration-200"
                data-dd-action-name="Knock Button"
              >
                <span className="text-2xl">✊</span>
                Knock
              </button>
            </div>
          )}
        </div>
        
        {/* Top Right - Discard Log */}
        <div className="flex items-start justify-end pr-4 pt-4">
          <div className="w-80 max-h-96 bg-slate-900/95 border-2 border-yellow-400 z-40 overflow-y-auto p-4 flex flex-col gap-2 rounded-lg shadow-2xl mt-20 scrollbar-hide" data-lov-id="src/components/GameLayout.tsx:127:10" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} data-dd-action-name="Discard Log">
            <div className="text-yellow-300 font-bold text-lg mb-2">Discard Log</div>
            {discardLog.length === 0 && <div className="text-slate-400 text-base">No discards yet.</div>}
            {discardLog.slice(0, 5).map((entry, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-slate-800 rounded p-2 shadow">
                <span className="font-bold text-yellow-200 text-base">{entry.playerName}</span>
                <span className="text-white text-base">discarded</span>
                <span className="bg-slate-700 px-3 py-2 rounded text-green-300 font-mono text-base flex items-center gap-2">
                  {entry.card.value} <span>{suitEmojis[entry.card.suit.toLowerCase()]}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Row */}
        {/* Middle Left - Bill positioned on left side of table */}
        <div className="flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center mb-4">
              <h3 className={`font-extrabold text-3xl md:text-4xl lg:text-5xl ${
                otherPlayers[0]?.id === currentPlayerIndex ? 'text-blue-400' : 'text-yellow-100'
              }`}>
                Bill
                {otherPlayers[0]?.id === currentPlayerIndex && <span className="ml-2 text-lg align-top">(Playing)</span>}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <Coins className="w-6 h-6 text-yellow-400" />
                <span className="text-yellow-400 font-bold text-xl">{otherPlayers[0]?.coins}</span>
              </div>
            </div>
            <img
              src="/Bill_images/Bill_pixel.png"
              alt="Bill"
              className="w-64 h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          </div>
        </div>
        
        {/* Middle Center - Table and Cards */}
        <div className="flex items-center justify-center relative mt-2 mb-2">
          <div className="relative flex flex-col items-center justify-center">
            {/* Pending Draw Card - show in center if present */}
            <div className="mb-4 flex flex-col items-center justify-center" style={{ minHeight: '180px' }}>
              {pendingDrawCard ? (
                <div className="flex flex-col items-center cursor-pointer" onClick={() => onCardSelect(-1)} data-dd-action-name={`Select Drawn Card - ${pendingDrawCard.value} of ${pendingDrawCard.suit}`}>
                  <div className="text-white text-xs md:text-sm mb-1">Drawn Card</div>
                  <img
                    src={pendingDrawCard.image}
                    alt={`${pendingDrawCard.value} of ${pendingDrawCard.suit}`}
                    className={`w-20 h-28 md:w-24 md:h-32 lg:w-32 lg:h-44 rounded shadow-lg object-cover border-4 ${selectedCardIndex === -1 ? 'border-red-400' : 'border-yellow-400'} bg-slate-900`}
                    style={{ zIndex: 10 }}
                  />
                  {selectedCardIndex === -1 && (
                    <div className="text-red-400 font-bold mt-1">Selected</div>
                  )}
                </div>
              ) : (
                <div style={{ width: '128px', height: '180px' }}></div>
              )}
            </div>
            {/* Discard and Draw Piles - Responsive sizing */}
            <div className="flex gap-2 md:gap-4">
              {/* Discard Pile */}
              <div className="flex flex-col items-center">
                <div className="text-white font-semibold text-xs md:text-sm mb-1">Discard</div>
                <div 
                  className={`w-20 h-28 md:w-24 md:h-32 lg:w-32 lg:h-44 flex items-center justify-center ${
                    topDiscardCard && turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-green-400' : ''
                  }`}
                  onClick={() => topDiscardCard && turnPhase === 'decision' && isUserTurn && onDrawFromDiscard()}
                  data-dd-action-name="Draw From Discard Pile"
                >
                  {topDiscardCard ? (
                    <img
                      src={topDiscardCard.image}
                      alt={`${topDiscardCard.value} of ${topDiscardCard.suit}`}
                      className="w-20 h-28 md:w-24 md:h-32 lg:w-32 lg:h-44 rounded shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-28 md:w-24 md:h-32 lg:w-32 lg:h-44 bg-slate-700 rounded-lg border-2 border-dashed border-slate-500 flex items-center justify-center">
                      <div className="text-slate-500 text-xs">Empty</div>
                    </div>
                  )}
                </div>
              </div>
              {/* Deck Pile */}
              <div className="flex flex-col items-center">
                <div className="text-white font-semibold text-xs md:text-sm mb-1">Draw</div>
                <div 
                  className={`w-20 h-28 md:w-24 md:h-32 lg:w-32 lg:h-44 bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg border-2 border-blue-400 flex items-center justify-center shadow-lg ${
                    turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''
                  }`}
                  onClick={() => turnPhase === 'decision' && isUserTurn && onDrawFromDeck()}
                  data-dd-action-name="Draw From Deck"
                >
                  <img
                    src="/Bill_images/Card_back.jpg"
                    alt="Deck Card Back"
                    className="w-20 h-28 md:w-24 md:h-32 lg:w-32 lg:h-44 object-cover rounded"
                  />
                </div>
                <div className="text-slate-400 text-xs mt-1">{deckRemaining} cards</div>
              </div>
            </div>
            
          </div>
        </div>
        
        {/* Middle Right - User Hand and Coins */}
        <div className="flex items-center justify-center mt-2 mb-2">
          <div className="flex flex-col items-center gap-4">
            {/* User Name */}
            <h3 className="font-extrabold text-3xl md:text-4xl lg:text-5xl text-yellow-100 mb-2">{userPlayer.name}</h3>
            {/* User Hand */}
            <UserHand
              cards={userPlayer.cards}
              onCardSelect={onCardSelect}
              selectedCardIndex={selectedCardIndex}
              canSelectCards={canSelectCards}
              cardSize="normal"
              onDiscardCard={turnPhase === 'discard' && isUserTurn && !isKnocker ? handleDiscardCard : undefined}
            />
            
            {/* User Coins */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <Coins className="w-6 h-6 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-xl">{userPlayer.coins}</span>
            </div>
            <div className="text-slate-400 text-sm">Your Coins</div>
          </div>
        </div>

        {/* Bottom Row */}
        {/* Bottom Left - Score Panel (ensure always visible) */}
        <div className="fixed left-4 bottom-2 z-40 max-w-xs md:max-w-sm lg:max-w-md">
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
        
        {/* Bottom Center - Empty now that user hand moved to right */}
        <div></div>
        
        {/* Bottom Right - Empty now that user coins moved to right */}
        <div></div>
      </div>

      {/* Top-level action buttons: Change Name and Rules, centered and side by side */}
      <div className="absolute top-4 left-0 right-0 z-50 flex justify-center items-center gap-4 pointer-events-none">
        {showChangeNameBtn && onChangeName && (
          <button
            className="pointer-events-auto bg-slate-800/80 hover:bg-yellow-400 hover:text-black text-yellow-300 rounded-full p-4 shadow-lg border-2 border-yellow-400 transition-colors flex items-center justify-center"
            onClick={onChangeName}
            aria-label="Change Name"
            data-dd-action-name="Change Name Button"
          >
            <UserIcon className="w-8 h-8" />
          </button>
        )}
        <div className="pointer-events-auto">
          <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
            <DialogTrigger asChild>
              <button
                className="bg-slate-800/80 hover:bg-yellow-400 hover:text-black text-yellow-300 rounded-full p-4 shadow-lg border-2 border-yellow-400 transition-colors flex items-center justify-center"
                aria-label="Show Game Rules"
                data-dd-action-name="Show Rules Button"
              >
                <Info className="w-8 h-8" />
              </button>
            </DialogTrigger>
            <DialogContent className="p-0 overflow-hidden max-w-7xl w-full bg-slate-900 border-2 border-yellow-400 shadow-2xl">
              <div className="w-full h-[85vh] flex">
                {/* Rules Section - Left Side */}
                <div className="flex-1 p-8 bg-slate-900 text-white overflow-y-auto">
                  <h2 className="text-3xl font-bold mb-6 text-yellow-300 text-center">How to Play Blitz with Bill & Peggy</h2>
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
                  <div className="mt-8 flex justify-center">
                    <button
                      className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-6 py-3 rounded shadow-lg text-lg"
                      onClick={() => {
                        let newVideo;
                        do {
                          newVideo = videoOptions[Math.floor(Math.random() * videoOptions.length)];
                        } while (newVideo === videoSrc && videoOptions.length > 1);
                        setVideoSrc(newVideo);
                      }}
                      data-dd-action-name="Show Different Video"
                    >
                      Show a Different Video
                    </button>
                  </div>
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
      </div>
      {/* Hide scrollbar utility */}
      <style>
        {`.scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}
      </style>
    </div>
  );
};

export default GameLayout;
