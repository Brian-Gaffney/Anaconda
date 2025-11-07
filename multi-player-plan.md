# Multiplayer Implementation Plan

## Overview

Transform Anaconda into a 2-4 player competitive snake game using WebSocket communication with a Node.js backend hosted on Fly.io.

## Architecture

```
┌─────────────┐     WebSocket      ┌─────────────┐
│  Client 1   │◄──────────────────►│             │
│  (Browser)  │                    │   Node.js   │
└─────────────┘                    │   Server    │
                                   │  (Fly.io)   │
┌─────────────┐     WebSocket      │             │
│  Client 2   │◄──────────────────►│  Authority  │
│  (Browser)  │                    │   - State   │
└─────────────┘                    │   - Physics │
                                   │   - Scoring │
┌─────────────┐     WebSocket      │             │
│  Client 3   │◄──────────────────►│             │
│  (Browser)  │                    │             │
└─────────────┘                    └─────────────┘

┌─────────────┐     WebSocket
│  Client 4   │◄──────────────────►
│  (Browser)  │
└─────────────┘
```

## Tech Stack

### Backend
- **Runtime:** Node.js (TypeScript)
- **WebSocket Library:** ws or Socket.io
- **Server Framework:** Express (for health checks, lobby pages)
- **Hosting:** Fly.io (Hobby tier - $1.94/month)
- **Port:** 8080 (WebSocket)

### Frontend Changes
- **WebSocket Client:** Native WebSocket API or Socket.io-client
- **Network Manager:** New class to handle server communication
- **Interpolation:** Smooth rendering of remote players
- **Latency Display:** Show ping/connection quality

## Game Mechanics

