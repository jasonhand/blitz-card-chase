import { useState, useEffect, useCallback } from "react";
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
import GameOverModal from "./GameOverModal";
import HandRevealModal from "./HandRevealModal";


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
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [showHandReveal, setShowHandReveal] = useState(false);
  const [isCalculatingResults, setIsCalculatingResults] = useState(false);
  const [handRevealPlayers, setHandRevealPlayers] = useState<Player[]>([]);
  const [roundCalculationInProgress, setRoundCalculationInProgress] = useState(false);

  // On mount, check for saved name
  useEffect(() => {
    const savedName = localStorage.getItem("blitzUserName");
    if (savedName && savedName.trim()) {
      setUserName(savedName);
      setShowNameInput(false);
      initializeGameWithName(savedName);
      
      // Track returning user
      window.DD_RUM && window.DD_RUM.addAction('returning_user_login', {
        userName: savedName,
        timestamp: Date.now()
      });
    } else {
      setShowNameInput(true);
      // Track new user
      window.DD_RUM && window.DD_RUM.addAction('new_user_prompt', {
        timestamp: Date.now()
      });
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
      
      // Track user name submission
      window.DD_RUM && window.DD_RUM.addAction('user_name_submitted', {
        userName: userName.trim(),
        timestamp: Date.now()
      });
    }
  };

  const handleNewGame = () => {
    setShowNameInput(true);
    // Track new game request
    window.DD_RUM && window.DD_RUM.addAction('new_game_requested', {
      userName: userName,
      timestamp: Date.now()
    });
  };

  // Remove automatic initialization - now handled by name input

  // Handle AI turns
  useEffect(() => {
    // Check if user is eliminated first
    const userPlayer = gameState.players.find(p => p.name === userName);
    if (userPlayer?.isEliminated || gameState.gamePhase === 'gameEnd' || gameState.gamePhase === 'setup') {
      return;
    }
    
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
  }, [gameState.currentPlayerIndex, turnPhase, gameState.gamePhase, userName, gameState.players]);

  const executeAITurn = async () => {
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Safety check: Don't execute turns for eliminated players
    if (currentPlayer.isEliminated) {
      console.log(`Skipping turn for eliminated player ${currentPlayer.name}`);
      moveToNextPlayer();
      setTurnPhase('decision');
      return;
    }
    
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
    
    // Track AI knock
    window.DD_RUM && window.DD_RUM.addAction('ai_player_knock', {
      playerName: currentPlayer.name,
      playerScore: currentPlayer.bestScore,
      roundNumber: gameState.roundNumber,
      timestamp: Date.now()
    });
    
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
      // Calculate turns needed based on active players, minus the knocker
      finalRoundTurnsRemaining: prev.players.filter(p => !p.isEliminated).length - 1,
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

      // AI immediately discards
      const cardToDiscard = updatedPlayer.cards[discardIndex];
      const remainingCards = updatedPlayer.cards.filter((_, index) => index !== discardIndex);
      
      const finalPlayer = calculatePlayerScores({
        ...updatedPlayer,
        cards: remainingCards
      });

      // Check for BLITZ (31) after final hand (3 cards)
      if (checkForBlitz(finalPlayer)) {
        return;
      }

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
      
      // Check if final round is complete after AI turn
      if (gameState.gamePhase === 'finalRound') {
        const activePlayers = gameState.players.filter(p => !p.isEliminated);
        const newTurnsRemaining = gameState.finalRoundTurnsRemaining - 1;
        
        if (newTurnsRemaining <= 0) {
          console.log("Final round complete (all players got final turn), calculating scores...");
          if (!roundCalculationInProgress) {
            calculateRoundResults();
          }
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

    // AI immediately discards
    const cardToDiscard = updatedPlayer.cards[discardIndex];
    const remainingCards = updatedPlayer.cards.filter((_, index) => index !== discardIndex);
    
    const finalPlayer = calculatePlayerScores({
      ...updatedPlayer,
      cards: remainingCards
    });

    // Check for BLITZ (31) after final hand (3 cards)
    if (checkForBlitz(finalPlayer)) {
      return;
    }

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
    
    // Check if final round is complete after AI turn
    if (gameState.gamePhase === 'finalRound') {
      const activePlayers = gameState.players.filter(p => !p.isEliminated);
      const newTurnsRemaining = gameState.finalRoundTurnsRemaining - 1;
      
      if (newTurnsRemaining <= 0) {
        // Only show toast if hand reveal modal is not displayed
        if (!showHandReveal) {
          toast({
            title: "Showdown!",
            description: "Let's see your hand."
          });
        }
        console.log("Final round complete (all players got final turn), calculating scores...");
        if (!roundCalculationInProgress) {
          calculateRoundResults();
        }
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
      
      // Track game initialization
      window.DD_RUM && window.DD_RUM.addAction('game_initialization_started', {
        userName: nameToUse,
        timestamp: Date.now()
      });

      // Create players
      const players = [
        createInitialPlayer(0, nameToUse),
        createInitialPlayer(1, "Bill"),
        createInitialPlayer(2, "Peggy"),
        createInitialPlayer(3, "Mom-Mom")
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
      
      // Track successful game initialization
      window.DD_RUM && window.DD_RUM.addAction('game_initialization_completed', {
        userName: nameToUse,
        deckId: deckResponse.deck_id,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error("Error initializing game:", error);
      
      // Track initialization error
      window.DD_RUM && window.DD_RUM.addError(error as Error, {
        context: 'game_initialization',
        userName: nameOverride || userName,
        timestamp: Date.now()
      });
      
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
      
      // Check if we have enough cards remaining
      if (deckRemaining < 12) {
        console.log("Not enough cards remaining, creating fresh deck...");
        const newDeckResponse = await deckApi.createNewDeck();
        const newDeckId = newDeckResponse.deck_id;
        
        // Update state with new deck
        setGameState(prev => ({
          ...prev,
          deckId: newDeckId
        }));
        setDeckRemaining(52);
        
        // Use the new deck ID for drawing
        const drawResponse = await deckApi.drawCards(newDeckId, 12);
        console.log("Drew cards from fresh deck:", drawResponse.cards.length);
        
        if (drawResponse.cards.length !== 12) {
          throw new Error(`Expected 12 cards, got ${drawResponse.cards.length}`);
        }
        
        return await processCardDeal(drawResponse, players);
      }
      
      // Draw 12 cards (3 per player) - ensure exactly 3 cards per player
      const drawResponse = await deckApi.drawCards(deckId, 12);
      console.log("Drew cards:", drawResponse.cards.length);
      
      // Ensure we have exactly 12 cards
      if (drawResponse.cards.length !== 12) {
        // If we don't have enough cards from current deck, create fresh deck
        console.log("Not enough cards remaining, creating fresh deck...");
        const newDeckResponse = await deckApi.createNewDeck();
        const newDeckId = newDeckResponse.deck_id;
        
        setGameState(prev => ({
          ...prev,
          deckId: newDeckId
        }));
        setDeckRemaining(52);
        
        const freshDrawResponse = await deckApi.drawCards(newDeckId, 12);
        console.log("Drew cards from fresh deck:", freshDrawResponse.cards.length);
        
        if (freshDrawResponse.cards.length !== 12) {
          throw new Error(`Expected 12 cards, got ${freshDrawResponse.cards.length}`);
        }
        
        return await processCardDeal(freshDrawResponse, players);
      }
      
      return await processCardDeal(drawResponse, players);
      
    } catch (error) {
      console.error("Error dealing cards:", error);
      toast({
        title: "Error",
        description: "Failed to deal cards. Please try again.",
        variant: "destructive"
      });
    }
  };

  const processCardDeal = async (drawResponse: any, players: Player[]) => {
    const updatedPlayers = players.map((player, index) => {
      const playerCards = drawResponse.cards.slice(index * 3, (index + 1) * 3);
      // Verify each player gets exactly 3 cards
      if (playerCards.length !== 3) {
        throw new Error(`Player ${index} got ${playerCards.length} cards, expected 3`);
      }
      return calculatePlayerScores({ ...player, cards: playerCards });
    });

    // Verify all players have exactly 3 cards
    updatedPlayers.forEach((player, index) => {
      if (player.cards.length !== 3) {
        console.error(`Player ${index} (${player.name}) has ${player.cards.length} cards, should have 3`);
      }
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
  };

  const checkForBlitz = (player: Player) => {
    if (hasBlitz(player)) {
      console.log(`${player.name} got BLITZ (31)!`);
      
      // Track BLITZ achievement
      window.DD_RUM && window.DD_RUM.addAction('player_achieved_blitz', {
        playerName: player.name,
        isUser: player.name === userName,
        roundNumber: gameState.roundNumber,
        timestamp: Date.now()
      });
      
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
        // Only show toast if hand reveal modal is not displayed
        if (!showHandReveal) {
          toast({
            title: "BLITZ!",
            description: `${player.name} hit 31! All other players lose 1 coin.`
          });
        }
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
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Track user knock
    window.DD_RUM && window.DD_RUM.addAction('user_knock', {
      playerScore: currentPlayer.bestScore,
      roundNumber: gameState.roundNumber,
      timestamp: Date.now()
    });
    
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
      // Calculate turns needed based on active players, minus the knocker
      finalRoundTurnsRemaining: prev.players.filter(p => !p.isEliminated).length - 1,
      message: `${prev.players[prev.currentPlayerIndex].name === userName ? `${userName}, you knocked! Each player gets one final turn.` : `${prev.players[prev.currentPlayerIndex].name} knocked! Each player gets one final turn.`}`
    }));
    setTimeout(() => {
      moveToNextPlayer();
      setTurnPhase('decision');
    }, 0);
  };

  const handleDrawFromDeck = async () => {
    if (!gameState.deckId) return;
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Prevent drawing if player doesn't have exactly 3 cards
    if (currentPlayer.cards.length !== 3) {
      console.error(`Player ${currentPlayer.name} has ${currentPlayer.cards.length} cards, cannot draw. Should have exactly 3.`);
      toast({
        title: "Invalid Hand Size",
        description: "Cannot draw card - invalid hand size. Please refresh the game.",
        variant: "destructive"
      });
      return;
    }
    
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
    
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    
    // Prevent drawing if player doesn't have exactly 3 cards
    if (currentPlayer.cards.length !== 3) {
      console.error(`Player ${currentPlayer.name} has ${currentPlayer.cards.length} cards, cannot draw. Should have exactly 3.`);
      toast({
        title: "Invalid Hand Size",
        description: "Cannot draw card - invalid hand size. Please refresh the game.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Drawing from discard pile...");
    const cardToTake = gameState.discardPile[gameState.discardPile.length - 1];
    
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
      console.log(`User hand size before discard: ${currentPlayer.cards.length}`);
      
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
      
      // Verify hand size is always 3
      if (newHand.length !== 3) {
        console.error(`Hand size error: newHand has ${newHand.length} cards, should be 3`);
        console.log(`Current hand:`, currentPlayer.cards);
        console.log(`Pending draw card:`, pendingDrawCard);
        console.log(`Selected index:`, selectedCardIndex);
        return;
      }
      
      console.log(`User hand size after discard: ${newHand.length}`);
      
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
      
      // Track user discard
      window.DD_RUM && window.DD_RUM.addAction('user_discard', {
        selectedIndex: selectedCardIndex,
        roundNumber: gameState.roundNumber,
        timestamp: Date.now()
      });
      
      // Check if final round is complete after user turn
      if (gameState.gamePhase === 'finalRound') {
        const activePlayers = gameState.players.filter(p => !p.isEliminated);
        const newTurnsRemaining = gameState.finalRoundTurnsRemaining - 1;
        
        if (newTurnsRemaining <= 0) {
          // Only show toast if hand reveal modal is not displayed
          if (!showHandReveal) {
            toast({
              title: "Showdown!",
              description: "Let's see your hand."
            });
          }
        console.log("Final round complete (all players got final turn), calculating scores...");
        if (!roundCalculationInProgress) {
          calculateRoundResults();
        }
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
    
    // CRITICAL FIX: Remove the old fallback logic that reduces hand size
    // This should never happen in normal play, but if it does, just log an error
    console.error("handleDiscard called without pendingDrawCard - this should not happen!");
    toast({
      title: "Error",
      description: "Invalid discard state. Please try drawing a card first.",
      variant: "destructive"
    });
  };

  const processPlayerElimination = (gameState: GameState): GameState => {
    const updatedPlayers = gameState.players.map(player => {
      if (player.coins === 0 && !player.isEliminated) {  // Only exactly 0 coins
        console.log(`processPlayerElimination: ${player.name} (ID: ${player.id}) eliminated with 0 coins`);
        // Note: We don't show elimination modal here anymore - only in calculateRoundResults
        // to avoid duplicate modals
      }
      return {
        ...player,
        isEliminated: player.coins === 0  // Only eliminate at exactly 0 coins
      };
    });

    const activePlayers = updatedPlayers.filter(p => !p.isEliminated);
    
    // Check if user is eliminated - but DON'T end game here!
    // Only calculateRoundResults should end the game for the user
    const userPlayer = updatedPlayers.find(p => p.name === userName);
    // Removed premature game ending logic here
    
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
        // Game should end - set winner and game phase
        if (activePlayers.length === 1) {
          return {
            ...updatedState,
            gamePhase: 'gameEnd',
            winner: activePlayers[0],
            message: `${activePlayers[0].name} wins the game!`
          };
        }
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
        phaseMessage = nextIndex === 0 ? `You're up` : `${nextPlayer.name}'s up`;
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

  const calculateRoundResults = useCallback(() => {
    // Use dedicated state to prevent multiple calls - this is CRITICAL
    if (roundCalculationInProgress) {
      console.log("Round calculation already in progress, skipping duplicate call...");
      return;
    }
    
    // Set flag immediately to block any other calls
    setRoundCalculationInProgress(true);
    console.log("STARTING round calculation - blocking future calls");
    
    console.log("=== CALCULATING ROUND RESULTS ===");
    
    console.log("Players before calculation:", gameState.players.map(p => `${p.name} (ID:${p.id}): ${p.coins} coins`));
    
    const knocker = gameState.players[gameState.knocker!];
    
    // Track round results calculation
    window.DD_RUM && window.DD_RUM.addAction('round_results_calculation', {
      knockerName: knocker.name,
      knockerScore: knocker.bestScore,
      roundNumber: gameState.roundNumber,
      timestamp: Date.now()
    });
    console.log(`Knocker: ${knocker.name} (ID:${knocker.id}) with score ${knocker.bestScore}`);
    const otherPlayers = gameState.players.filter((_, index) => index !== gameState.knocker);
    console.log(`Other players: ${otherPlayers.map(p => `${p.name}(ID:${p.id},${p.bestScore})`).join(', ')}`);
    const knockerScore = knocker.bestScore;
    const otherScores = otherPlayers.map(p => p.bestScore);
    const lowestOtherScore = Math.min(...otherScores);
    console.log(`Knocker score: ${knockerScore}, lowest other score: ${lowestOtherScore}`);
    
    // Create a COMPLETELY NEW player array to avoid any reference issues
    let updatedPlayers = gameState.players.map(player => ({ ...player }));
    console.log("Deep copied players:", updatedPlayers.map(p => `${p.name} (ID:${p.id}): ${p.coins} coins`));
    let resultMessage = "";
    
    // Find players by ID to avoid index confusion - CRITICAL SAFETY CHECK
    const knockerIndex = updatedPlayers.findIndex(p => p.id === knocker.id);
    const lowestScorer = otherPlayers.find(p => p.bestScore === lowestOtherScore)!;
    const lowestScorerIndex = updatedPlayers.findIndex(p => p.id === lowestScorer.id);
    
    console.log(`CRITICAL CHECK - Knocker: ${knocker.name} (ID:${knocker.id}) at index: ${knockerIndex}`);
    console.log(`CRITICAL CHECK - Lowest scorer: ${lowestScorer.name} (ID:${lowestScorer.id}) at index: ${lowestScorerIndex}`);
    
    // SAFETY VALIDATION
    if (knockerIndex === -1 || lowestScorerIndex === -1) {
      console.error("CRITICAL ERROR: Could not find player indices!");
      console.error(`Knocker index: ${knockerIndex}, Lowest scorer index: ${lowestScorerIndex}`);
      setRoundCalculationInProgress(false);
      return;
    }
    
    if (knockerScore > lowestOtherScore) {
      // Knocker wins - SIMPLE direct coin transfer
      console.log(`Knocker ${knocker.name} wins! Transferring 1 coin from ${lowestScorer.name}`);
      console.log(`BEFORE: Knocker ${updatedPlayers[knockerIndex].name} has ${updatedPlayers[knockerIndex].coins}, Loser ${updatedPlayers[lowestScorerIndex].name} has ${updatedPlayers[lowestScorerIndex].coins}`);
      
      // Make coin changes with direct assignment to prevent any reference issues
      updatedPlayers[knockerIndex].coins += 1;
      updatedPlayers[lowestScorerIndex].coins = Math.max(0, updatedPlayers[lowestScorerIndex].coins - 1);
      
      console.log(`AFTER: Knocker ${updatedPlayers[knockerIndex].name} has ${updatedPlayers[knockerIndex].coins}, Loser ${updatedPlayers[lowestScorerIndex].name} has ${updatedPlayers[lowestScorerIndex].coins}`);
      
      resultMessage = `${knocker.name} won! ${lowestScorer.name} loses 1 coin (transferred to ${knocker.name}).`;
    } else {
      // Knocker loses - SIMPLE direct coin transfer  
      const highestScorer = otherPlayers.reduce((prev, curr) => (curr.bestScore > prev.bestScore ? curr : prev), otherPlayers[0]);
      const highestScorerIndex = updatedPlayers.findIndex(p => p.id === highestScorer.id);
      console.log(`Knocker ${knocker.name} fails! Transferring 2 coins to ${highestScorer.name} (ID:${highestScorer.id})`);
      console.log(`BEFORE: Knocker ${updatedPlayers[knockerIndex].name} has ${updatedPlayers[knockerIndex].coins}, Winner ${updatedPlayers[highestScorerIndex].name} has ${updatedPlayers[highestScorerIndex].coins}`);
      
      // SAFETY VALIDATION
      if (highestScorerIndex === -1) {
        console.error("CRITICAL ERROR: Could not find highest scorer index!");
        setRoundCalculationInProgress(false);
        return;
      }
      
      // Make coin changes with direct assignment
      updatedPlayers[knockerIndex].coins = Math.max(0, updatedPlayers[knockerIndex].coins - 2);
      updatedPlayers[highestScorerIndex].coins += 2;
      
      console.log(`AFTER: Knocker ${updatedPlayers[knockerIndex].name} has ${updatedPlayers[knockerIndex].coins}, Winner ${updatedPlayers[highestScorerIndex].name} has ${updatedPlayers[highestScorerIndex].coins}`);
      
      resultMessage = `${knocker.name}'s knock failed! Loses 2 coins (transferred to ${highestScorer.name}).`;
    }
    
    console.log("FINAL COIN SUMMARY:", updatedPlayers.map(p => `${p.name} (ID:${p.id}): ${p.coins} coins`));
    
    // FIXED: Only set isEliminated flag when coins reach exactly 0 - DON'T eliminate just for losing
    const playersWithEliminations = updatedPlayers.map(player => ({
      ...player,
      isEliminated: player.coins === 0  // Only eliminate at exactly 0 coins
    }));
    
    // Show elimination modal for AI players who just got eliminated (went from >0 to 0 coins)
    playersWithEliminations.forEach(player => {
      const originalPlayer = gameState.players.find(p => p.id === player.id);
      // Only show modal if player just got eliminated (was not eliminated before and now has 0 coins)
      if (player.coins === 0 && !originalPlayer?.isEliminated && player.name !== userName) {
        console.log(`Player ${player.name} (ID: ${player.id}) eliminated - showing modal`);
        let playerImage = "/Bill_images/Bill_pixel.png"; // default
        if (player.name === "Bill") playerImage = "/Bill_images/Bill_pixel.png";
        else if (player.name === "Peggy") playerImage = "/Bill_images/Peggy.png";
        else if (player.name === "Mom-Mom") playerImage = "/lovable-uploads/60a0284f-f13d-48bf-aa43-b3d1eed03a2b.png";
        
        // Clear any existing elimination modal first
        setEliminatedPlayer(null);
        setShowEliminationModal(false);
        
        // Set new elimination with delay to ensure clean state
        setTimeout(() => {
          setEliminatedPlayer({ name: player.name, image: playerImage });
          setShowEliminationModal(true);
          console.log(`Elimination modal set for ${player.name}`);
        }, 100);
      }
    });
    
    // Use the updated players with elimination flags
    updatedPlayers = playersWithEliminations;
    
    // ONLY check if user is eliminated when coins reach exactly 0
    const userPlayer = updatedPlayers.find(p => p.name === userName);
    console.log(`User ${userName} coins after round: ${userPlayer?.coins}`);
    console.log(`User isEliminated status: ${userPlayer?.isEliminated}`);
    
    if (userPlayer && userPlayer.coins === 0 && !gameState.players.find(p => p.name === userName)?.isEliminated) {
      console.log(`User ${userName} eliminated with 0 coins - showing game over modal`);
      
      // Track user elimination/game over
      window.DD_RUM && window.DD_RUM.addAction('user_game_over', {
        finalCoins: userPlayer.coins,
        roundNumber: gameState.roundNumber,
        timestamp: Date.now()
      });
      
      setGameState(prev => ({
        ...prev,
        players: updatedPlayers,
        gamePhase: 'gameEnd',
        message: `Game Over! You ran out of coins.`
      }));
      setShowGameOverModal(true);
      setRoundCalculationInProgress(false); // Reset flag
      return;
    } else if (userPlayer) {
      console.log(`User ${userName} NOT eliminated - has ${userPlayer.coins} coins`);
    }
    
    const remainingPlayers = updatedPlayers.filter(p => !p.isEliminated);
    if (remainingPlayers.length === 1) {
      // Game over - only one player left
      const winner = remainingPlayers[0];
      console.log(`Game over! Winner: ${winner.name} (user: ${userName})`);
      
      setGameState(prev => ({
        ...prev,
        players: updatedPlayers,
        gamePhase: 'gameEnd',
        winner: winner,
        message: `${winner.name} wins the game!`
      }));
      
      // Show appropriate modal based on who won
      if (winner.name === userName) {
        console.log("User won - showing winner modal");
        setShowWinnerModal(true);
      } else {
        console.log("AI won - showing game over modal");
        setShowGameOverModal(true);
      }
      
      setRoundCalculationInProgress(false); // Reset flag
    } else {
      // Continue game - show hand reveal before starting new round
      setGameState(prev => ({
        ...prev,
        players: updatedPlayers
      }));
      // Only show toast if hand reveal modal is not displayed
      if (!showHandReveal) {
        toast({
          title: "Round Complete",
          description: resultMessage
        });
      }
      // Store deep copy snapshot of players for hand reveal to prevent changes
      setHandRevealPlayers(updatedPlayers.map(player => ({
        ...player,
        cards: player.cards.map(card => ({ ...card })), // Deep copy cards too
        scores: { ...player.scores }
      })));
      setTimeout(() => {
        setShowHandReveal(true);
        setRoundCalculationInProgress(false); // Reset flag here too
      }, 1500);
    }
  }, [roundCalculationInProgress, gameState.knocker, gameState.players, userName]);

  const handleHandRevealContinue = useCallback(() => {
    if (!showHandReveal) return; // Prevent multiple calls
    setShowHandReveal(false);
    const currentPlayers = gameState.players;
    setTimeout(() => {
      startNewRound(currentPlayers);
    }, 200);
  }, [showHandReveal, gameState.players]);

  const startNewRound = async (players: Player[]) => {
    try {
      console.log("Starting new round...");
      
      // Filter out eliminated players completely for new round
      const activePlayers = players.filter(p => !p.isEliminated);
      console.log(`Active players for new round: ${activePlayers.map(p => p.name).join(', ')}`);
      
      // Reset game state for new round - only keep active players
      const resetPlayers = activePlayers.map(player => ({
        ...player,
        cards: [],
        scores: { hearts: 0, diamonds: 0, clubs: 0, spades: 0 },
        bestScore: 0,
        bestSuit: 'hearts'
        // Keep coins and isEliminated from the passed players array
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
      
      // Only deal new cards to active (non-eliminated) players that were already filtered
      if (gameState.deckId && activePlayers.length > 0) {
        await dealInitialCards(gameState.deckId, activePlayers);
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
                Welcome to Blitz with Bill, Peggy & Mom-Mom!
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

  // Game end phase - show appropriate modal
  if (gameState.gamePhase === 'gameEnd') {
    return (
      <>
        {/* Show GameOverModal when user is eliminated or loses */}
        <GameOverModal
          isOpen={showGameOverModal}
          onClose={() => setShowGameOverModal(false)}
          onPlayAgain={() => {
            setShowGameOverModal(false);
            setShowNameInput(true);
          }}
        />
        
        {/* Show WinnerModal when user wins */}
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

      {showHandReveal && (
        <HandRevealModal
          players={handRevealPlayers}
          userName={userName}
          onContinue={handleHandRevealContinue}
        />
      )}

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
      
      <GameOverModal
        isOpen={showGameOverModal}
        onClose={() => setShowGameOverModal(false)}
        onPlayAgain={() => {
          setShowGameOverModal(false);
          setShowNameInput(true);
        }}
      />
    </>
  );
};

export default BlitzGame;
