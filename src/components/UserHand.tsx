
import { Card as CardType } from "@/types/game";

interface UserHandProps {
  cards: CardType[];
  onCardSelect: (cardIndex: number) => void;
  selectedCardIndex: number | null;
  canSelectCards: boolean;
}

const UserHand = ({ cards, onCardSelect, selectedCardIndex, canSelectCards }: UserHandProps) => {
  return (
    <div className="flex justify-center gap-4">
      {cards.map((card, index) => (
        <div
          key={card.code}
          className={`relative transition-all duration-200 ${
            canSelectCards ? 'cursor-pointer' : 'cursor-default'
          } ${
            selectedCardIndex === index 
              ? 'transform -translate-y-4 ring-4 ring-red-400' 
              : canSelectCards ? 'hover:transform hover:-translate-y-2' : ''
          }`}
          onClick={() => canSelectCards && onCardSelect(index)}
        >
          <img
            src={card.image}
            alt={`${card.value} of ${card.suit}`}
            className="w-24 h-32 rounded-lg shadow-lg"
          />
        </div>
      ))}
    </div>
  );
};

export default UserHand;
