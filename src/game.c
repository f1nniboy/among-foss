#include "constant.h"
#include "client.h"
#include "server.h"
#include "game.h"
#include "util.h"
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

	/* Set the default values. */
	state->state = GAME_STATE_LOBBY;
}

/* Set and send the game status to all clients. */
void set_game_status(enum game_state new_state, enum client_role role) {
	struct json_object *args_object = NULL;
	
	if(role != -1) {
		args_object = json_object_new_object();
		json_object_object_add(args_object, "winner", json_object_new_int(role));
	}

	/* Send the chat message to all other clients. */
	send_global_packet(-1, PACKET_GAME_STATUS, new_state, args_object);
	state->state = new_state;
}

/* Start the game. */
void start_game() {
	if(state->state != GAME_STATE_LOBBY)
		return msg_warn("The game is already running.");

	/* Choose a random impostor. */
	int impostor_index = random_num(0, client_count - 1);

	/* Assign the roles and set default values for all clients. */
	for(int i = 0; i < NUM_CLIENTS; ++i) {
		client_t *client = get_client_by_id(i);
		if(client == NULL) continue;

		set_state(CLIENT_STATE_MAIN, LOC_CAFETERIA,
			impostor_index == i ? CLIENT_ROLE_IMPOSTOR : CLIENT_ROLE_CREWMATE,
			1, client->id);

		if(impostor_index == i) state->impostor_id = client->id;
	}

	set_game_status(GAME_STATE_MAIN, -1);
	msg_info("The game has started.", client_count);
}

/* End the game, with the specified winner. */
void end_game(enum client_role role) {
	/* Reset the values. */
	state->impostor_id = -1;

	set_game_status(GAME_STATE_LOBBY, role);

	msg_info("The game has ended.", client_count);
}