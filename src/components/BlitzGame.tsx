import { useState, useEffect } from "react";
import { GameState, Player, Card } from "@/types/game";
import { deckApi } from "@/services/deckApi";
import { calculatePlayerScores, createInitialPlayer, hasBlitz } from "@/utils/gameUtils";
import { makeAIDecision } from "@/utils/aiPlayer";
import GameLayout from "./GameLayout";
import GameControls from "./GameControls";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { User as UserIcon } from "lucide-react";
import PlayerEliminationModal from "./PlayerEliminationModal";
import WinnerModal from "./WinnerModal";

const BlitzGame = () => {
  const { toast } = useToast();
  const [userName, setUserName] = useState<string>("");
  const [showNameInput, setShowNameInput] = useState<boolean>(false);

  // Restore game state and related hooks
  const [gameState, setGameState] = useState<GameState>({
    players: [],
    currentPlayerIndex: 0,
    deckId: null,
    discardPile: [],
    gamePhase: 'setup',
    hasKnocked: false,
    knocker: null,
    finalRoundPlayers: new Set(),
    finalRoundTurnsRemaining: 0,
    roundNumber: 1,
    winner: null,
    message: "Starting new game...",
    discardLog: [],
  });
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [deckRemaining, setDeckRemaining] = useState(52);
  const [turnPhase, setTurnPhase] = useState<'decision' | 'draw' | 'discard'>('decision');
  const [pendingDrawCard, setPendingDrawCard] = useState<Card | null>(null);
  const [showEliminationModal, setShowEliminationModal] = useState(false);
  const [eliminatedPlayer, setEliminatedPlayer] = useState<{ name: string; image: string } | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // On mount, check for saved name
  useEffect(() => {
    const savedName = localStorage.getItem("blitzUserName");
    if (savedName && savedName.trim()) {
      setUserName(savedName);
      setShowNameInput(false);
      initializeGameWithName(savedName);
    } else {
      setShowNameInput(true);
    }
  }, []);

  // Helper to start game with a given name
  const initializeGameWithName = (name: string) => {
    initializeGame(name);
  };

  const handleNameSubmit = () => {
    if (userName.trim()) {
      localStorage.setItem("blitzUserName", userName.trim());
      setShowNameInput(false);
      initializeGameWithName(userName.trim());
    }
  };

  const handleNewGame = () => {
    setShowNameInput(true);
  };

  // Remove automatic initialization - now handled by name input

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
    toast({
      title: "Knock!",
      description: `${currentPlayer.name} has knocked. Everyone else gets one more draw to improve their hand.`
    });
    setGameState(prev => ({
      ...prev,
      hasKnocked: true,
      knocker: prev.currentPlayerIndex,
      gamePhase: 'finalRound',
      finalRoundPlayers: new Set(),
        finalRoundTurnsRemaining: 2,
      message: `${currentPlayer.name === userName ? `${userName}, you knocked! Each player gets one final turn.` : `${currentPlayer.name} knocked! Each player gets one final turn.`}`
    }));
    setTimeout(() => {
      moveToNextPlayer();
      setTurnPhase('decision');
    }, 0);
  };

  const handleAIDrawFromDeck = async (discardIndex: number) => {
    if (!gameState.deckId) return;
    
    try {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      console.log(`${currentPlayer.name} drawing from deck...`);
      
      const drawResponse = await deckApi.drawCards(gameState.deckId, 1);
      let updatedPlayer: Player;
      
      // If deck is empty, reshuffle discard pile
      if (!drawResponse.cards || drawResponse.cards.length === 0 || drawResponse.remaining === 0) {
        if (gameState.discardPile.length > 1) {
          toast({
            title: "Reshuffling Deck",
            description: `${currentPlayer.name} triggered deck reshuffle...`
          });
          
          // Keep the top discard card, reshuffle the rest into the deck
          const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
          
          // Create a new deck
          const newDeckResponse = await deckApi.createNewDeck();
          const newDeckId = newDeckResponse.deck_id;
          
          // Draw from new deck (simulating the reshuffled cards)
          const newDrawResponse = await deckApi.drawCards(newDeckId, 1);
          const drawnCard = newDrawResponse.cards[0];
          
          // Update game state - deck is now the new deck, discard pile has only top card
          setGameState(prev => ({
            ...prev,
            deckId: newDeckId,
            discardPile: [topDiscard],
            message: `${currentPlayer.name} caused deck reshuffle! Game continues...`
          }));
          
          setDeckRemaining(newDrawResponse.remaining);
          
          // Continue with AI turn using the drawn card
          updatedPlayer = calculatePlayerScores({
            ...currentPlayer,
            cards: [...currentPlayer.cards, drawnCard]
          });
        } else {
          // If only one card in discard pile, create new deck and continue
          const newDeckResponse = await deckApi.createNewDeck();
          const newDeckId = newDeckResponse.deck_id;
          const newDrawResponse = await deckApi.drawCards(newDeckId, 1);
          
          setGameState(prev => ({
            ...prev,
            deckId: newDeckId,
            message: `${currentPlayer.name} got a fresh deck! Game continues...`
          }));
          
          setDeckRemaining(newDrawResponse.remaining);
          
          // Continue with AI turn using the drawn card
          updatedPlayer = calculatePlayerScores({
            ...currentPlayer,
            cards: [...currentPlayer.cards, newDrawResponse.cards[0]]
          });
        }
      } else {
        // Normal draw - deck has cards
        updatedPlayer = calculatePlayerScores({
          ...currentPlayer,
          cards: [...currentPlayer.cards, drawResponse.cards[0]]
        });
        setDeckRemaining(drawResponse.remaining);
      }

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
        discardLog: [
          { playerName: currentPlayer.name, card: cardToDiscard, turn: prev.roundNumber },
          ...prev.discardLog
        ],
        message: `${finalPlayer.name} drew from deck and discarded.`
      }));
      
      // Note: deckRemaining already set above in each reshuffle branch
      
      // Check if final round is complete
      if (gameState.gamePhase === 'finalRound') {
        const newTurnsRemaining = gameState.finalRoundTurnsRemaining - 1;
        
        if (newTurnsRemaining <= 0) {
          console.log("Final round complete (3 turns taken), calculating scores...");
          calculateRoundResults();
          return;
        } else {
          setGameState(prev => ({
            ...prev,
            finalRoundTurnsRemaining: newTurnsRemaining
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
      discardLog: [
        { playerName: currentPlayer.name, card: cardToDiscard, turn: prev.roundNumber },
        ...prev.discardLog
      ],
      message: `${finalPlayer.name} drew from discard and discarded.`
    }));
    
    // Check if final round is complete
    if (gameState.gamePhase === 'finalRound') {
      const newTurnsRemaining = gameState.finalRoundTurnsRemaining - 1;
      
      if (newTurnsRemaining <= 0) {
        toast({
          title: "Showdown!",
          description: "Let's see your hand."
        });
        console.log("Final round complete (3 turns taken), calculating scores...");
        calculateRoundResults();
        return;
      } else {
        setGameState(prev => ({
          ...prev,
          finalRoundTurnsRemaining: newTurnsRemaining
        }));
      }
    }
    
    // Move to next player
    moveToNextPlayer();
    setTurnPhase('decision');
  };

  const initializeGame = async (nameOverride?: string) => {
    try {
      const nameToUse = nameOverride || userName;
      console.log("Initializing new game...");
      
      // Create players
      const players = [
        createInitialPlayer(0, nameToUse),
        createInitialPlayer(1, "Bill"),
        createInitialPlayer(2, "Peggy")
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
        message: `${updatedPlayers[0].name === userName ? `${userName}, you're up! Draw or knock!` : updatedPlayers[0].name + "'s turn"}`
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
      // All other players lose 1 coin, winner (player) gains 1 coin per loser
      let updatedPlayers = gameState.players.map(p =>
        p.id === player.id ? p : { ...p, coins: Math.max(0, p.coins - 1) }
      );
      const coinsWon = gameState.players.length - 1;
      updatedPlayers = updatedPlayers.map(p =>
        p.id === player.id ? { ...p, coins: p.coins + coinsWon } : p
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
    toast({
      title: "Knock!",
      description: `${gameState.players[gameState.currentPlayerIndex].name} has knocked. Everyone else gets one more draw to improve their hand.`
    });
    setGameState(prev => ({
      ...prev,
      hasKnocked: true,
      knocker: prev.currentPlayerIndex,
      gamePhase: 'finalRound',
      finalRoundPlayers: new Set(),
      finalRoundTurnsRemaining: 2,
      message: `${prev.players[prev.currentPlayerIndex].name === userName ? `${userName}, you knocked! Each player gets one final turn.` : `${prev.players[prev.currentPlayerIndex].name} knocked! Each player gets one final turn.`}`
    }));
    setTimeout(() => {
      moveToNextPlayer();
      setTurnPhase('decision');
    }, 0);
  };

  const handleDrawFromDeck = async () => {
    if (!gameState.deckId) return;
    try {
      console.log("Drawing from deck...");
      const drawResponse = await deckApi.drawCards(gameState.deckId, 1);
      
      // If deck is empty, reshuffle discard pile
      if (!drawResponse.cards || drawResponse.cards.length === 0 || drawResponse.remaining === 0) {
        try {
          if (gameState.discardPile.length > 1) {
            toast({
              title: "Reshuffling Deck",
              description: "Deck is empty. Reshuffling discard pile..."
            });
            
            // Keep the top discard card, reshuffle the rest into the deck
            const topDiscard = gameState.discardPile[gameState.discardPile.length - 1];
            
            // Create a new deck 
            const newDeckResponse = await deckApi.createNewDeck();
            const newDeckId = newDeckResponse.deck_id;
            
            // Draw from new deck
            const newDrawResponse = await deckApi.drawCards(newDeckId, 1);
            
            if (!newDrawResponse.cards || newDrawResponse.cards.length === 0) {
              throw new Error("Failed to draw from new deck");
            }
            
            const drawnCard = newDrawResponse.cards[0];
            
            // Update game state - deck is now the new deck, discard pile has only top card
            setGameState(prev => ({
              ...prev,
              deckId: newDeckId,
              discardPile: [topDiscard],
              message: "Deck reshuffled! Game continues..."
            }));
            
            setDeckRemaining(newDrawResponse.remaining);
            
            // Continue with the drawn card
            const currentPlayer = gameState.players[gameState.currentPlayerIndex];
            setPendingDrawCard(drawnCard);
            setGameState(prev => ({
              ...prev,
              message: `${currentPlayer.name === userName ? `${userName}, you drew a card. Select a card to discard.` : `${currentPlayer.name} drew a card. Select a card to discard.`}`
            }));
            setTurnPhase('discard');
            return;
          } else {
            // If only one card in discard pile, create new deck and continue
            toast({
              title: "Reshuffling Deck", 
              description: "Creating fresh deck to continue game..."
            });
            
            const newDeckResponse = await deckApi.createNewDeck();
            const newDeckId = newDeckResponse.deck_id;
            const newDrawResponse = await deckApi.drawCards(newDeckId, 1);
            
            if (!newDrawResponse.cards || newDrawResponse.cards.length === 0) {
              throw new Error("Failed to draw from fresh deck");
            }
            
            setGameState(prev => ({
              ...prev,
              deckId: newDeckId,
              message: "Fresh deck created! Game continues..."
            }));
            
            setDeckRemaining(newDrawResponse.remaining);
            
            const currentPlayer = gameState.players[gameState.currentPlayerIndex];
            setPendingDrawCard(newDrawResponse.cards[0]);
            setGameState(prev => ({
              ...prev,
              message: `${currentPlayer.name === userName ? `${userName}, you drew a card. Select a card to discard.` : `${currentPlayer.name} drew a card. Select a card to discard.`}`
            }));
            setTurnPhase('discard');
            return;
          }
        } catch (error) {
          console.error("Error during deck reshuffle:", error);
          toast({
            title: "Game Error",
            description: "Unable to reshuffle deck. Please restart the game.",
            variant: "destructive"
          });
          return;
        }
      }
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      
      // Use pending card system like the reshuffle logic
      setPendingDrawCard(drawResponse.cards[0]);
      setGameState(prev => ({
        ...prev,
        message: `${currentPlayer.name === userName ? `${userName}, you drew a card. Select a card to discard.` : `${currentPlayer.name} drew a card. Select a card to discard.`}`
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
    
    // Use pending card system for consistency
    setPendingDrawCard(cardToTake);
    setGameState(prev => ({
      ...prev,
      discardPile: prev.discardPile.slice(0, -1),
      message: `${currentPlayer.name === userName ? `${userName}, you drew from discard. Select a card to discard.` : `${currentPlayer.name} drew from discard. Select a card to discard.`}`
    }));
    
    setTurnPhase('discard');
  };

  const handleDiscard = () => {
    if (pendingDrawCard !== null) {
      // User must select either a hand card (0,1,2) or the pending card (-1)
      if (selectedCardIndex === null) return;
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      let cardToDiscard;
      let newHand;
      if (selectedCardIndex === -1) {
        // Discard the pending card, hand remains unchanged
        cardToDiscard = pendingDrawCard;
        newHand = [...currentPlayer.cards];
      } else {
        // Discard from hand, add pending card to hand
        cardToDiscard = currentPlayer.cards[selectedCardIndex];
        newHand = [...currentPlayer.cards];
        newHand[selectedCardIndex] = pendingDrawCard;
      }
      const updatedPlayer = calculatePlayerScores({
        ...currentPlayer,
        cards: newHand
      });
      setGameState(prev => ({
        ...prev,
        players: prev.players.map((player, index) => 
          index === prev.currentPlayerIndex ? updatedPlayer : player
        ),
        discardPile: [...prev.discardPile, cardToDiscard],
        discardLog: [
          { playerName: currentPlayer.name, card: cardToDiscard, turn: prev.roundNumber },
          ...prev.discardLog
        ]
      }));
      setPendingDrawCard(null);
      setSelectedCardIndex(null);
      
      // Check if final round is complete
      if (gameState.gamePhase === 'finalRound') {
        const newTurnsRemaining = gameState.finalRoundTurnsRemaining - 1;
        
        if (newTurnsRemaining <= 0) {
          toast({
            title: "Showdown!",
            description: "Let's see your hand."
          });
          console.log("Final round complete (3 turns taken), calculating scores...");
          calculateRoundResults();
          return;
        } else {
          setGameState(prev => ({
            ...prev,
            finalRoundTurnsRemaining: newTurnsRemaining
          }));
        }
      }
      
      // Move to next player
      moveToNextPlayer();
      setTurnPhase('decision');
      return;
    }
    // If no pendingDrawCard, fallback to old logic (should not happen in normal play)
    if (selectedCardIndex === null) return;
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
      discardPile: [...prev.discardPile, cardToDiscard],
      discardLog: [
        { playerName: currentPlayer.name, card: cardToDiscard, turn: prev.roundNumber },
        ...prev.discardLog
      ]
    }));
    setSelectedCardIndex(null);
    
    // Check if final round is complete
    if (gameState.gamePhase === 'finalRound') {
      const newTurnsRemaining = gameState.finalRoundTurnsRemaining - 1;
      
      if (newTurnsRemaining <= 0) {
        toast({
          title: "Showdown!",
          description: "Let's see your hand."
        });
        console.log("Final round complete (3 turns taken), calculating scores...");
        calculateRoundResults();
        return;
      } else {
        setGameState(prev => ({
          ...prev,
          finalRoundTurnsRemaining: newTurnsRemaining
        }));
      }
    }
    
    // Move to next player
    moveToNextPlayer();
    setTurnPhase('decision');
  };

  const processPlayerElimination = (gameState: GameState): GameState => {
    const updatedPlayers = gameState.players.map(player => {
      if (player.coins <= 0 && !player.isEliminated) {
        // Show elimination modal for AI players
        if (player.name !== userName) {
          const playerImage = player.name === "Bill" ? "/Bill_images/Bill_pixel.png" : "/Bill_images/Peggy.png";
          setEliminatedPlayer({ name: player.name, image: playerImage });
          setShowEliminationModal(true);
        } else {
          toast({
            title: "You're Eliminated!",
            description: "You've run out of coins. Better luck next time!",
            variant: "destructive"
          });
        }
      }
      return {
        ...player,
        isEliminated: player.coins <= 0
      };
    });

    const activePlayers = updatedPlayers.filter(p => !p.isEliminated);
    
    if (activePlayers.length === 1) {
      setShowWinnerModal(true);
      return {
        ...gameState,
        players: updatedPlayers,
        gamePhase: 'gameEnd',
        winner: activePlayers[0],
        message: `🎉 ${activePlayers[0].name} wins the game!`
      };
    }

    return {
      ...gameState,
      players: updatedPlayers
    };
  };

  const moveToNextPlayer = () => {
    setGameState(prev => {
      // First check for eliminations
      const updatedState = processPlayerElimination(prev);
      
      if (updatedState.gamePhase === 'gameEnd') {
        return updatedState;
      }

      const activePlayers = updatedState.players.filter(p => !p.isEliminated);
      if (activePlayers.length <= 1) {
        return updatedState;
      }
      
      let nextIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      
      // Skip eliminated players
      let safetyCounter = 0;
      while (updatedState.players[nextIndex].isEliminated && safetyCounter < prev.players.length) {
        nextIndex = (nextIndex + 1) % prev.players.length;
        safetyCounter++;
      }
      
      // If we couldn't find a non-eliminated player, something went wrong
      if (safetyCounter >= prev.players.length) {
        console.error("Could not find next active player");
        return updatedState;
      }
      
      const nextPlayer = updatedState.players[nextIndex];
      let phaseMessage = "";
      
      if (prev.gamePhase === 'finalRound') {
        phaseMessage = `${nextPlayer.name}'s final turn`;
      } else {
        phaseMessage = nextIndex === 0 ? 
          `You're up! Draw or knock!` : 
          `${nextPlayer.name}'s turn`;
      }
      
      return {
        ...updatedState,
        currentPlayerIndex: nextIndex,
        message: phaseMessage
      };
    });
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
    if (knockerScore > lowestOtherScore) {
      // Knocker wins, lowest scorer loses 1 coin, knocker gains 1 coin
      const lowestScorer = otherPlayers.find(p => p.bestScore === lowestOtherScore)!;
      updatedPlayers[lowestScorer.id] = {
        ...lowestScorer,
        coins: Math.max(0, lowestScorer.coins - 1)
      };
      updatedPlayers[knocker.id] = {
        ...knocker,
        coins: knocker.coins + 1
      };
      resultMessage = `${knocker.name} won! ${lowestScorer.name} loses 1 coin (transferred to ${knocker.name}).`;
    } else {
      // Knocker loses 2 coins for unsuccessful knock, lowest scorer gains 2 coins
      updatedPlayers[knocker.id] = {
        ...knocker,
        coins: Math.max(0, knocker.coins - 2)
      };
      // Optionally, give 2 coins to the player with the highest score (excluding knocker)
      const highestScorer = otherPlayers.reduce((prev, curr) => (curr.bestScore > prev.bestScore ? curr : prev), otherPlayers[0]);
      updatedPlayers[highestScorer.id] = {
        ...highestScorer,
        coins: highestScorer.coins + 2
      };
      resultMessage = `${knocker.name}'s knock failed! Loses 2 coins (transferred to ${highestScorer.name}).`;
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

  if (showNameInput) {
    return (
      <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Dialog open={showNameInput} onOpenChange={setShowNameInput}>
          <DialogContent className="bg-slate-800 border-2 border-yellow-400 p-8">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-yellow-300 text-center mb-6">
                Welcome to Blitz with Bill & Peggy!
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="text-center text-white text-lg mb-4">
                Enter your name to begin your card game adventure
              </div>
              <Input
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleNameSubmit();
                  }
                }}
                className="text-lg p-4 bg-slate-700 border-yellow-400 text-white placeholder:text-slate-400"
                autoFocus
              />
              <Button 
                onClick={handleNameSubmit}
                disabled={!userName.trim()}
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-lg py-4"
              >
                Start Game
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Change Name button (top right corner)
  // Only show if a name is set and not in the name input dialog
  const showChangeNameBtn = !!userName && !showNameInput;

  if (gameState.gamePhase === 'setup' || !userPlayer) {
    return (
      <div className="max-w-7xl mx-auto text-center relative">
        {showChangeNameBtn && (
          <button
            className="absolute top-4 left-4 bg-slate-800/80 hover:bg-yellow-400 hover:text-black text-yellow-300 rounded-full p-4 shadow-lg border-2 border-yellow-400 transition-colors flex items-center justify-center"
            onClick={() => setShowNameInput(true)}
            aria-label="Change Name"
          >
            <UserIcon className="w-8 h-8" />
          </button>
        )}
        <div className="mt-20 text-white text-lg">Setting up game...</div>
      </div>
    );
  }

  if (gameState.gamePhase === 'gameEnd') {
    return (
      <div className="max-w-7xl mx-auto relative">
        {showChangeNameBtn && (
          <button
            className="absolute top-4 left-4 bg-slate-800/80 hover:bg-yellow-400 hover:text-black text-yellow-300 rounded-full p-4 shadow-lg border-2 border-yellow-400 transition-colors flex items-center justify-center"
            onClick={() => setShowNameInput(true)}
            aria-label="Change Name"
          >
            <UserIcon className="w-8 h-8" />
          </button>
        )}
        <div>
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
            onNewGame={handleNewGame}
            message={gameState.message}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div>
        <GameLayout
          players={gameState.players}
          userPlayer={userPlayer}
          currentPlayerIndex={gameState.currentPlayerIndex}
          topDiscardCard={topDiscardCard}
          deckRemaining={deckRemaining}
          selectedCardIndex={selectedCardIndex}
          turnPhase={turnPhase}
          gamePhase={gameState.gamePhase}
          canKnock={turnPhase === 'decision' && !gameState.hasKnocked}
          onCardSelect={setSelectedCardIndex}
          onDrawFromDeck={handleDrawFromDeck}
          onDrawFromDiscard={handleDrawFromDiscard}
          onKnock={handleKnock}
          onDiscard={handleDiscard}
          hasSelectedCard={selectedCardIndex !== null}
          message={gameState.message}
          knocker={gameState.knocker}
          discardLog={gameState.discardLog}
          showChangeNameBtn={showChangeNameBtn}
          onChangeName={() => setShowNameInput(true)}
          pendingDrawCard={pendingDrawCard}
        />
      </div>

      {/* Player Elimination Modal */}
      <PlayerEliminationModal
        isOpen={showEliminationModal}
        onClose={() => setShowEliminationModal(false)}
        playerName={eliminatedPlayer?.name || ""}
        playerImage={eliminatedPlayer?.image || ""}
      />

      {/* Winner Modal */}
      <WinnerModal
        isOpen={showWinnerModal}
        onClose={() => setShowWinnerModal(false)}
        onPlayAgain={() => {
          setShowWinnerModal(false);
          setShowNameInput(true);
        }}
        winnerName={gameState.winner?.name || ""}
      />
    </>
  );
};

export default BlitzGame;
