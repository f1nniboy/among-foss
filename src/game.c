#include "constant.h"
#include "client.h"
#include "server.h"
#include "game.h"
#include "log.h"

/* Current game state */
game_t *state = NULL;

/* Initialize the game state. */
void init_game_state() {
	/* Don't try to initialize the game state twice. */
	if(state != NULL)
		return;

	/* Initialize the game state. */
	state = (game_t *) malloc(sizeof(game_t));
}

/* Start the game. */
void start_game() {
	/* Change the game stage. */
	state->stage = CLIENT_STAGE_MAIN;

	msg_info("The game has started.", client_count);
}

/* End the game, with the specified winner. */
void end_game(enum client_role role) {
	/* Change the game stage back to the lobby. */
	state->stage = CLIENT_STAGE_LOBBY;

	msg_info("The game has ended.", client_count);
}