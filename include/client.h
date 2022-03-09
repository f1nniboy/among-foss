#pragma once

struct client {
	char name[NAME_LEN_MAX + 1];
	int fd;
};

/* Get a client's ID by its file descriptor. */
int get_id_by_fd(int fd);

/* Handle input by the specified file descriptor. */
int handle_input(int fd);