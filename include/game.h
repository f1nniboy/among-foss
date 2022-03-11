#pragma once

#include "constant.h"
#include "client.h"

/* Game structure */
typedef struct game {
	/* Current game stage */
	enum client_stage stage;

	/* Client ID of the impostor */
	int impostor_id;
} game_t;

/* Current game state */
extern game_t *state;

/* Initialize the game state. */
void init_game_state();

/* Start the game. */
void start_game();

/* End the game, with the specified winner. */
void end_game(enum client_role role);