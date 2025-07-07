import { useState, useEffect } from "react";
import { GameState, Player, Card } from "@/types/game";
import { deckApi } from "@/services/deckApi";
import { calculatePlayerScores, createInitialPlayer, hasBlitz } from "@/utils/gameUtils";
import { makeAIDecision } from "@/utils/aiPlayer";
import GameLayout from "./GameLayout";
import GameControls from "./GameControls";
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

  useEffect(() => {
    initializeGame();
  }, []);

  // Handle AI turns
  useEffect(() => {
    if (gameState.gamePhase === 'playing' || gameState.gamePhase === 'finalRound') {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      const isUserTurn = gameState.currentPlayerIndex === 0;
      
      if (!isUserTurn && !currentPlayer?.isEliminated && turnPhase === 'decision') {
        // Add delay for AI turn to make it feel more natural
        const aiTurnDelay = setTimeout(() => {
          executeAITurn();
        }, 1500);
        
        return () => clearTimeout(aiTurnDelay);
      }
    }
  }, [gameState.currentPlayerIndex, turnPhase, gameState.gamePhase]);

  const executeAITurn = async () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1] || null;
    const otherPlayersCount = gameState.players.filter(p => !p.isEliminated).length - 1;
    
    console.log(`AI Player ${currentPlayer.name} is thinking...`);
    
    const decision = makeAIDecision(currentPlayer, topDiscardCard, otherPlayersCount, gameState.hasKnocked);
    
    if (decision.action === 'knock') {
      console.log(`${currentPlayer.name} decided to knock!`);
      handleAIKnock();
    } else {
      console.log(`${currentPlayer.name} decided to draw from ${decision.drawFrom}`);
      if (decision.drawFrom === 'deck') {
        await handleAIDrawFromDeck(decision.discardIndex!);
      } else {
        await handleAIDrawFromDiscard(decision.discardIndex!);
      }
    }
  };

  const handleAIKnock = () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    console.log(`${currentPlayer.name} knocked!`);
    
    setGameState(prev => ({
      ...prev,
      hasKnocked: true,
      knocker: prev.currentPlayerIndex,
      gamePhase: 'finalRound',
      message: `${currentPlayer.name} knocked! Final round begins.`
    }));
    
    // Move to next player for final round
    moveToNextPlayer();
    setTurnPhase('decision');
  };

  const handleAIDrawFromDeck = async (discardIndex: number) => {
    if (!gameState.deckId) return;
    
    try {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      console.log(`${currentPlayer.name} drawing from deck...`);
      
      const drawResponse = await deckApi.drawCards(gameState.deckId, 1);
      
      const updatedPlayer = calculatePlayerScores({
        ...currentPlayer,
        cards: [...currentPlayer.cards, drawResponse.cards[0]]
      });

      // Check for BLITZ (31) immediately after drawing
      if (checkForBlitz(updatedPlayer)) {
        return;
      }

      // AI immediately discards
      const cardToDiscard = updatedPlayer.cards[discardIndex];
      const remainingCards = updatedPlayer.cards.filter((_, index) => index !== discardIndex);
      
      const finalPlayer = calculatePlayerScores({
        ...updatedPlayer,
        cards: remainingCards
      });

      setGameState(prev => ({
        ...prev,
        players: prev.players.map((player, index) => 
          index === prev.currentPlayerIndex ? finalPlayer : player
        ),
        discardPile: [...prev.discardPile, cardToDiscard],
        message: `${finalPlayer.name} drew from deck and discarded.`
      }));
      
      setDeckRemaining(drawResponse.remaining);
      
      // Check if final round is complete
      if (gameState.gamePhase === 'finalRound') {
        const newFinalRoundPlayers = new Set(gameState.finalRoundPlayers);
        newFinalRoundPlayers.add(gameState.currentPlayerIndex);
        
        if (newFinalRoundPlayers.size === 3) {
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
      
    } catch (error) {
      console.error("Error with AI draw from deck:", error);
    }
  };

  const handleAIDrawFromDiscard = async (discardIndex: number) => {
    if (gameState.discardPile.length === 0) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    console.log(`${currentPlayer.name} drawing from discard...`);
    
    const cardToTake = gameState.discardPile[gameState.discardPile.length - 1];
    
    const updatedPlayer = calculatePlayerScores({
      ...currentPlayer,
      cards: [...currentPlayer.cards, cardToTake]
    });

    // Check for BLITZ (31) immediately after drawing
    if (checkForBlitz(updatedPlayer)) {
      return;
    }

    // AI immediately discards
    const cardToDiscard = updatedPlayer.cards[discardIndex];
    const remainingCards = updatedPlayer.cards.filter((_, index) => index !== discardIndex);
    
    const finalPlayer = calculatePlayerScores({
      ...updatedPlayer,
      cards: remainingCards
    });

    setGameState(prev => ({
      ...prev,
      players: prev.players.map((player, index) => 
        index === prev.currentPlayerIndex ? finalPlayer : player
      ),
      discardPile: [...prev.discardPile.slice(0, -1), cardToDiscard],
      message: `${finalPlayer.name} drew from discard and discarded.`
    }));
    
    // Check if final round is complete
    if (gameState.gamePhase === 'finalRound') {
      const newFinalRoundPlayers = new Set(gameState.finalRoundPlayers);
      newFinalRoundPlayers.add(gameState.currentPlayerIndex);
      
      if (newFinalRoundPlayers.size === 3) {
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

  const checkForBlitz = (player: Player) => {
    if (hasBlitz(player)) {
      console.log(`${player.name} got BLITZ (31)!`);
      
      // All other players lose 1 coin
      const updatedPlayers = gameState.players.map(p => 
        p.id === player.id ? p : { ...p, coins: Math.max(0, p.coins - 1) }
      );
      
      // Check for eliminations
      const finalPlayers = updatedPlayers.map(p => ({
        ...p,
        isEliminated: p.coins === 0
      }));
      
      const remainingPlayers = finalPlayers.filter(p => !p.isEliminated);
      
      if (remainingPlayers.length === 1) {
        // Game over
        setGameState(prev => ({
          ...prev,
          players: finalPlayers,
          gamePhase: 'gameEnd',
          winner: remainingPlayers[0],
          message: `${player.name} got BLITZ! ${remainingPlayers[0].name} wins the game!`
        }));
      } else {
        // Continue with new round
        toast({
          title: "BLITZ!",
          description: `${player.name} hit 31! All other players lose 1 coin.`
        });
        
        setTimeout(() => {
          startNewRound(finalPlayers);
        }, 2000);
      }
      
      return true;
    }
    return false;
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

      // Check for BLITZ (31) immediately after drawing
      if (checkForBlitz(updatedPlayer)) {
        return; // Game state already updated by checkForBlitz
      }

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

    // Check for BLITZ (31) immediately after drawing
    if (checkForBlitz(updatedPlayer)) {
      return; // Game state already updated by checkForBlitz
    }

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

  const userPlayer = gameState.players.find(p => p.id === 0);
  const topDiscardCard = gameState.discardPile[gameState.discardPile.length - 1] || null;

  if (gameState.gamePhase === 'setup' || !userPlayer) {
    return (
      <div className="max-w-7xl mx-auto text-center">
        <div className="text-white text-lg">Setting up game...</div>
      </div>
    );
  }

  if (gameState.gamePhase === 'gameEnd') {
    return (
      <div className="max-w-7xl mx-auto">
        <GameControls
          gamePhase={gameState.gamePhase}
          isCurrentPlayerTurn={false}
          canKnock={false}
          canDraw={false}
          canDiscard={false}
          hasSelectedCard={false}
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
  }

  return (
    <GameLayout
      players={gameState.players}
      userPlayer={userPlayer}
      currentPlayerIndex={gameState.currentPlayerIndex}
      topDiscardCard={topDiscardCard}
      deckRemaining={deckRemaining}
      selectedCardIndex={selectedCardIndex}
      turnPhase={turnPhase}
      gamePhase={gameState.gamePhase}
      canKnock={turnPhase === 'decision'}
      onCardSelect={setSelectedCardIndex}
      onDrawFromDeck={handleDrawFromDeck}
      onDrawFromDiscard={handleDrawFromDiscard}
      onKnock={handleKnock}
      onDiscard={handleDiscard}
      hasSelectedCard={selectedCardIndex !== null}
      message={gameState.message}
    />
  );
};

export default BlitzGame;
