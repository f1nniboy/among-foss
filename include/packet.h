#pragma once

#include "json.h"

enum PACKET_ID {
	/* Outgoing, sent to the client */
	PACKET_INFO,

	/* Incoming, sent from the client */
	/* - */

	/* Both, sent from and to the client */
	PACKET_NAME,

	/* Packet counter; do not remove */
	PACKET_COUNT
};

/* Send a packet to the specified client ID. */
void send_packet(int id, int type, int status, struct json_object *args);

#define send_basic_packet(id, type, status) send_packet(id, type, status, NULL)

#define send_packet_with_pair(id, type, status, key, value, func) \
	do {                                                          \
		struct json_object *args = json_object_new_object();      \
		struct json_object *object = func(value);                 \
                                                                  \
		json_object_object_add(args, key, object);                \
		send_packet(id, type, status, arguments);                 \
	} while(0)

#define send_packet_with_string_pair(id, type, status, key, value) send_packet_with_pair(id, type, status, key, value, json_object_new_string)
#define send_packet_with_bool_pair(id, type, status, key, value) send_packet_with_pair(id, type, status, key, value, json_object_new_boolean)
#define send_packet_with_int_pair(id, type, status, key, value) send_packet_with_pair(id, type, status, key, value, json_object_new_int)

#define get_arg(type, var, key, func)                        \
	do {                                                     \
		struct json_object *temp, *temp2;                    \
                                                             \
		json_object_object_get_ex(args, "arguments", &temp); \
		json_object_object_get_ex(temp, key, &temp2);        \
                                                             \
		var = (type) func(temp2);                            \
	} while(0)

#define get_string_arg(var, key) get_arg(char *, var, key, json_object_get_string)
#define get_bool_arg(var, key) get_arg(int, var, key, json_object_get_boolean)
#define get_int_arg(var, key) get_arg(int, var, key, json_object_get_int)

/* Function definition for handlers */
typedef void (*handler_t)(int, struct json_object *);

/* Handlers */
void packet_name(int sender_id, struct json_object *args);

/* Handle a packet sent by the specified client.
   Returns whether the packet was handled successfully. */
int handle_packet(int id, int type, struct json_object *args);

/* Parse a packet within the specified string, sent by the specified client. */
void parse_packet(int id, char *str);