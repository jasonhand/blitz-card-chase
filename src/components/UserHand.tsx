import { Card as CardType } from "@/types/game";

interface UserHandProps {
  cards: CardType[];
  onCardSelect: (cardIndex: number) => void;
  selectedCardIndex: number | null;
  canSelectCards: boolean;
  cardSize?: 'large' | 'normal';
  onDiscardCard?: (cardIndex: number) => void;
}

const UserHand = ({
  cards,
  onCardSelect,
  selectedCardIndex,
  canSelectCards,
  cardSize = 'normal',
  onDiscardCard,
}: UserHandProps) => {
  // iPad-optimized card sizes
  const cardClass = cardSize === 'large' ? 'w-32 h-44' : 'w-24 h-32';
  
  return (
    <div className="flex gap-4 justify-center items-center px-4">
      {cards.map((card, index) => (
        <div
          key={card.code}
          className={`relative transition-all duration-200 game-card ${
            canSelectCards ? 'cursor-pointer card-hover' : ''
          } ${
            selectedCardIndex === index 
              ? 'transform -translate-y-6 ring-4 ring-red-400 shadow-xl scale-105' 
              : canSelectCards 
                ? 'hover:transform hover:-translate-y-3 hover:shadow-lg hover:scale-102' 
                : ''
          }`}
          onClick={() => canSelectCards && (onDiscardCard ? onDiscardCard(index) : onCardSelect(index))}
          style={{ 
            minHeight: cardSize === 'large' ? '176px' : '128px',
            minWidth: cardSize === 'large' ? '128px' : '96px'
          }}
        >
          <img
            src={card.image}
            alt={`${card.value} of ${card.suit}`}
            className={`${cardClass} rounded-lg shadow-md object-cover touch-image`}
            draggable={false}
          />
          {/* Touch feedback overlay for better iPad experience */}
          {canSelectCards && (
            <div className="absolute inset-0 rounded-lg bg-transparent hover:bg-white/10 transition-colors duration-200" />
          )}
        </div>
      ))}
    </div>
  );
};

export default UserHand;
