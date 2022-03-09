#pragma once

#include <netinet/ip.h>

/* Client structure */
struct client {
	char name[NAME_LEN_MAX + 1]; /* Name of the client */
	struct sockaddr_in addr;     /* Client remote address */
	int uid;                     /* Unique client identifier */
	int fd;                      /* Connection file descriptor */
};

/* Handle input by the specified file descriptor. */
int handle_client(int fd);