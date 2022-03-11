#include "constant.h"
#include "client.h"
#include "server.h"
#include "packet.h"
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
void add_client_to_queue(client_t *client) {
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
void remove_client_from_queue(int id) {
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

/* Disconnect the specified client. */
void disconnect_client(int id) {
	client_t *client = get_client_by_id(id);

	if(client != NULL && client->connected) {
		/* Close the connection. */
		client->connected = 0;
		close(client->fd);
		client_count--;

		/* Remove the client from the queue and memory. */
		remove_client_from_queue(client->id);
		free(client);
	}
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
	char buff[BUFFER_SIZE];
	int read_len;

	client_t *client = (client_t *) arg;

	/* Check whether the server is full. */
	if(client_count + 1 > NUM_CLIENTS)
		goto disconnect;

	msg_info("Client #%d has connected.", client->id);
	client_count++;

	/* Set the client's stage. */
	client->stage = CLIENT_STAGE_NAME;

	/* Receive messages from the client. */
	while((read_len = read(client->fd, buff, sizeof(buff) - 1)) > 0 && client->connected) {
		/* Terminate the read string. */
		buff[read_len] = '\0';

		/* Remove the newline from the client's input. */
		strip_newline(buff);

		/* Make sure that the buffer is not empty. */
		if(!strlen(buff))
			continue;

		/* Print the client's message to the console. */
		msg_warn("#%d -> \"%s\"", client->id, buff);

		/* Try to parse the message as a packet. */
		parse_packet(client->id, buff);
	}

disconnect:
	/* Close the connection. */
	msg_info("Client #%d has disconnected.", client->id);
	disconnect_client(client->id);

	/* Yield the thread. */
	pthread_detach(pthread_self());

	return NULL;
}