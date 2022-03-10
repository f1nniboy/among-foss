#include "json.h"
#include "packet.h"
#include "constant.h"
#include "client.h"
#include "log.h"

handler_t handlers[PACKET_COUNT] = {
	[PACKET_NAME] = packet_name
};

/* When a client sends the server their name */
void packet_name(int sender_id, struct json_object *args) {
	msg_info("Example");
	send_basic_packet(sender_id, PACKET_NAME, 123);
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
		msg_warn("No packet handler registered for packet #%d.", id);
		return 0;
	}

	/* Run the packet handling function. */
	handler(id, args);

	return 1;
}

/* Parse a packet within the specified string, sent by the specified client. */
void parse_packet(int id, char *str) {
	struct json_object *parsed_input = json_tokener_parse(str);
	int packet_type = get_packet_type(parsed_input);

	struct json_object *args_object = json_object_object_get(parsed_input, "arguments");

	/* Validate the JSON and try to handle the packet. */
	if (parsed_input == NULL || args_object == NULL || packet_type == -1 || json_object_get_type(parsed_input) != json_type_object
		|| handle_packet(id, packet_type, parsed_input) == 0)
			msg_warn("Client #%d sent an invalid packet.", id);

	/* Free the parsed input. */
	json_object_put(parsed_input);
}