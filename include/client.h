#pragma once

#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <pthread.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>

/* Client structure */
typedef struct client {
	char name[NAME_LEN_MAX + 1]; /* Name of the client */
	struct sockaddr_in addr;     /* Client remote address */
	int connected;               /* Whether the connection is active */
	int id;                      /* Unique client identifier */
	int fd;                      /* Connection file descriptor */
} client_t;

/* Get a client by its ID. */
client_t *get_client_by_id(int id);

/* Add the specified client to the queue. */
void add_client_to_queue(client_t *client);

/* Remove the specified client from the queue. */
void remove_client_from_queue(int id);

/* Disconnect the specified client. */
void disconnect_client(int id);

/* Send a message to the specified client. */
void send_msg(char *str, int id);

/* Send a message to all clients. */
void send_global_msg(char *str);

/* Handle message from the specified client. */
void *handle_client(void *arg);