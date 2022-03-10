#include "json.h"
#include "packet.h"
#include "constant.h"
#include "client.h"
#include "log.h"

handler_t handlers[256] = {
	[PACKET_INFO] = packet_info
};

void packet_info(int sender_id, struct json_object *args) {
	msg_info("Example");
}

/* Handle a packet sent by the specified client. */
int handle_packet(int id, int type, struct json_object *args) {
	client_t *client = get_client_by_id(id);

	/* Make sure that the packet type is not out of bounds. */
	if(type < 0 || type > PACKET_COUNT - 1)
		return 0;
	
	/* Run the packet handling function. */
	handler_t handler = handlers[type];
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