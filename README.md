# CS Board Games 🎲

**A modular, extensible platform for 2-player and multiplayer board games based on Computer Science puzzles.**

Built with React Native + Expo. Clean architecture makes adding new games as simple as creating one folder and editing one file.

---

## Screenshots & Features

| Home Screen | Bipartite Coloring | Stone Propagation |
|-------------|-------------------|-------------------|
| Game cards + mode tabs | Interactive SVG graph | Chain reaction stones |

### Core Features
- 🎮 Two-player and multiplayer modes
- 🔌 Plugin-based game registry (add games without touching core code)
- 📊 Global score footer visible on every screen
- ☕ One-time donation popup (AsyncStorage persisted)
- 📱 Responsive for mobile and tablet
- 🎨 Custom color theme with Pacifico font
- ✨ Smooth animations on nodes, turns, explosions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React Native + Expo ~50 |
| Language | TypeScript |
| Navigation | React Navigation v6 (Native Stack) |
| State | Zustand v4 |
| Persistence | AsyncStorage |
| Graphics | react-native-svg |
| Fonts | Expo Google Fonts (Pacifico) |
| Build | EAS Build |

---

## Project Structure

```
cs-board-games/
├── App.tsx                        # Root: navigation + global footer
├── app.json                       # Expo config (name, package, icons)
├── eas.json                       # EAS Build profiles
├── package.json
├── tsconfig.json
│
├── assets/                        # Icons, splash screen images
│
└── src/
    ├── core/
    │   ├── theme/
    │   │   └── index.ts           # ✅ ALL colors, fonts, spacing here
    │   ├── store/
    │   │   └── index.ts           # Zustand global state (scores, mode, donation)
    │   ├── components/
    │   │   ├── GameCard.tsx        # Reusable game card with Coming Soon support
    │   │   ├── GlobalFooter.tsx    # Fixed bottom score bar
    │   │   └── DonationPopup.tsx   # First-launch donation modal
    │   └── navigation/
    │       ├── HomeScreen.tsx      # Main screen: tabs + game grid
    │       └── GameScreen.tsx      # Shell that loads any game by ID
    │
    └── games/
        ├── registry.ts             # ✅ PLUGIN SYSTEM — register games here
        ├── bipartite/
        │   ├── bipartiteLogic.ts   # Pure game logic (no React)
        │   └── BipartiteGame.tsx   # React component + SVG graph
        └── stonePropagation/
            ├── stoneLogic.ts       # Pure chain-reaction logic
            └── StonePropagationGame.tsx
```

**Key principle:** `src/core/` never imports from `src/games/`. Games depend on core, never the reverse.

---

## How to Run Locally

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your Android/iOS device (for testing)

### Steps

```bash
# 1. Clone the repo
git clone https://github.com/yourname/cs-board-games.git
cd cs-board-games

# 2. Install dependencies
npm install

# 3. Install font package
npx expo install @expo-google-fonts/pacifico

# 4. Start development server
npx expo start

# 5. Scan QR code with Expo Go app, or press:
#    'a' for Android emulator
#    'i' for iOS simulator
```

---

## How to Add a New Game

Adding a game requires **3 steps** and **zero changes to core files**.

### Step 1: Create the game folder

```
src/games/myNewGame/
├── myNewGameLogic.ts     # Pure TypeScript logic (no React, easy to test)
└── MyNewGame.tsx         # React Native component
```

### Step 2: Implement the GamePlugin interface

Your `MyNewGame.tsx` must accept `GameScreenProps`:

```typescript
import type { GameScreenProps } from '../registry';

export default function MyNewGame({ mode, onGameEnd, onExit }: GameScreenProps) {
  // mode: 'two-player' | 'multiplayer'
  // onGameEnd(winner): call when game finishes
  // onExit(): call when user presses Back

  const handleWin = (winner: 'red' | 'blue') => {
    addScore(winner, 1);   // update global store
    onGameEnd(winner);     // notify container
  };

  return <View>...</View>;
}
```

### Step 3: Register in registry.ts

Open `src/games/registry.ts` and add one entry:

```typescript
import MyNewGame from './myNewGame/MyNewGame';

export const GAME_REGISTRY: GamePlugin[] = [
  // ... existing games ...
  {
    id: 'myNewGame',
    title: 'My New Game',
    description: 'A cool CS puzzle game!',
    tags: ['Algorithms', 'Fun'],
    icon: '🧩',
    difficulty: 2,
    minPlayers: 2,
    implemented: true,        // false = shows "Coming Soon"
    component: MyNewGame,
  },
];
```

