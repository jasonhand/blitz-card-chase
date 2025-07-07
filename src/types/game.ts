
export interface Card {
  code: string;
  image: string;
  value: string;
  suit: string;
}

export interface Player {
  id: number;
  name: string;
  cards: Card[];
  coins: number;
  isEliminated: boolean;
  scores: {
    hearts: number;
    diamonds: number;
    clubs: number;
    spades: number;
  };
  bestScore: number;
  bestSuit: string;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  deckId: string | null;
  discardPile: Card[];
  gamePhase: 'setup' | 'playing' | 'finalRound' | 'roundEnd' | 'gameEnd';
  hasKnocked: boolean;
  knocker: number | null;
  finalRoundPlayers: Set<number>;
  roundNumber: number;
  winner: Player | null;
  message: string;
}

export interface DeckResponse {
  success: boolean;
  deck_id: string;
  shuffled: boolean;
  remaining: number;
}

export interface DrawResponse {
  success: boolean;
  deck_id: string;
  cards: Card[];
  remaining: number;
}
