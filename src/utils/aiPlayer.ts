
import { Player, Card } from "@/types/game";
import { getCardValue } from "./gameUtils";

export interface AIDecision {
  action: 'knock' | 'draw';
  drawFrom?: 'deck' | 'discard';
  discardIndex?: number;
}

// Calculate the potential value of taking the discard card
const calculateDiscardValue = (player: Player, discardCard: Card): number => {
  const suitName = discardCard.suit.toLowerCase() as 'hearts' | 'diamonds' | 'clubs' | 'spades';
  const cardValue = getCardValue(discardCard);
  
  // Check what the new score would be in that suit
  const currentSuitScore = player.scores[suitName] || 0;
  const newSuitScore = currentSuitScore + cardValue;
  
  return Math.max(newSuitScore, player.bestScore);
}

// Find the best card to discard (lowest value in worst suit)
const findBestDiscardIndex = (player: Player): number => {
  let worstIndex = 0;
  let worstValue = Infinity;
  
  player.cards.forEach((card, index) => {
    const suitName = card.suit.toLowerCase() as 'hearts' | 'diamonds' | 'clubs' | 'spades';
    const cardValue = getCardValue(card);
    
    // Calculate what the score would be without this card
    const currentSuitScore = player.scores[suitName];
    const scoreWithoutCard = currentSuitScore - cardValue;
    
    // Prefer to discard cards from weaker suits or lower value cards
    const discardPriority = cardValue + (suitName === player.bestSuit ? 5 : 0);
    
    if (discardPriority < worstValue) {
      worstValue = discardPriority;
      worstIndex = index;
    }
  });
  
  return worstIndex;
}

export const makeAIDecision = (
  player: Player, 
  topDiscardCard: Card | null,
  otherPlayersCount: number,
  hasKnocked: boolean
): AIDecision => {
  const currentScore = player.bestScore;
  
  // AI personality factors based on player ID
  const riskTolerance = 0.7 + (player.id * 0.1); // Different risk levels
  const aggressiveness = 0.6 + (player.id * 0.08);
  
  // Decision thresholds
  const knockThreshold = Math.floor(20 + (riskTolerance * 8)); // 20-27 range
  const conservativeThreshold = Math.floor(15 + (aggressiveness * 10)); // 15-25 range
  
  // If in final round (someone knocked), be more aggressive
  if (hasKnocked) {
    if (currentScore >= 18) {
      return { action: 'knock' };
    }
    // In final round, more likely to take risks
    if (topDiscardCard) {
      const discardValue = calculateDiscardValue(player, topDiscardCard);
      if (discardValue > currentScore + 3) {
        return { 
          action: 'draw', 
          drawFrom: 'discard',
          discardIndex: findBestDiscardIndex(player)
        };
      }
    }
    return { 
      action: 'draw', 
      drawFrom: 'deck',
      discardIndex: findBestDiscardIndex(player)
    };
  }
  
  // Regular turn logic
  
  // High score - consider knocking
  if (currentScore >= knockThreshold) {
    // Random chance based on score confidence
    const knockChance = Math.min(0.8, (currentScore - 15) / 15);
    if (Math.random() < knockChance) {
      return { action: 'knock' };
    }
  }
  
  // Decide whether to draw from discard or deck
  if (topDiscardCard) {
    const potentialValue = calculateDiscardValue(player, topDiscardCard);
    const improvement = potentialValue - currentScore;
    
    // Take discard if it significantly improves score
    if (improvement >= 3 || (improvement >= 1 && currentScore < conservativeThreshold)) {
      return { 
        action: 'draw', 
        drawFrom: 'discard',
        discardIndex: findBestDiscardIndex(player)
      };
    }
  }
  
  // Default to drawing from deck
  return { 
    action: 'draw', 
    drawFrom: 'deck',
    discardIndex: findBestDiscardIndex(player)
  };
};
