enum GameState {
    /** The players are waiting for the game to start & can chat */
    Lobby,

    /** The game is currently running */
    Main,

    /** Players can vote out others & chat */
    Discussion
}

/** The game manager - everything about the game gets managed herre */
export class Game {
    /** Current state of the game */
    public state: GameState;

    constructor() {
        this.state = GameState.Lobby;
    }
}