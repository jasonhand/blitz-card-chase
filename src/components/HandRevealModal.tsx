import React, { useEffect, useMemo } from 'react';
import { Card as CardType, Player } from '../types/game';
import { Card } from './ui/card';

interface HandRevealModalProps {
  players: Player[];
  userName: string;
  onContinue: () => void;
}

const HandRevealModal: React.FC<HandRevealModalProps> = ({ players, userName, onContinue }) => {
  // Create a completely frozen snapshot to prevent any updates
  const frozenPlayers = useMemo(() => {
    return players.filter(p => p.name !== userName).map(player => ({
      ...player,
      cards: player.cards.map(card => ({ ...card })),
      scores: { ...player.scores }
    }));
  }, []);  // Empty dependency array means this never changes

  useEffect(() => {
    const timer = setTimeout(() => {
      onContinue();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onContinue]);

  const handleClick = (e: React.MouseEvent) => {
    // Prevent event bubbling if clicking on inner content
    if (e.target !== e.currentTarget) return;
    onContinue();
  };

  const renderCard = (card: CardType) => (
    <div
      key={`${card.suit}-${card.value}`}
      className="relative w-16 h-24 bg-white rounded-lg border-2 border-gray-300 shadow-lg flex flex-col items-center justify-center text-black font-bold"
    >
      <div className="text-lg">{card.value}</div>
      <div className="text-xl">
        {card.suit === 'HEARTS' && '♥️'}
        {card.suit === 'DIAMONDS' && '♦️'}
        {card.suit === 'CLUBS' && '♣️'}
        {card.suit === 'SPADES' && '♠️'}
      </div>
    </div>
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 cursor-pointer"
      onClick={handleClick}
    >
      <div className="bg-slate-800 border-2 border-yellow-400 rounded-lg p-6 max-w-4xl w-full mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-yellow-300 mb-2">Round Complete - Hands Revealed</h2>
          <p className="text-gray-300 text-sm">Click anywhere to continue (auto-continues in 5 seconds)</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {frozenPlayers.map((player) => (
            <Card key={player.id} className="p-4 bg-slate-700 border-yellow-400">
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-white mb-1">{player.name}</h3>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-yellow-400 font-bold">Best: {player.bestScore}</span>
                  <span className="text-gray-300">
                    ({player.bestSuit === 'hearts' && '♥️'}
                    {player.bestSuit === 'diamonds' && '♦️'}
                    {player.bestSuit === 'clubs' && '♣️'}
                    {player.bestSuit === 'spades' && '♠️'})
                  </span>
                </div>
              </div>
              
              <div className="flex justify-center gap-2">
                {player.cards.map((card) => renderCard(card))}
              </div>
              
              <div className="mt-3 text-xs text-gray-400 text-center">
                <div className="grid grid-cols-2 gap-1">
                  <span>♥️: {player.scores.hearts}</span>
                  <span>♦️: {player.scores.diamonds}</span>
                  <span>♣️: {player.scores.clubs}</span>
                  <span>♠️: {player.scores.spades}</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HandRevealModal;