
import { Card, Player } from "@/types/game";

export const getCardValue = (card: Card): number => {
  if (card.value === 'ACE') return 11;
  if (['JACK', 'QUEEN', 'KING'].includes(card.value)) return 10;
  return parseInt(card.value);
};

export const getSuitName = (suit: string): string => {
  return suit.toLowerCase() as 'hearts' | 'diamonds' | 'clubs' | 'spades';
};

export const calculatePlayerScores = (player: Player): Player => {
  const scores = {
    hearts: 0,
    diamonds: 0,
    clubs: 0,
    spades: 0
  };

  player.cards.forEach(card => {
    const suitName = getSuitName(card.suit);
    scores[suitName as keyof typeof scores] += getCardValue(card);
  });

  const bestScore = Math.max(...Object.values(scores));
  const bestSuit = Object.entries(scores).find(([_, score]) => score === bestScore)?.[0] || 'hearts';

  return {
    ...player,
    scores,
    bestScore,
    bestSuit
  };
};

export const createInitialPlayer = (id: number, name: string): Player => ({
  id,
  name,
  cards: [],
  coins: 4,
  isEliminated: false,
  scores: { hearts: 0, diamonds: 0, clubs: 0, spades: 0 },
  bestScore: 0,
  bestSuit: 'hearts'
});

// Check if a player has hit 31 (BLITZ)
export const hasBlitz = (player: Player): boolean => {
  return player.bestScore === 31;
};