**Done!** The home screen automatically shows your new game card. Navigation auto-discovers it by ID.

---

## How Scoring Works

### Two-Player Mode
- Each game calls `useGameStore.getState().addScore('red' | 'blue', points)`
- Scores persist across multiple game rounds in the same session
- Displayed in the GlobalFooter (always visible)
- "Combined" shows total points scored by both players together

### Multiplayer Mode
- `setMultiplayerPlayers([...])` initializes up to 4 players
- `addMultiplayerScore(playerId, points)` adds per-player
- Footer shows all player chips + total

### Resetting
- Scores reset when switching modes (Two-Player ↔ Multiplayer)
- Individual games can reset their internal game state without affecting global scores

---

## Donation System

The donation flow is intentionally simple:

1. **First launch**: App loads `donationPopupSeen` from AsyncStorage
2. If `false` → show popup after 1.2s delay
3. User donates → `hasDonated = true`, `donationPopupSeen = true` stored persistently
4. User dismisses → only `donationPopupSeen = true` (popup won't show again)
5. **Footer button**: Always visible, opens popup on demand

To integrate real payments, replace the `handleDonate` function in `App.tsx` with your payment gateway call (Razorpay, Stripe, etc.).

---

## Deployment to Google Play Store

### Prerequisites
- EAS CLI: `npm install -g eas-cli`
- Expo account: `eas login`
- Google Play developer account

### Step 1: Configure app.json

```json
{
  "expo": {
    "android": {
      "package": "com.yourname.csboardgames",
      "versionCode": 1
    }
  }
}
```

### Step 2: Configure EAS project

```bash
eas build:configure
```

### Step 3: Build for production

```bash
# Android App Bundle (.aab) for Play Store
eas build --platform android --profile production

# APK for direct install / testing
eas build --platform android --profile preview
```

EAS automatically handles:
- Keystore generation and signing
- Gradle build
- ProGuard/minification

### Step 4: Download and upload to Play Store

1. Download the `.aab` from EAS dashboard
2. Go to Google Play Console → Create app
3. Production → Create new release → Upload `.aab`
4. Fill store listing (description, screenshots, etc.)
5. Submit for review

### Versioning Strategy

Follow Semantic Versioning in `app.json`:
- `version`: User-visible string ("1.0.0", "1.1.0")
- `versionCode`: Integer, increment on every Play Store upload

```
1.0.0 → Initial release
1.1.0 → New game added (minor)
1.0.1 → Bug fix (patch)
2.0.0 → Major redesign (major)
```

---

## Git Workflow

### Branch Strategy

```
main          ← stable production releases only
  └── dev     ← integration branch, always deployable
        ├── feature/game-spanning-tree
        ├── feature/multiplayer-lobby
        └── fix/score-reset-bug
```

### Commands

```bash
# Start new feature
git checkout dev
git pull origin dev
git checkout -b feature/my-new-game

# Work, commit often
git add .
git commit -m "feat(games): add MyNewGame logic and UI"

# Merge when ready
git checkout dev
git merge feature/my-new-game
git push origin dev

# Release to production
git checkout main
git merge dev
git tag v1.1.0
git push origin main --tags
```

### Commit Message Convention

```
feat(games): add bipartite graph preset 3
fix(store): correct score reset on mode switch  
style(theme): update coastal blue color
docs: update README with deployment steps
chore: bump expo to 51
```

---

## Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-game`
3. Follow the **Add a New Game** steps above
4. Ensure logic is in a separate `.ts` file (no React)
5. Test on both Android emulator and physical device
6. Submit a PR to `dev` branch with:
   - Description of the game rules
   - Screenshot or recording
   - Notes on CS concept being taught

---

## Architecture Philosophy

| Principle | Implementation |
|-----------|---------------|
| Separation of concerns | Game logic in `.ts`, UI in `.tsx` |
| Open/Closed | Add games without modifying core |
| Single responsibility | Each file does one thing |
| Immutability | State functions return new objects |
| Testability | Pure logic functions are easily unit-tested |

---

## License

MIT License. Free to use, modify, and distribute.

---

*Made with ❤️ for CS students who love both games and algorithms.*
