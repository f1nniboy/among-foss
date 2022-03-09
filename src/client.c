#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <pthread.h>
#include <string.h>
#include <unistd.h>
#include <stdlib.h>
#include <stdio.h>

#include "constant.h"
#include "client.h"
#include "server.h"
#include "util.h"
#include "log.h"

/* Get a client by its ID. */
client_t *get_client_by_id(int id) {
	for(int i = 0; i < NUM_CLIENTS; ++i) {
		if(clients[i] && clients[i]->id == id) {
			return clients[i];
			break;
		}
	}

	return NULL;
}

/* Add the specified client to the queue. */
void add_client(client_t *client) {
	pthread_mutex_lock(&clients_mutex);

	/* Find a free client slot. */
	for(int i = 0; i < NUM_CLIENTS; ++i) {
		/* Check whether the current client slot is free. */
		if(!clients[i]) {
			clients[i] = client;
			break;
		}
	}

	pthread_mutex_unlock(&clients_mutex);
}

/* Remove the specified client from the queue. */
void remove_client(int id) {
	pthread_mutex_lock(&clients_mutex);

	/* Find a the taken client slot. */
	for(int i = 0; i < NUM_CLIENTS; ++i) {
		/* Check whether the current client slot is taken. */
		if(clients[i] && clients[i]->id == id) {
			clients[i] = NULL;
			break;
		}
	}

	pthread_mutex_unlock(&clients_mutex);
}

/* Send a message to the specified client. */
void send_msg(char *str, int id) {
	client_t *client = get_client_by_id(id);

	/* Make sure that the client is still connected. */
	if(client != NULL) {
		/* Try to write to the client's file descriptor. */
		if(write(client->fd, str, strlen(str)) < 0 || write(client->fd, "\n", 1) < 0)
			msg_err("Failed to write to file descriptor of client #%d.", client->id);
	}
}

/* Send a message to all clients. */
void send_global_msg(char *str) {
	for(int i = 0; i < NUM_CLIENTS; ++i) {
		/* Make sure that the client slot is taken. */
		if(clients[i])
			send_msg(str, clients[i]->id);
	}
}

/* Handle message from the specified client. */
void *handle_client(void *arg) {
	char buff_in[BUFFER_SIZE];
	char buff_out[BUFFER_SIZE];
	int read_len;

	client_t *client = (client_t *) arg;
	msg_info("Client #%d has connected.", client->id);

	/* Receive messages from the client. */
	while((read_len = read(client->fd, buff_in, sizeof(buff_in) - 1)) > 0) {
		buff_in[read_len] = '\0';
		buff_out[0] = '\0';

		/* Remove the newline from the client's input. */
		strip_newline(buff_in);

		/* Make sure that the buffer is not empty. */
		if (!strlen(buff_in))
			continue;

		msg_warn("%d -> \"%s\"", client->id, buff_in);
	}

	/* Close the connection. */
	msg_info("Client #%d has disconnected.", client->id);
	close(client->fd);

	/* Delete the client from the queue and memory. */
	remove_client(client->id);
	free(client);

	/* Yield the thread. */
	pthread_detach(pthread_self());

	return NULL;
}