### Player Identification
- Each player assigned a color:
  - Player 1: Green (#00ff00) - original snake color
  - Player 2: Yellow (#ffff00)
  - Player 3: Magenta (#ff00ff)
  - Player 4: Cyan (#00ffff)
- Each snake starts in a different corner

### Collision Rules
- Hit wall = death
- Hit self = death
- Hit another snake = death (for the one who hit)
- Last snake alive wins the round

### Food System
- Food spawns randomly (5 items as in single player)
- All players compete for the same food
- Food collected by first player to touch it
- Immediate respawn when collected

### Scoring
- 100 points per red food
- 500 points per blue food
- Survival bonus: 50 points per second alive
- Win bonus: 1000 points for last snake standing

## Server Responsibilities

### Game State Management
```typescript
interface GameState {
  players: Map<string, PlayerState>;
  food: FoodItem[];
  gamePhase: 'lobby' | 'countdown' | 'playing' | 'gameOver';
  roundNumber: number;
  startTime: number;
}

interface PlayerState {
  id: string;
  name: string;
  color: string;
  position: Vector2;
  angle: number;
  velocity: Vector2;
  trailPoints: Vector2[];
  alive: boolean;
  score: number;
  input: PlayerInput;
}

interface PlayerInput {
  left: boolean;
  right: boolean;
  boost: boolean;
}
```

### Update Loop
- Fixed timestep: 60 FPS (16.67ms)
- Process all player inputs
- Update snake positions
- Check collisions (walls, self, other snakes)
- Check food collection
- Broadcast state to all clients

### Message Protocol
```typescript
// Client → Server
{
  type: 'join',
  playerName: string
}

{
  type: 'input',
  left: boolean,
  right: boolean,
  boost: boolean
}

{
  type: 'ready'
}

// Server → Client
{
  type: 'welcome',
  playerId: string,
  playerColor: string
}

{
  type: 'gameState',
  players: PlayerState[],
  food: FoodItem[],
  timestamp: number
}

{
  type: 'playerJoined',
  playerId: string,
  playerName: string
}

{
  type: 'playerLeft',
  playerId: string
}

{
  type: 'gameStart',
  countdown: number
}

{
  type: 'gameOver',
  winnerId: string,
  finalScores: Score[]
}
```

## Client Changes

### New Files
```
src/network/
├── NetworkManager.ts      # WebSocket connection management
├── MessageHandler.ts      # Parse/send messages
└── StateInterpolator.ts   # Smooth remote player movement

src/multiplayer/
├── MultiplayerGame.ts     # Multiplayer game mode
├── RemotePlayer.ts        # Render other players
└── Lobby.ts              # Pre-game lobby UI
```

### Modified Files
- `main.ts` - Add mode selection (single/multiplayer)
- `Game.ts` - Extract shared logic
- `Snake.ts` - Support external position updates
- `index.html` - Add lobby UI, player name input

### Network Manager
```typescript
class NetworkManager {
  private ws: WebSocket;
  private playerId: string;
  private listeners: Map<string, Function[]>;

  connect(serverUrl: string): Promise<void>
  send(message: any): void
  on(messageType: string, callback: Function): void
  disconnect(): void
  getLatency(): number
}
```

### State Interpolation
- Server sends updates at 20Hz (50ms intervals)
- Client runs at 60 FPS
- Interpolate between server updates for smooth movement
- Use lag compensation for better feel

## UI Changes

### Main Menu
```
┌─────────────────────────────────┐
│         ANACONDA                │
├─────────────────────────────────┤
│                                 │
│     [ Single Player ]           │
│                                 │
│     [ Multiplayer ]             │
│                                 │
│     Enter Name: [_______]       │
│                                 │
└─────────────────────────────────┘
```

### Lobby Screen
```
┌─────────────────────────────────┐
│         WAITING FOR PLAYERS     │
├─────────────────────────────────┤
│  Player 1: Alice      [READY]   │
│  Player 2: Bob        [READY]   │
│  Player 3: Charlie    [READY]   │
│  Player 4: ...                  │
├─────────────────────────────────┤
│  Press SPACE when ready         │
│  Game starts when all ready     │
└─────────────────────────────────┘
```

### In-Game HUD
```
┌─────────────────────────────────┐
│ Alice: 01250    Bob: 00850      │
│ Charlie: 00450  You: 01100      │
├─────────────────────────────────┤
│         [Game Canvas]           │
│                                 │
└─────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Backend Setup (Week 1)
- [ ] Initialize Node.js + TypeScript project
- [ ] Set up WebSocket server with ws
- [ ] Implement basic connection handling
- [ ] Create game state data structures
- [ ] Implement game loop (60 FPS fixed timestep)
- [ ] Basic message protocol
- [ ] Test locally with dummy clients

### Phase 2: Snake Physics Server-Side (Week 1-2)
- [ ] Port Snake.ts logic to server
- [ ] Port Food.ts logic to server
- [ ] Port collision detection to server
- [ ] Multi-snake support (2-4 players)
- [ ] Food spawning and collection
- [ ] Score calculation
- [ ] Death and respawn logic

### Phase 3: Client Network Integration (Week 2)
- [ ] Create NetworkManager class
- [ ] WebSocket connection from client
- [ ] Send player input to server
- [ ] Receive game state from server
- [ ] Create RemotePlayer rendering class
- [ ] Basic multiplayer rendering (no interpolation yet)

### Phase 4: Game Flow (Week 2-3)
- [ ] Lobby system (waiting for players)
- [ ] Ready-up mechanism
- [ ] Countdown before game starts
- [ ] Game over detection (last snake alive)
- [ ] Round system
- [ ] Score persistence across rounds

### Phase 5: Polish (Week 3)
- [ ] State interpolation for smooth movement
- [ ] Lag compensation
- [ ] Disconnect handling (player leaves mid-game)
- [ ] Reconnection support
- [ ] Latency display
- [ ] Player name tags above snakes

### Phase 6: Deployment (Week 3-4)
- [ ] Create Dockerfile
- [ ] Set up Fly.io account
- [ ] Create fly.toml configuration
- [ ] Deploy to Fly.io
- [ ] Configure custom domain (optional)
- [ ] Test with real internet connections
- [ ] Monitor performance and latency

### Phase 7: Testing & Optimization (Week 4)
- [ ] Test with 2, 3, and 4 players
- [ ] Test on different network conditions
- [ ] Optimize bandwidth usage
- [ ] Add error handling and recovery
- [ ] Security: rate limiting, input validation
- [ ] Add spectator mode for eliminated players

## Server Structure

```
anaconda-server/
├── src/
│   ├── server.ts              # Main entry point
│   ├── game/
│   │   ├── GameRoom.ts        # Manages one game instance
│   │   ├── GameLoop.ts        # Fixed timestep loop
│   │   ├── Snake.ts           # Server-side snake
│   │   ├── Food.ts            # Server-side food
│   │   ├── CollisionDetector.ts
│   │   └── ScoreManager.ts
│   ├── network/
│   │   ├── ConnectionManager.ts
│   │   ├── MessageHandler.ts
│   │   └── RoomManager.ts     # Manage multiple game rooms
│   └── utils/
│       ├── Vector2.ts
│       └── constants.ts
├── package.json
├── tsconfig.json
├── Dockerfile
└── fly.toml
```

## Fly.io Deployment

### fly.toml Configuration
```toml
app = "anaconda-multiplayer"
primary_region = "lax" # Los Angeles (choose closest to players)

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["http", "tls"]

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0 # Scale to 0 when idle (free tier friendly)
```

### Dockerfile
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
EXPOSE 8080
CMD ["node", "dist/server.js"]
```

### Deployment Commands
```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Initialize app
fly launch

# Deploy
fly deploy

# View logs
fly logs

# Check status
fly status
```

### Cost Estimate
- Fly.io Hobby: $1.94/month
- Auto-scale to 0 when no players
- Shared CPU when running
- 256MB RAM (sufficient for 4-player game)

## Testing Strategy

### Local Development
1. Run server locally: `npm run dev`
2. Open 4 browser tabs
3. Connect all to localhost:8080
4. Test game flow

### Staging
1. Deploy to Fly.io staging environment
2. Test from multiple physical locations
3. Measure latency (aim for <100ms for US players)
4. Load test with simulated players

### Production
1. Monitor with Fly.io metrics
2. Set up alerts for downtime
3. Log errors to service (Sentry, LogRocket)
4. Gradual rollout to players

## Potential Challenges

### 1. Latency
**Problem:** Players far from server = lag
**Solution:**
- Client-side prediction for local player
- Interpolation for remote players
- Multiple regional deployments (future)

### 2. Cheating
**Problem:** Client sends fake positions
**Solution:**
- Server is authoritative
- Validate all inputs server-side
- Rate limit input messages

### 3. Disconnections
**Problem:** Player loses connection mid-game
**Solution:**
- Grace period (5 seconds) to reconnect
- Bot takes over if disconnect persists
- Continue game with remaining players

### 4. NAT/Firewall Issues
**Problem:** WebSockets blocked in some networks
**Solution:**
- Use standard ports (443)
- Fallback to polling if WebSocket fails
- Clear error messages for blocked connections

## Future Enhancements

- **Matchmaking:** Queue system for random opponents
- **Private Rooms:** Create room codes for friends
- **Game Modes:** Team mode, capture the flag, etc.
- **Replay System:** Record and watch games
- **Leaderboards:** Global high scores
- **Power-ups:** Special abilities, shields, speed boosts
- **Custom Maps:** Different arenas with obstacles
- **Voice Chat:** WebRTC for team communication
- **Mobile Support:** Touch controls for phones

## Security Considerations

- Rate limiting: Max 60 input messages per second
- Input validation: Clamp turn rate, speed values
- Authentication: Optional accounts via JWT
- CORS: Restrict to your domain
- DoS protection: Connection limits per IP
- Sanitize player names: Max length, no special chars

## Monitoring & Analytics

### Metrics to Track
- Active players
- Average game duration
- Server tick rate (should be 60 FPS)
- Network latency per player
- Food collection rate
- Win rates by player position

### Tools
- Fly.io built-in metrics
- Custom logging
- Error tracking (Sentry)
- Analytics (simple event tracking)

## Next Steps

1. **Decide:** Commit to multiplayer development?
2. **Prototype:** Build minimal server + 2-player client
3. **Test:** Verify latency and gameplay feel
4. **Iterate:** Add features incrementally
5. **Deploy:** Push to Fly.io for real-world testing
6. **Launch:** Release to players!

## Estimated Timeline

- **Minimum Viable Multiplayer:** 2-3 weeks
- **Polished Release:** 4-6 weeks
- **With all enhancements:** 2-3 months

## Resources

- [Fly.io Docs](https://fly.io/docs/)
- [WebSocket Protocol](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Game Networking Patterns](https://gafferongames.com/post/what_every_programmer_needs_to_know_about_game_networking/)
- [Fast-Paced Multiplayer](https://www.gabrielgambetta.com/client-server-game-architecture.html)
