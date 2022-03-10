#pragma once

#include "json.h"

enum PACKET_ID {
	/* Information about the server */
	PACKET_INFO,

	/* Packet counter; do not remove */
	PACKET_COUNT
};

/* Function definition for handlers */
typedef void (*handler_t)(int, struct json_object *);

/* Handlers */
void packet_info(int sender_id, struct json_object *args);

/* Handle a packet sent by the specified client.
   Returns whether the packet was handled successfully. */
int handle_packet(int id, int type, struct json_object *args);

/* Parse a packet within the specified string, sent by the specified client. */
void parse_packet(int id, char *str);