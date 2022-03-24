#include "constant.h"
#include "client.h"
#include "server.h"
#include "task.h"
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
int start_game() {
	if(state->state != GAME_STATE_LOBBY) {
		msg_warn("The game is already running.");
		return PACKET_STATUS_AGAIN;
	}

	/* Initialize the variables. */
	state->impostor_id = -1;
	
	/* Update the game status. */
	set_game_status(GAME_STATE_MAIN, -1);

	/* Choose a random impostor. */
	int impostor_id = random_num(0, client_count - 1);

	/* Assign the roles and set default values for all clients. */
	client_for_each(client)
		/* Set the state. */
		set_state(CLIENT_STAGE_MAIN,
			impostor_id == i ? CLIENT_ROLE_IMPOSTOR : CLIENT_ROLE_CREWMATE,
			1, client->id);

		/* Set the location. */
		set_location(LOC_CAFETERIA, client->id);

		/* Update the impostor ID, if it matches. */
		if (impostor_id == i)
			state->impostor_id = client->id;

		/* Assign the client some tasks. */
		assign_tasks(client->id);
	}

	/* Send every client information about the initial room. */
	client_for_each(client)
		/* Send the client information about the initial room. */
		send_room_info(client->location, client->id);
	}

	msg_info("The game has started.", client_count);
	return PACKET_STATUS_OK;
}

/* Check whether a role has won the game. */
void check_game() {
	#define win(role) do { winner = role; goto end; } while(0)

	/* Make sure that a game is currently running. */
	if(state->state == GAME_STATE_LOBBY)
		return;

	/* Winner of the game */
	enum client_role winner = -1;

	/* Numbers of clients, which are still alive */
	int alive_count = 0;

	/* Minimum amount of crewmates needed */
	int min_count = 0;

	client_for_each(client)
		/* Check whether the impostor is still alive.
		   This shouldn't happen under normal circumstances. */
		if(client->id == state->impostor_id && !client->alive)
			win(CLIENT_ROLE_CREWMATE);

		/* Increase the alive counter. */
		if(client->alive && client->id != state->impostor_id)
			alive_count++;
	}

	/* Check whether the impostor is still connected to the game. */
	if(get_client_by_id(state->impostor_id) == NULL)
		win(CLIENT_ROLE_CREWMATE);

	/* Check whether there are still enough crewmates. */
	if(alive_count <= min_count)
		win(CLIENT_ROLE_IMPOSTOR);

	/* Check whether all crewmates have completed their tasks. */
	if(check_tasks())
		win(CLIENT_ROLE_CREWMATE);

	/* Don't end the game, if no one won. */
	if(winner == -1) return;

end:
	/* End the game with the winner. */
	end_game(winner);

	#undef win
}

/* End the game, with the specified winner. */
void end_game(enum client_role role) {
	/* Reset the variables. */
	state->impostor_id = -1;

	/* Reset the game status again. */
	set_game_status(GAME_STATE_LOBBY, role);

	msg_info("The game has ended.", client_count);
}