#pragma once

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

/* List of connected clients */
extern client_t *clients[NUM_CLIENTS];
extern pthread_mutex_t clients_mutex;

/* Amount of connected clients */
extern int client_count;

/* Start a server on the specified port. */
void start_server(uint16_t port);

/* Shut down the current server. */
void stop_server(int code);