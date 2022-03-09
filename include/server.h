#pragma once

/* List of connected clients */
extern client_t *clients[NUM_CLIENTS];
extern pthread_mutex_t clients_mutex;

/* Last used user ID */
extern int last_id;

/* Start a server on the specified port. */
void start_server(uint16_t port);

/* Shut down the current server. */
void stop_server(int code);