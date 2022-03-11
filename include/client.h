#pragma once

#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <pthread.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>

/* Client stages */
enum client_stage {
	/* The client is still configuring their name */
	CLIENT_STAGE_NAME,
	
	/* The client is waiting in the lobby for the game to start */
	CLIENT_STAGE_LOBBY,

	/* The client is playing the game */
	CLIENT_STAGE_MAIN
};

/* Client roles */
enum client_role {
	CLIENT_ROLE_CREWMATE,
	CLIENT_ROLE_IMPOSTOR
};

/* Client states */
enum client_state {
	CLIENT_STATE_ALIVE,
	CLIENT_STATE_DEAD
};

/* Client structure */
typedef struct client {
	struct sockaddr_in addr;     /* Client remote address */
	int connected;               /* Whether the connection is active */
	int id;                      /* Unique client identifier */
	int fd;                      /* Connection file descriptor */

	char name[NAME_LEN_MAX + 1]; /* Name of the client */

	enum client_stage stage;     /* Current stage of the client */
	enum client_role role;       /* Game role of the client */
} client_t;

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

/* Send a message to the specified client. */
void send_msg(char *str, int id);

/* Send a message to all clients except the sender. */
void send_global_msg(char *str, int sender_id);

/* Handle message from the specified client. */
void *handle_client(void *arg);