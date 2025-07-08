# Bill's Blitz - A Card Game Adventure

![Bill's Blitz](https://img.shields.io/badge/Game-Bill's%20Blitz-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.3.1-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4.1-purple?style=for-the-badge&logo=vite)

## 🎮 Live Demo

**🎯 [Play Bill's Blitz Now!](https://blitz-card-chase.lovable.app/)**

## 🎮 What is Bill's Blitz?

**Bill's Blitz** is an interactive web-based card game where you compete against AI opponents (including the charismatic Bill) in a strategic card game. The goal is to build the highest-scoring hand by collecting cards of the same suit, with the ultimate objective of reaching exactly 31 points - a "Blitz!"

### 🎯 Game Objective
- Collect cards of the same suit to score points
- Reach exactly **31 points** for an instant win (Blitz!)
- Knock when you think you have the best hand
- Be the last player standing with coins

## 🃏 How to Play

### Basic Rules
1. **Starting**: Each player begins with 3 cards and 4 coins
2. **Scoring**: Cards are worth their face value (Ace = 11, Face cards = 10, Number cards = their number)
3. **Goal**: Get the highest score in any single suit
4. **Blitz**: Reaching exactly 31 points in one suit wins the round instantly

### Turn Structure
On your turn, you have two main decisions:

1. **Draw a Card**:
   - **From Deck**: Draw a random card from the deck
   - **From Discard**: Take the top card from the discard pile

2. **Discard a Card**: Choose one card from your hand to discard

3. **Knock** (optional): If you think you have the best hand, you can knock to end the round

### Scoring System
- **Hearts ♥️**: Sum of all heart cards
- **Diamonds ♦️**: Sum of all diamond cards  
- **Clubs ♣️**: Sum of all club cards
- **Spades ♠️**: Sum of all spade cards
- **Best Score**: Your highest suit score

### Winning Conditions
- **Blitz**: Reach exactly 31 points in any suit
- **Knock Victory**: Have the highest score when someone knocks
- **Last Standing**: Be the only player with coins remaining

## 🚀 Features

### 🎮 Gameplay Features
- **Real-time AI opponents** with different personalities and strategies
- **Interactive card selection** with visual feedback
- **Dynamic scoring** that updates in real-time
- **Knock mechanics** for strategic end-game play
- **Coin system** for tracking player elimination
- **Round-based gameplay** with automatic progression

### 🎨 Visual Features
- **Beautiful card animations** and transitions
- **Pixel art character** (Bill) with personality
- **Responsive design** that works on desktop and mobile
- **Dark theme** with gradient backgrounds
- **Visual feedback** for current player turns
- **Discard pile history** to track game progression

### 🤖 AI Features
- **Smart AI opponents** with varying risk tolerance
- **Strategic decision making** based on current scores
- **Personality-driven gameplay** - each AI has different playing styles
- **Realistic turn timing** with natural delays

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for beautiful UI components
- **React Router** for navigation
- **React Query** for state management

### Game Logic
- **Custom game engine** built with TypeScript
- **AI decision algorithms** for opponent behavior
- **Real-time scoring calculations**
- **State management** for complex game states

### External APIs
- **Deck of Cards API** for card deck management
- **Random card generation** and shuffling

## 🎯 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd blitz-card-chase
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` to start playing!

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🎮 Game Controls

### Mouse/Touch Controls
- **Click on deck** to draw a card
- **Click on discard pile** to take the top card
- **Click on your cards** to select them for discarding
- **Click "Knock" button** when ready to end the round

### Keyboard Shortcuts
- **Spacebar** - Draw from deck (when it's your turn)
- **Enter** - Confirm card selection

## 🏆 Strategy Tips

### For Beginners
1. **Focus on one suit** - Don't spread your cards across multiple suits
2. **Watch the discard pile** - It might have cards you need
3. **Don't knock too early** - Make sure you have a strong hand
4. **Keep track of your score** - Know when you're close to 31

### Advanced Strategies
1. **Bluff with knocking** - Sometimes knocking with a mediocre hand can win
2. **Deny opponents** - Take cards from discard that opponents might need
3. **Count cards** - Keep track of what's been played
4. **Manage your coins** - Don't get eliminated early

## 🤝 Contributing

This project is open for contributions! Here are some ways you can help:

### 🐛 Bug Reports
- Check existing issues first
- Provide detailed reproduction steps
- Include browser/device information

### 💡 Feature Requests
- Describe the feature clearly
- Explain why it would be beneficial
- Consider implementation complexity

### 🔧 Development
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Deck of Cards API** for providing the card deck service
- **shadcn/ui** for the beautiful component library
- **Tailwind CSS** for the utility-first CSS framework
- **React community** for the amazing ecosystem

## 🎯 Roadmap

### Planned Features
- [ ] Multiplayer support
- [ ] Custom AI personalities
- [ ] Tournament mode
- [ ] Statistics tracking
- [ ] Sound effects and music
- [ ] Mobile app version

### Known Issues
- [ ] Performance optimization for large discard logs
- [ ] Better mobile touch controls
- [ ] Accessibility improvements

---

**Ready to play?** [Start the game now](https://blitz-card-chase.lovable.app/) and challenge Bill and his AI friends to a round of Blitz! 🃏✨
