#include <stdint.h>
#include <stdlib.h>

#include "constant.h"
#include "client.h"
#include "server.h"
#include "log.h"

/* Start a server on the specified port. */
void start_server(uint16_t port) {
	msg_info("Started server on port '%d'.", port);
}

/* Shut down the current server. */
void stop_server() {
	msg_warn("Shutting down server.");
	exit(0);
}