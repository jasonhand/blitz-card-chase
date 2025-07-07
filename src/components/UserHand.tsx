
import { Card as CardType } from "@/types/game";

interface UserHandProps {
  cards: CardType[];
  onCardSelect: (cardIndex: number) => void;
  selectedCardIndex: number | null;
  canSelectCards: boolean;
}

const UserHand = ({
  cards,
  onCardSelect,
  selectedCardIndex,
  canSelectCards
}: UserHandProps) => {
  return (
    <div className="flex gap-3 justify-center items-center">
      {cards.map((card, index) => (
        <div
          key={card.code}
          className={`relative transition-all duration-200 ${
            canSelectCards ? 'cursor-pointer' : ''
          } ${
            selectedCardIndex === index 
              ? 'transform -translate-y-4 ring-4 ring-red-400 shadow-xl' 
              : canSelectCards 
                ? 'hover:transform hover:-translate-y-2 hover:shadow-lg' 
                : ''
          }`}
          onClick={() => canSelectCards && onCardSelect(index)}
        >
          <img
            src={card.image}
            alt={`${card.value} of ${card.suit}`}
            className="w-20 h-28 rounded-lg shadow-md"
          />
        </div>
      ))}
    </div>
  );
};

export default UserHand;
