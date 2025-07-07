
import { DeckResponse, DrawResponse } from "@/types/game";

const BASE_URL = "https://deckofcardsapi.com/api/deck";

export const deckApi = {
  async createNewDeck(): Promise<DeckResponse> {
    const response = await fetch(`${BASE_URL}/new/shuffle/`);
    if (!response.ok) {
      throw new Error('Failed to create new deck');
    }
    return response.json();
  },

  async drawCards(deckId: string, count: number = 1): Promise<DrawResponse> {
    const response = await fetch(`${BASE_URL}/${deckId}/draw/?count=${count}`);
    if (!response.ok) {
      throw new Error('Failed to draw cards');
    }
    return response.json();
  },

  async reshuffleDeck(deckId: string): Promise<DeckResponse> {
    const response = await fetch(`${BASE_URL}/${deckId}/shuffle/`);
    if (!response.ok) {
      throw new Error('Failed to reshuffle deck');
    }
    return response.json();
  }
};
