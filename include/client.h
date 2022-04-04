#pragma once

#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <pthread.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>

#include "location.h"

#define client_for_each(var)                               \
	for(int i = 0; i < NUM_CLIENTS; ++i) {                 \
		client_t *var = clients[i];                        \
		                                                   \
		if(var == NULL || var->stage == CLIENT_STAGE_NAME) \
			continue;

/* Client roles */
enum client_role {
	CLIENT_ROLE_CREWMATE,
	CLIENT_ROLE_IMPOSTOR
};

/* Client stages */
enum client_stage {
	/* Choosing a name */
	CLIENT_STAGE_NAME,

	/* In the lobby */
	CLIENT_STAGE_LOBBY,

	/* In the game */
	CLIENT_STAGE_MAIN
};

/* Client structure */
typedef struct client {
	struct sockaddr_in6 addr;     /* Client remote address */
	int connected;               /* Whether the connection is active */
	int id;                      /* Unique client identifier */
	int fd;                      /* Connection file descriptor */

	char name[NAME_LEN_MAX + 1]; /* Name of the client */

	int alive;                   /* Whether the client is still alive */
	enum client_stage stage;     /* Current stage of the client */
	enum client_role role;       /* Game role of the client */
	enum location_id location;   /* Current location on the map */

	int tasks[TASK_AMOUNT];      /* Array of task IDs */
	int tasks_done[TASK_AMOUNT]; /* Array, corresponding to the task array, which contains whether a task has been completed */
} client_t;

#define is_in_game(client) (client->stage == CLIENT_STAGE_MAIN && state->state == GAME_STATE_MAIN)

/* Get a client by its ID. */
client_t *get_client_by_id(int id);

/* Add the specified client to the queue. */
void add_client_to_queue(client_t *client);

/* Remove the specified client from the queue. */
void remove_client_from_queue(int id);

/* Broadcast the new client status to other clients. */
void broadcast_client_status(int id, int status);

/* Disconnect the specified client. */
void disconnect_client(int id);

/* Set a variety of information about a client and notify them about the change. */
void set_state(enum client_stage stage, enum client_role role, int alive, int id);

/* Send a message to the specified client. */
void send_msg(char *str, int id);

/* Send a message to all clients except the sender. */
void send_global_msg(char *str, int sender_id);

/* Handle message from the specified client. */
void *handle_client(void *arg);