#include "json.h"
#include "packet.h"
#include "constant.h"
#include "server.h"
#include "client.h"
#include "log.h"

handler_t handlers[PACKET_COUNT] = {
	[PACKET_NAME] = packet_name,
	[PACKET_CLIENTS] = packet_clients
};

/* When a client sends the server their name */
void packet_name(client_t *client, struct json_object *args) {
	/* Make sure that the client hasn't set their name already. */
	if(client->stage != CLIENT_STAGE_NAME)
		return send_basic_packet(client->id, PACKET_NAME, PACKET_STATUS_AGAIN);

	char *name; get_string_arg(name, "name");
	
	/* Make sure that the client specified a valid name. */
	if(name == NULL)
		return send_basic_packet(client->id, PACKET_NAME, PACKET_STATUS_INVALID);

	/* Make sure that the name is in bounds of the limits. */
	int len = strlen(name); if(len > NAME_LEN_MAX || len < NAME_LEN_MIN)
		return send_basic_packet(client->id, PACKET_NAME, PACKET_STATUS_WRONG_LENGTH);

	/* Update the client's name and stage. */
	client->stage = CLIENT_STAGE_LOBBY;
	strcpy(client->name, name);

	msg_info("Client #%d is now known as '%s'.", client->id, client->name);
	send_basic_packet(client->id, PACKET_NAME, PACKET_STATUS_OK);

	/* Notify other clients, that the client has joined the game. */
	broadcast_client_status(client->id, PACKET_CLIENT_INFO_JOIN);
}

/* When a client requests the client list from the server */
void packet_clients(client_t *client, struct json_object *args) {
	struct json_object *client_array = json_object_new_array();

	/* Loop through all clients. */
	for(int id = 0; id < NUM_CLIENTS; ++id) {
		client_t *cli = get_client_by_id(id);
		if(cli == NULL) break;

		/* Don't add the requesting client to the client list. */
		if(client->id == id)
			continue;

		/* Don't add clients, who haven't chosen their name yet, to the client list. */
		if(cli->stage == CLIENT_STAGE_NAME)
			continue;

		struct json_object *client_object = json_object_new_object();

		/* Add the client's information to the object. */
		json_object_object_add(client_object, "id", json_object_new_int(id));
		json_object_object_add(client_object, "name", json_object_new_string(cli->name));

		json_object_array_add(client_array, client_object);
	}

	send_packet(client->id, PACKET_CLIENTS, PACKET_STATUS_OK, client_array);
}

/* Send a packet to the specified client ID. */
void send_packet(int id, int type, int status, struct json_object *args) {
	struct json_object *object, *tmp;

	/* Create a new JSON object. */
	object = json_object_new_object();

	/* Create the type integer. */
	tmp = json_object_new_int(type);
	json_object_object_add(object, "type", tmp);

	/* Create the status integer. */
	tmp = json_object_new_int(status);
	json_object_object_add(object, "status", tmp);

	if (args != NULL)
		json_object_object_add(object, "arguments", args);

	/* Convert the JSON object into a string. */
	char *str = (char *) json_object_to_json_string_ext(object, JSON_C_TO_STRING_PLAIN);

	/* Send the packet. */
	if(id == -1)
		send_global_msg(str);
	else
		send_msg(str, id);

	/* Free the JSON object after using it. */
	json_object_put(object);
}

/* Handle a packet sent by the specified client. */
int handle_packet(int id, int type, struct json_object *args) {
	client_t *client = get_client_by_id(id);

	/* Make sure that the packet type is not out of bounds. */
	if(type < 0 || type > PACKET_COUNT - 1)
		return 0;

	handler_t handler = handlers[type];

	/* Make sure that a handler is actually registered for this packet. */
	if(handler == NULL) {
		msg_warn("No packet handler registered for packet #%d.", type);
		return 0;
	}

	/* Run the packet handling function. */
	handler(client, args);

	return 1;
}

/* Parse a packet within the specified string, sent by the specified client. */
void parse_packet(int id, char *str) {
	struct json_object *parsed_input = json_tokener_parse(str);
	int packet_type = get_packet_type(parsed_input);

	struct json_object *args_object = json_object_object_get(parsed_input, "arguments");

	/* Validate the JSON and try to handle the packet. */
	if (parsed_input == NULL || packet_type == -1 || json_object_get_type(parsed_input) != json_type_object
		|| handle_packet(id, packet_type, args_object) == 0)
			msg_warn("Client #%d sent an invalid packet.", id);

	/* Free the parsed input. */
	json_object_put(parsed_input);
}