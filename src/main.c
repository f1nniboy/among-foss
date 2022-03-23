#include <stdint.h>

#include "constant.h"
#include "client.h"
#include "server.h"
#include "log.h"

/* Options */
uint16_t port = DEF_PORT;

/* Parse the program arguments. */
void parse_args(int argc, char *argv[]) {
	int ch;

	while ((ch = getopt(argc, argv, "hp:v")) != -1) {
		switch (ch) {
			/* Configure the port. */
			case 'p':;
				uint32_t t_port;
				t_port = strtod(argv[optind - 1], NULL);

				if (errno == EINVAL || t_port == 0)
					msg_die("An invalid port was specified.");

				if (t_port >= (2<<15))
					msg_die("An out-of-range port was specified.");

				port = t_port;
				break;

			/* Show the current version. */
			case 'v':
				msg_info("Version '" VERSION "'; compiled on " __DATE__ ", " __TIME__);
				exit(0);

				break;

			/* Show all available actions. */
			case '?':
			case 'h':
			default:
				msg_info("%s => Game server for an Among Us-based text adventure game", argv[0]);
				puts("");

				msg_info("version => Show the current version.");
				msg_info("port    => Configure the port.");

				exit(0);
				break;
		}
	}
}

int main(int argc, char *argv[]) {
	/* Parse the program arguments. */
	parse_args(argc, argv);

	/* Start a server on the default port. */
	start_server(port);

	/* Shut down the server. */
	stop_server(0);
}