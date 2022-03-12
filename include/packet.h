#pragma once

#include "constant.h"
#include "client.h"
#include "json.h"

enum PACKET_ID {
	/* Outgoing, sent to the client */
	PACKET_INFO,
	PACKET_CLIENTS,
	PACKET_CLIENT_INFO,
	PACKET_GAME_STATUS,
	PACKET_STATE,

	/* Incoming, sent from the client */
	/* - */

	/* Both, sent from and to the client */
	PACKET_COMMAND,
	PACKET_NAME,
	PACKET_CHAT,

	/* Packet counter; do not remove */
	PACKET_COUNT
};

enum packet_client_info {
	PACKET_CLIENT_INFO_JOIN,
	PACKET_CLIENT_INFO_LEAVE
};

enum packet_game_status {
	PACKET_GAME_STATUS_FULL,
	PACKET_GAME_STATUS_RUNNING,

	PACKET_GAME_STATUS_IMPOSTOR_WIN,
	PACKET_GAME_STATUS_CREWMATE_WIN
};

enum PACKET_STATUS {
	/* General */
	PACKET_STATUS_OK,
	PACKET_STATUS_INVALID,
	PACKET_STATUS_AGAIN,

	/* Name */
	PACKET_STATUS_WRONG_LENGTH
};

/* Send a packet to the specified client ID. */
void send_packet(int id, int type, int status, struct json_object *args);

/* Send a packet to all clients, except the specified sender ID. */
void send_global_packet(int id, int type, int status, struct json_object *args);

#define send_basic_packet(id, type, status) send_packet(id, type, status, NULL)

#define send_packet_with_pair(id, type, status, key, value, func) \
	do {                                                          \
		struct json_object *args = json_object_new_object();      \
		struct json_object *object = func(value);                 \
                                                                  \
		json_object_object_add(args, key, object);                \
		send_packet(id, type, status, args);                      \
	} while(0)

#define send_packet_with_string_pair(id, type, status, key, value) send_packet_with_pair(id, type, status, key, value, json_object_new_string)
#define send_packet_with_bool_pair(id, type, status, key, value) send_packet_with_pair(id, type, status, key, value, json_object_new_boolean)
#define send_packet_with_int_pair(id, type, status, key, value) send_packet_with_pair(id, type, status, key, value, json_object_new_int)

#define get_arg(type, var, key, func)                                 \
	do {                                                              \
		if(args == NULL) break;                                       \
		struct json_object *temp = json_object_object_get(args, key); \
		var = (type) func(temp);                                      \
	} while(0)

#define get_string_arg(var, key) get_arg(char *, var, key, json_object_get_string)
#define get_bool_arg(var, key) get_arg(int, var, key, json_object_get_boolean)
#define get_int_arg(var, key) get_arg(int, var, key, json_object_get_int)

/* Function definition for handlers */
typedef void (*handler_t)(client_t *, struct json_object *);

/* Handlers */
void packet_name(client_t *client, struct json_object *args);
void packet_clients(client_t *client, struct json_object *args);
void packet_command(client_t *client, struct json_object *args);
void packet_chat(client_t *client, struct json_object *args);

/* Handle a packet sent by the specified client.
   Returns whether the packet was handled successfully. */
int handle_packet(int id, int type, struct json_object *args);

/* Parse a packet within the specified string, sent by the specified client. */
void parse_packet(int id, char *str);