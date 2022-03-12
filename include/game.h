#pragma once

#include "constant.h"
#include "packet.h"
#include "client.h"

enum game_state {
	GAME_STATE_LOBBY,
	GAME_STATE_MAIN
};

/* Game structure */
typedef struct game {
	/* Current game state */
	enum game_state state;

	/* Client ID of the impostor */
	int impostor_id;
} game_t;

/* Current game state */
extern game_t *state;

/* Initialize the game state. */
void init_game_state();

/* Set and send the game status to all clients. */
void set_game_status(enum game_state new_state, enum client_role role);

/* Start the game. */
void start_game();

/* End the game, with the specified winner. */
void end_game(enum client_role role);