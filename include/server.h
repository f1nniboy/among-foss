#pragma once

/* List of players */
extern struct client clients[NUM_CLIENTS];

/* Start a server on the specified port. */
void start_server(uint16_t port);

/* Shut down the current server. */
void stop_server();