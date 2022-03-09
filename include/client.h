#pragma once

#include <netinet/ip.h>

/* Client structure */
typedef struct client {
	char name[NAME_LEN_MAX + 1]; /* Name of the client */
	struct sockaddr_in addr;     /* Client remote address */
	int id;                      /* Unique client identifier */
	int fd;                      /* Connection file descriptor */
} client_t;

/* Add the specified client to the queue. */
void add_client(client_t *client);

/* Remove the specified client from the queue. */
void remove_client(int id);

/* Handle message from the specified client. */
void *handle_client(void *arg);