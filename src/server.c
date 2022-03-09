#include <stdint.h>
#include <stdio.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <stdlib.h>
#include <unistd.h>
#include <errno.h>
#include <string.h>
#include <pthread.h>
#include <sys/types.h>
#include <signal.h>

#include "constant.h"
#include "client.h"
#include "server.h"
#include "log.h"

/* List of connected clients */
client_t *clients[NUM_CLIENTS];
pthread_mutex_t clients_mutex = PTHREAD_MUTEX_INITIALIZER;

/* Last used user ID */
int last_id = 0;

/* Start a server on the specified port. */
void start_server(uint16_t port) {
	int listen_fd = 0, conn_fd = 0;
	struct sockaddr_in server_addr;
	struct sockaddr_in client_addr;
	pthread_t tid;

	listen_fd = socket(AF_INET, SOCK_STREAM, 0);

	/* Socket settings */
	server_addr.sin_family = AF_INET;
	server_addr.sin_addr.s_addr = htonl(INADDR_ANY);
	server_addr.sin_port = htons(port);
	
	/* Ignore pipe signals. */
	signal(SIGPIPE, SIG_IGN);
	
	/* Bind the socket. */
	if (bind(listen_fd, (struct sockaddr *) &server_addr, sizeof(server_addr)) < 0)
		msg_die("Failed to bind socket.");

	/* Listen on the socket. */
	if (listen(listen_fd, 10) < 0)
		msg_die("Failed to listen on socket.");
	
	msg_info("Started the server on port '%d'.", port);

	/* Accept any incoming connections. */
	while(1) {
		socklen_t client_addr_len = sizeof(client_addr);
		conn_fd = accept(listen_fd, (struct sockaddr *) &client_addr, &client_addr_len);

		client_t *client = (client_t *) malloc(sizeof(client_t));

		/* Client settings */
		client->addr = client_addr;
		client->fd = conn_fd;
		client->id = last_id++;

		/* Add the client to the queue and create a new thread for the handling of messages. */
		add_client(client);
		pthread_create(&tid, NULL, &handle_client, (void *) client);

		/* Reduce the CPU usage. */
		sleep(1);
	}
}

/* Shut down the current server. */
void stop_server(int code) {
	msg_warn("Shutting down the server.");
	exit(code);
}