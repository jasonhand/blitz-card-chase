
import { useState, useEffect } from "react";
import { GameState, Player, Card } from "@/types/game";
import { deckApi } from "@/services/deckApi";
import { calculatePlayerScores, createInitialPlayer } from "@/utils/gameUtils";
import PlayerZone from "./PlayerZone";
import GameControls from "./GameControls";
import CenterArea from "./CenterArea";
import { useToast } from "@/hooks/use-toast";

const BlitzGame = () => {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    deckId: null,
    discardPile: [],
    gamePhase: 'setup',
    hasKnocked: false,
    knocker: null,
    finalRoundPlayers: new Set(),
    roundNumber: 1,
    winner: null,
    message: "Starting new game..."
  });

  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [deckRemaining, setDeckRemaining] = useState(52);
  const [turnPhase, setTurnPhase] = useState<'decision' | 'draw' | 'discard'>('decision');

  // Initialize game
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = async () => {
    try {
      console.log("Initializing new game...");
      
      // Create players
      const players = [
        createInitialPlayer(0, "You"),
        createInitialPlayer(1, "Player 2"),
        createInitialPlayer(2, "Player 3"),
        createInitialPlayer(3, "Player 4")
      ];

      // Create new deck
      const deckResponse = await deckApi.createNewDeck();
      console.log("Created deck:", deckResponse.deck_id);

      setGameState(prev => ({
        ...prev,
        players,
        deckId: deckResponse.deck_id,
        message: "Dealing cards..."
      }));

      // Deal initial cards
      await dealInitialCards(deckResponse.deck_id, players);
      
    } catch (error) {
      console.error("Error initializing game:", error);
      toast({
        title: "Error",
        description: "Failed to initialize game. Please try again.",
        variant: "destructive"
      });
    }
  };

  const dealInitialCards = async (deckId: string, players: Player[]) => {
    try {
      console.log("Dealing initial cards...");
      
      // Draw 12 cards (3 per player)
      const drawResponse = await deckApi.drawCards(deckId, 12);
      console.log("Drew cards:", drawResponse.cards.length);
      
      const updatedPlayers = players.map((player, index) => {
        const playerCards = drawResponse.cards.slice(index * 3, (index + 1) * 3);
        return calculatePlayerScores({ ...player, cards: playerCards });
      });

      setGameState(prev => ({
        ...prev,
        players: updatedPlayers,
        gamePhase: 'playing',
        message: `${updatedPlayers[0].name}'s turn - Knock or Continue?`
      }));
      
      setDeckRemaining(drawResponse.remaining);
      setTurnPhase('decision');
      
      console.log("Game ready to start!");
      
    } catch (error) {
      console.error("Error dealing cards:", error);
      toast({
        title: "Error",
        description: "Failed to deal cards. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleKnock = () => {
    console.log(`Player ${gameState.currentPlayerIndex} knocked!`);
    
    setGameState(prev => ({
      ...prev,
      hasKnocked: true,
      knocker: prev.currentPlayerIndex,
      gamePhase: 'finalRound',
      message: `${prev.players[prev.currentPlayerIndex].name} knocked! Final round begins.`
    }));
    
    // Move to next player for final round
    moveToNextPlayer();
    setTurnPhase('decision');
  };

  const handleDrawFromDeck = async () => {
    if (!gameState.deckId) return;
    
    try {
      console.log("Drawing from deck...");
      const drawResponse = await deckApi.drawCards(gameState.deckId, 1);
      
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const updatedPlayer = calculatePlayerScores({
        ...currentPlayer,
        cards: [...currentPlayer.cards, drawResponse.cards[0]]
      });

      setGameState(prev => ({
        ...prev,
        players: prev.players.map((player, index) => 
          index === prev.currentPlayerIndex ? updatedPlayer : player
        ),
        message: `${updatedPlayer.name} drew a card. Select a card to discard.`
      }));
      
      setDeckRemaining(drawResponse.remaining);
      setTurnPhase('discard');
      
    } catch (error) {
      console.error("Error drawing from deck:", error);
      toast({
        title: "Error",
        description: "Failed to draw card from deck.",
        variant: "destructive"
      });
    }
  };

  const handleDrawFromDiscard = () => {
    if (gameState.discardPile.length === 0) return;
    
    console.log("Drawing from discard pile...");
    const cardToTake = gameState.discardPile[gameState.discardPile.length - 1];
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    const updatedPlayer = calculatePlayerScores({
      ...currentPlayer,
      cards: [...currentPlayer.cards, cardToTake]
    });

    setGameState(prev => ({
      ...prev,
      players: prev.players.map((player, index) => 
        index === prev.currentPlayerIndex ? updatedPlayer : player
      ),
      discardPile: prev.discardPile.slice(0, -1),
      message: `${updatedPlayer.name} drew from discard. Select a card to discard.`
    }));
    
    setTurnPhase('discard');
  };

  const handleDiscard = () => {
    if (selectedCardIndex === null) return;
    
    console.log(`Discarding card at index ${selectedCardIndex}`);
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const cardToDiscard = currentPlayer.cards[selectedCardIndex];
    const remainingCards = currentPlayer.cards.filter((_, index) => index !== selectedCardIndex);
    
    const updatedPlayer = calculatePlayerScores({
      ...currentPlayer,
      cards: remainingCards
    });

    setGameState(prev => ({
      ...prev,
      players: prev.players.map((player, index) => 
        index === prev.currentPlayerIndex ? updatedPlayer : player
      ),
      discardPile: [...prev.discardPile, cardToDiscard]
    }));
    
    setSelectedCardIndex(null);
    
    // Check if final round is complete
    if (gameState.gamePhase === 'finalRound') {
      const newFinalRoundPlayers = new Set(gameState.finalRoundPlayers);
      newFinalRoundPlayers.add(gameState.currentPlayerIndex);
      
      if (newFinalRoundPlayers.size === 3) { // All players except knocker have played
        console.log("Final round complete, calculating scores...");
        calculateRoundResults();
        return;
      } else {
        setGameState(prev => ({
          ...prev,
          finalRoundPlayers: newFinalRoundPlayers
        }));
      }
    }
    
    // Move to next player
    moveToNextPlayer();
    setTurnPhase('decision');
  };

  const moveToNextPlayer = () => {
    const activePlayers = gameState.players.filter(p => !p.isEliminated);
    if (activePlayers.length <= 1) return;
    
    let nextIndex = (gameState.currentPlayerIndex + 1) % gameState.players.length;
    
    // Skip eliminated players
    while (gameState.players[nextIndex].isEliminated) {
      nextIndex = (nextIndex + 1) % gameState.players.length;
    }
    
    // Skip the knocker in final round
    if (gameState.gamePhase === 'finalRound' && nextIndex === gameState.knocker) {
      nextIndex = (nextIndex + 1) % gameState.players.length;
      while (gameState.players[nextIndex].isEliminated) {
        nextIndex = (nextIndex + 1) % gameState.players.length;
      }
    }
    
    const nextPlayer = gameState.players[nextIndex];
    const phaseMessage = gameState.gamePhase === 'finalRound' ? 
      `${nextPlayer.name}'s final turn` : 
      `${nextPlayer.name}'s turn - Knock or Continue?`;
    
    setGameState(prev => ({
      ...prev,
      currentPlayerIndex: nextIndex,
      message: phaseMessage
    }));
  };

  const calculateRoundResults = () => {
    console.log("Calculating round results...");
    
    const knocker = gameState.players[gameState.knocker!];
    const otherPlayers = gameState.players.filter((_, index) => index !== gameState.knocker);
    
    const knockerScore = knocker.bestScore;
    const otherScores = otherPlayers.map(p => p.bestScore);
    const lowestOtherScore = Math.min(...otherScores);
    
    let updatedPlayers = [...gameState.players];
    let resultMessage = "";
    
    // Check if knocker beats at least one other player
    if (knockerScore > lowestOtherScore) {
      // Knocker wins, lowest scorer loses 1 coin
      const lowestScorer = otherPlayers.find(p => p.bestScore === lowestOtherScore)!;
      updatedPlayers[lowestScorer.id] = {
        ...lowestScorer,
        coins: Math.max(0, lowestScorer.coins - 1)
      };
      resultMessage = `${knocker.name} won! ${lowestScorer.name} loses 1 coin.`;
    } else {
      // Knocker loses 2 coins for unsuccessful knock
      updatedPlayers[knocker.id] = {
        ...knocker,
        coins: Math.max(0, knocker.coins - 2)
      };
      resultMessage = `${knocker.name}'s knock failed! Loses 2 coins.`;
    }
    
    // Check for eliminations
    updatedPlayers = updatedPlayers.map(player => ({
      ...player,
      isEliminated: player.coins === 0
    }));
    
    const remainingPlayers = updatedPlayers.filter(p => !p.isEliminated);
    
    if (remainingPlayers.length === 1) {
      // Game over
      setGameState(prev => ({
        ...prev,
        players: updatedPlayers,
        gamePhase: 'gameEnd',
        winner: remainingPlayers[0],
        message: `${remainingPlayers[0].name} wins the game!`
      }));
    } else {
      // Start new round
      toast({
        title: "Round Complete",
        description: resultMessage
      });
      
      setTimeout(() => {
        startNewRound(updatedPlayers);
      }, 2000);
    }
  };

  const startNewRound = async (players: Player[]) => {
    try {
      console.log("Starting new round...");
      
      // Reset game state for new round
      const resetPlayers = players.map(player => ({
        ...player,
        cards: [],
        scores: { hearts: 0, diamonds: 0, clubs: 0, spades: 0 },
        bestScore: 0,
        bestSuit: 'hearts'
      }));
      
      setGameState(prev => ({
        ...prev,
        players: resetPlayers,
        currentPlayerIndex: 0,
        discardPile: [],
        hasKnocked: false,
        knocker: null,
        finalRoundPlayers: new Set(),
        roundNumber: prev.roundNumber + 1,
        gamePhase: 'setup',
        message: "Starting new round..."
      }));
      
      // Deal new cards
      if (gameState.deckId) {
        await dealInitialCards(gameState.deckId, resetPlayers);
      }
      
    } catch (error) {
      console.error("Error starting new round:", error);
      toast({
        title: "Error",
        description: "Failed to start new round.",
        variant: "destructive"
      });
    }
  };

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isCurrentPlayerTurn = gameState.gamePhase === 'playing' || gameState.gamePhase === 'finalRound';
  const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1] || null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {gameState.players.map((player, index) => (
          <PlayerZone
            key={player.id}
            player={player}
            isCurrentPlayer={index === gameState.currentPlayerIndex && isCurrentPlayerTurn}
            onCardSelect={index === gameState.currentPlayerIndex && turnPhase === 'discard' ? setSelectedCardIndex : undefined}
            selectedCardIndex={index === gameState.currentPlayerIndex ? selectedCardIndex : undefined}
            showCards={true}
          />
        ))}
      </div>

      {/* Center Area */}
      <CenterArea 
        topDiscardCard={topDiscardCard}
        deckRemaining={deckRemaining}
      />

      {/* Game Controls */}
      <GameControls
        gamePhase={gameState.gamePhase}
        isCurrentPlayerTurn={isCurrentPlayerTurn}
        canKnock={turnPhase === 'decision'}
        canDraw={turnPhase === 'decision'}
        canDiscard={turnPhase === 'discard'}
        hasSelectedCard={selectedCardIndex !== null}
        topDiscardCard={topDiscardCard}
        onKnock={handleKnock}
        onDrawFromDeck={handleDrawFromDeck}
        onDrawFromDiscard={handleDrawFromDiscard}
        onDiscard={handleDiscard}
        onNewGame={initializeGame}
        message={gameState.message}
      />
    </div>
  );
};

export default BlitzGame;
