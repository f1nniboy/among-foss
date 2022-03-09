#include <stdint.h>

#include "constant.h"
#include "client.h"
#include "server.h"

int main() {
	/* Start a server on the default port. */
	start_server(DEF_PORT);

	/* Shut down the server. */
	stop_server(0);
}