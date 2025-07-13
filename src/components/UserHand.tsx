import { Card as CardType } from "@/types/game";

interface UserHandProps {
  cards: CardType[];
  onCardSelect: (cardIndex: number) => void;
  selectedCardIndex: number | null;
  canSelectCards: boolean;
  cardSize?: 'large' | 'normal';
  onDiscardCard?: (cardIndex: number) => void;
  isDiscardPhase?: boolean;
}

const UserHand = ({
  cards,
  onCardSelect,
  selectedCardIndex,
  canSelectCards,
  cardSize = 'normal',
  onDiscardCard,
  isDiscardPhase = false,
}: UserHandProps) => {
  // Responsive card sizes
  const cardClass = cardSize === 'large' 
    ? 'w-20 h-28 md:w-24 md:h-32 lg:w-32 lg:h-44' 
    : 'w-16 h-20 md:w-20 md:h-28 lg:w-24 lg:h-32';
  
  return (
    <div className="space-y-3">
      {/* Instruction Text */}
      {canSelectCards && (
        <div className="text-center">
          <p className="text-lg font-semibold text-yellow-400">
            {isDiscardPhase ? "👆 Tap a card to discard it" : "👆 Tap a card to select it"}
          </p>
          {isDiscardPhase && (
            <p className="text-sm text-gray-300 mt-1">
              Choose wisely - you can't undo this action!
            </p>
          )}
        </div>
      )}
      
      <div className="flex gap-2 justify-center items-center px-2 max-w-sm">
        {cards.map((card, index) => (
          <div
            key={card.code}
            className={`relative transition-all duration-200 game-card ${
              canSelectCards ? 'cursor-pointer card-hover' : ''
            } ${
              selectedCardIndex === index 
                ? 'transform -translate-y-2 ring-2 ring-red-400 shadow-xl scale-105' 
                : canSelectCards 
                  ? 'hover:transform hover:-translate-y-1 hover:shadow-lg hover:scale-102' 
                  : ''
            }`}
            onClick={() => canSelectCards && (onDiscardCard ? onDiscardCard(index) : onCardSelect(index))}
            style={{ 
              minHeight: '80px',
              minWidth: '60px'
            }}
            data-dd-action-name={`${onDiscardCard ? 'Discard Card' : 'Select Card'} - ${card.value} of ${card.suit}`}
          >
            <img
              src={card.image}
              alt={`${card.value} of ${card.suit}`}
              className="w-16 h-20 rounded-lg shadow-md object-cover touch-image"
              draggable={false}
            />
            {/* Touch feedback overlay for better iPad experience */}
            {canSelectCards && (
              <div className="absolute inset-0 rounded-lg bg-transparent hover:bg-white/10 transition-colors duration-200" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserHand;