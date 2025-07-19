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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 game-container no-select relative">
      {/* iPad-optimized Fixed Layout - No grid, absolute positioning for stability */}
      <div className="w-full min-h-screen relative overflow-hidden">
        
        {/* Top Area - Game Message */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
          <div className="text-center animate-fade-in-out select-none pointer-events-none">
            <span className="text-white font-extrabold text-lg md:text-xl lg:text-2xl drop-shadow-lg bg-slate-900/70 px-4 py-2 rounded-lg">
              {message}
            </span>
          </div>
        </div>

        {/* Peggy - Top Left */}
        <div className="absolute top-16 md:top-20 left-4 z-20 flex items-center gap-4">
          {!otherPlayers[1]?.isEliminated ? (
            <img
              src="/Bill_images/Peggy.png"
              alt="Peggy"
              className="w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 object-contain"
            />
          ) : (
            <div className="w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 flex items-center justify-center bg-red-900/50 rounded-lg">
              <span className="text-red-400 font-bold text-sm md:text-base lg:text-lg">OUT</span>
            </div>
          )}
          <div className="flex flex-col items-center">
            <h3 className={`font-extrabold text-lg md:text-xl lg:text-2xl ${
              otherPlayers[1]?.id === currentPlayerIndex ? 'text-blue-400' : 
              otherPlayers[1]?.isEliminated ? 'text-red-400' : 'text-yellow-100'
            }`}>
              Peggy
              {otherPlayers[1]?.id === currentPlayerIndex && <span className="ml-2 text-xs md:text-sm">(Playing)</span>}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Coins className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-base md:text-lg">{otherPlayers[1]?.coins}</span>
            </div>
          </div>
        </div>

        {/* Bill - Left Side Middle */}
        <div className="absolute top-1/2 left-4 transform -translate-y-8 md:-translate-y-4 z-20 flex items-center gap-4">
          {!otherPlayers[0]?.isEliminated ? (
            <img
              src="/Bill_images/Bill_pixel.png"
              alt="Bill"
              className="w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 object-contain"
              style={{ imageRendering: 'pixelated' }}
            />
          ) : (
            <div className="w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 flex items-center justify-center bg-red-900/50 rounded-lg">
              <span className="text-red-400 font-bold text-sm md:text-base lg:text-lg">OUT</span>
            </div>
          )}
          <div className="flex flex-col items-center">
            <h3 className={`font-extrabold text-lg md:text-xl lg:text-2xl ${
              otherPlayers[0]?.id === currentPlayerIndex ? 'text-blue-400' : 
              otherPlayers[0]?.isEliminated ? 'text-red-400' : 'text-yellow-100'
            }`}>
              Bill
              {otherPlayers[0]?.id === currentPlayerIndex && <span className="ml-2 text-xs md:text-sm">(Playing)</span>}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Coins className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-base md:text-lg">{otherPlayers[0]?.coins}</span>
            </div>
          </div>
        </div>

        {/* Mom-Mom - Left Side Bottom */}
        <div className="absolute bottom-16 md:bottom-20 left-4 z-20 flex items-center gap-4">
          {!otherPlayers[2]?.isEliminated ? (
            <img
              src="/Bill_images/Peggy.png"
              alt="Mom-Mom"
              className="w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 object-contain"
            />
          ) : (
            <div className="w-28 h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 flex items-center justify-center bg-red-900/50 rounded-lg">
              <span className="text-red-400 font-bold text-sm md:text-base lg:text-lg">OUT</span>
            </div>
          )}
          <div className="flex flex-col items-center">
            <h3 className={`font-extrabold text-lg md:text-xl lg:text-2xl ${
              otherPlayers[2]?.id === currentPlayerIndex ? 'text-blue-400' : 
              otherPlayers[2]?.isEliminated ? 'text-red-400' : 'text-yellow-100'
            }`}>
              Mom-Mom
              {otherPlayers[2]?.id === currentPlayerIndex && <span className="ml-2 text-xs md:text-sm">(Playing)</span>}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Coins className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-base md:text-lg">{otherPlayers[2]?.coins}</span>
            </div>
          </div>
        </div>

        {/* Center Table Area */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="flex flex-col items-center gap-4">
            {/* Table Background */}
            <div className="absolute inset-0 -z-10">
              <img
                src="/Bill_images/table.png"
                alt="Table"
                className="w-96 h-96 md:w-[500px] md:h-[500px] object-contain opacity-60"
              />
            </div>

            {/* Pending Draw Card */}
            {pendingDrawCard && (
              <div className="flex flex-col items-center cursor-pointer mb-4" onClick={() => onCardSelect(-1)} data-dd-action-name={`Select Drawn Card - ${pendingDrawCard.value} of ${pendingDrawCard.suit}`}>
                <div className="text-white text-sm mb-1">Drawn Card</div>
                <img
                  src={pendingDrawCard.image}
                  alt={`${pendingDrawCard.value} of ${pendingDrawCard.suit}`}
                  className={`w-20 h-28 md:w-24 md:h-32 rounded shadow-lg object-cover border-4 ${selectedCardIndex === -1 ? 'border-red-400' : 'border-yellow-400'} bg-slate-900`}
                />
                {selectedCardIndex === -1 && (
                  <div className="text-red-400 font-bold mt-1">Selected</div>
                )}
              </div>
            )}

            {/* Card Piles */}
            <div className="flex gap-6">
              {/* Discard Pile */}
              <div className="flex flex-col items-center">
                <div className="text-white font-semibold text-sm mb-1">Discard</div>
                <div 
                  className={`w-20 h-28 md:w-24 md:h-32 flex items-center justify-center ${
                    topDiscardCard && turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-green-400' : ''
                  }`}
                  onClick={() => topDiscardCard && turnPhase === 'decision' && isUserTurn && onDrawFromDiscard()}
                  data-dd-action-name="Draw From Discard Pile"
                >
                  {topDiscardCard ? (
                    <img
                      src={topDiscardCard.image}
                      alt={`${topDiscardCard.value} of ${topDiscardCard.suit}`}
                      className="w-20 h-28 md:w-24 md:h-32 rounded shadow-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-28 md:w-24 md:h-32 bg-slate-700 rounded-lg border-2 border-dashed border-slate-500 flex items-center justify-center">
                      <div className="text-slate-500 text-xs">Empty</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Deck Pile */}
              <div className="flex flex-col items-center">
                <div className="text-white font-semibold text-sm mb-1">Draw</div>
                <div 
                  className={`w-20 h-28 md:w-24 md:h-32 bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg border-2 border-blue-400 flex items-center justify-center shadow-lg ${
                    turnPhase === 'decision' && isUserTurn ? 'cursor-pointer hover:ring-2 hover:ring-blue-400' : ''
                  }`}
                  onClick={() => turnPhase === 'decision' && isUserTurn && onDrawFromDeck()}
                  data-dd-action-name="Draw From Deck"
                >
                  <img
                    src="/Bill_images/Card_back.jpg"
                    alt="Deck Card Back"
                    className="w-20 h-28 md:w-24 md:h-32 object-cover rounded"
                  />
                </div>
                <div className="text-slate-400 text-xs mt-1">{deckRemaining} cards</div>
              </div>
            </div>

            {/* Knock Button */}
            {isUserTurn && turnPhase === 'decision' && canKnock && (
              <div className="mt-4">
                <button
                  onClick={onKnock}
                  className="bg-transparent hover:bg-yellow-400/20 text-yellow-400 hover:text-yellow-300 font-bold px-6 py-3 text-lg flex items-center gap-2 transition-all duration-200"
                  data-dd-action-name="Knock Button"
                >
                  <span className="text-xl">✊</span>
                  Knock
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User Area - Right Side (adjusted for iPad visibility) */}
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
          <div className="flex flex-col items-center gap-3 max-w-sm">
            {/* User Name */}
            <h3 className="font-extrabold text-xl md:text-2xl text-yellow-100 text-center">{userPlayer.name}</h3>
            
            {/* User Hand */}
            <div className="flex flex-col items-center gap-2">
              <UserHand
                cards={userPlayer.cards}
                onCardSelect={onCardSelect}
                selectedCardIndex={selectedCardIndex}
                canSelectCards={canSelectCards}
                cardSize="normal"
                isDiscardPhase={turnPhase === 'discard'}
                onDiscardCard={turnPhase === 'discard' && isUserTurn && !isKnocker ? handleDiscardCard : undefined}
              />
            </div>
            
            {/* User Coins */}
            <div className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-400 font-bold text-lg">{userPlayer.coins}</span>
            </div>

            {/* User Score Panel */}
            <Card className="p-3 bg-slate-800/90 backdrop-blur-sm shadow-2xl border-2 border-yellow-400">
              <div className="flex gap-2 text-sm font-bold justify-center mb-2">
                {Object.entries(userPlayer.scores).map(([suit, score]) => (
                  <div
                    key={suit}
                    className={`flex flex-col items-center p-1 rounded-lg ${
                      suit === userPlayer.bestSuit 
                        ? 'bg-green-600/30 text-green-300 border border-green-400' 
                        : 'bg-slate-700/70 text-slate-200'
                    }`}
                  >
                    <span className="text-sm">{suitEmojis[suit]}</span>
                    <span className="text-lg">{score}</span>
                  </div>
                ))}
              </div>
              <div className="text-center">
                <div className="text-xl font-extrabold text-green-400">
                  {userPlayer.bestScore}
                </div>
                <div className="text-xs text-slate-400 capitalize">
                  Best: {suitEmojis[userPlayer.bestSuit]} {userPlayer.bestSuit}
                </div>
              </div>
            </Card>
          </div>
        </div>


        {/* Discard Log - Toggleable */}
        {showDiscardLog && (
          <div className="absolute top-16 right-4 z-30">
            <div className="w-72 max-h-80 bg-slate-900/95 border-2 border-yellow-400 overflow-y-auto p-3 flex flex-col gap-2 rounded-lg shadow-2xl scrollbar-hide">
              <div className="text-yellow-300 font-bold text-base mb-2">Discard Log</div>
              {discardLog.length === 0 && <div className="text-slate-400 text-sm">No discards yet.</div>}
              {discardLog.slice(0, 5).map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-800 rounded p-2 shadow">
                  <span className="font-bold text-yellow-200 text-sm">{entry.playerName}</span>
                  <span className="text-white text-sm">discarded</span>
                  <span className="bg-slate-700 px-2 py-1 rounded text-green-300 font-mono text-sm flex items-center gap-1">
                    {entry.card.value} <span>{suitEmojis[entry.card.suit.toLowerCase()]}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Top-level action buttons: Change Name, Rules, and Discard Log */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        {showChangeNameBtn && onChangeName && (
          <button
            className="bg-slate-800/80 hover:bg-yellow-400 hover:text-black text-yellow-300 rounded-full p-3 shadow-lg border-2 border-yellow-400 transition-colors flex items-center justify-center"
            onClick={onChangeName}
            aria-label="Change Name"
            data-dd-action-name="Change Name Button"
          >
            <UserIcon className="w-6 h-6" />
          </button>
        )}
        <button
          className="bg-slate-800/80 hover:bg-yellow-400 hover:text-black text-yellow-300 rounded-full p-3 shadow-lg border-2 border-yellow-400 transition-colors flex items-center justify-center"
          onClick={() => setShowDiscardLog(!showDiscardLog)}
          aria-label="Toggle Discard Log"
          data-dd-action-name="Toggle Discard Log"
        >
          <Hand className="w-6 h-6" />
        </button>
        <Dialog open={rulesOpen} onOpenChange={setRulesOpen}>
          <DialogTrigger asChild>
            <button
              className="bg-slate-800/80 hover:bg-yellow-400 hover:text-black text-yellow-300 rounded-full p-3 shadow-lg border-2 border-yellow-400 transition-colors flex items-center justify-center"
              aria-label="Show Game Rules"
              data-dd-action-name="Show Rules Button"
            >
              <Info className="w-6 h-6" />
            </button>
          </DialogTrigger>
          <DialogContent className="p-0 overflow-hidden max-w-7xl w-full bg-slate-900 border-2 border-yellow-400 shadow-2xl">
            <div className="w-full h-[85vh] flex">
              {/* Rules Section - Left Side */}
              <div className="flex-1 p-8 bg-slate-900 text-white overflow-y-auto">
                <h2 className="text-3xl font-bold mb-6 text-yellow-300 text-center">How to Play Blitz with Bill, Peggy & Mom-Mom</h2>
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
      {/* Hide scrollbar utility */}
      <style>
        {`.scrollbar-hide::-webkit-scrollbar { display: none; }
          .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }`}
      </style>
    </div>
  );
};

export default GameLayout;
