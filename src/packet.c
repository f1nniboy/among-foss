#include <ctype.h>
#include <stdio.h>

#include "json.h"
#include "packet.h"
#include "constant.h"
#include "server.h"
#include "client.h"
#include "game.h"
#include "task.h"
#include "log.h"


handler_t handlers[PACKET_COUNT] = {
	[PACKET_NAME]     = packet_name,
	[PACKET_CLIENTS]  = packet_clients,
	[PACKET_COMMAND]  = packet_command,
	[PACKET_CHAT]     = packet_chat,
	[PACKET_LOCATION] = packet_location,
	[PACKET_TASK]     = packet_task,
	[PACKET_KILL]     = packet_kill
};

/* When a client sends the server their name */
void packet_name(client_t *client, struct json_object *args) {
	/* Make sure that the client hasn't set their name already. */
	if(client->stage != CLIENT_STAGE_NAME)
		return send_basic_packet(client->id, PACKET_NAME, PACKET_STATUS_AGAIN);

	/* Chosen client name */
	char *name; get_string_arg(name, "name");
	
	/* Make sure that the client specified a valid name. */
	if(name == NULL)
		return send_basic_packet(client->id, PACKET_NAME, PACKET_STATUS_INVALID);

	/* Make sure that the name is in bounds of the limits. */
	int len = strlen(name); if(len > NAME_LEN_MAX || len < NAME_LEN_MIN)
		return send_basic_packet(client->id, PACKET_NAME, PACKET_STATUS_WRONG_LENGTH);

	/* Validate the name. */
	for(int i = 0; i < strlen(name); i++)
		if(!isprint(name[i]))
			return send_basic_packet(client->id, PACKET_NAME, PACKET_STATUS_INVALID);

	/* Update the client's name and stage. */
	client->stage = CLIENT_STAGE_LOBBY;
	strcpy(client->name, name);

	msg_info("Client #%d is now known as '%s'.", client->id, client->name);

	/* Notify other clients, that the client has joined the game. */
	broadcast_client_status(client->id, PACKET_CLIENT_INFO_JOIN);
	send_basic_packet(client->id, PACKET_NAME, PACKET_STATUS_OK);

	/* Send information about tasks and locations to the client, after authenticating successfully. */
	struct json_object *data_object = json_object_new_object();

	/* Tasks */
	struct json_object *task_array = json_object_new_array();

	for (int i = 0; i < TASK_COUNT; ++i) {
		task_t *task         = get_task_by_id(i);
		location_t *location = get_location_by_id(task->location);
		
		struct json_object *task_object = json_object_new_object();

		json_object_object_add(task_object, "desc", json_object_new_string(task->description));
		json_object_object_add(task_object, "loc", json_object_new_int(location->id));

		/* Add the task to the JSON array. */
		json_object_array_put_idx(task_array, i, task_object);
	}

	/* Locations */
	struct json_object *location_array = json_object_new_array();

	for (int i = 0; i < LOC_COUNT; ++i) {
		location_t *location = get_location_by_id(i);

		struct json_object *location_object = json_object_new_object();
		struct json_object *door_array      = json_object_new_array();

		json_object_object_add(location_object, "name", json_object_new_string(location->name));

		/* Doors */
		for (int i = 0; i < location->door_count; i++) {
			enum location_id door_id = location->doors[i];
			location_t *door = get_location_by_id(door_id);

			json_object_array_put_idx(door_array, i, json_object_new_int(door->id));
		}

		/* Add the location to the JSON array. */
		json_object_object_add(location_object, "doors", door_array);
		json_object_array_put_idx(location_array, i, location_object);
	}

	json_object_object_add(data_object, "tasks", task_array);
	json_object_object_add(data_object, "locations", location_array);

	send_packet(client->id, PACKET_DATA, PACKET_STATUS_OK, data_object);
}

/* When a client requests the client list from the server */
void packet_clients(client_t *client, struct json_object *args) {
	struct json_object *client_array = json_object_new_array();

	/* Loop through all clients. */
	client_for_each(cli)
		/* Don't add the requesting client to the client list. */
		if(client->id == cli->id)
			continue;

		struct json_object *client_object = json_object_new_object();

		/* Add the client's information to the object. */
		json_object_object_add(client_object, "id", json_object_new_int(cli->id));
		json_object_object_add(client_object, "name", json_object_new_string(cli->name));

		json_object_array_add(client_array, client_object);
	}

	send_packet(client->id, PACKET_CLIENTS, PACKET_STATUS_OK, client_array);
}

/* When a client runs a command */
void packet_command(client_t *client, struct json_object *args) {
	/* Command name */
	char *name; get_string_arg(name, "name");

		/* Make sure that the client specified a valid command. */
	if(name == NULL)
		return send_basic_packet(client->id, PACKET_COMMAND, PACKET_STATUS_INVALID);

	#define is_command(str) strcmp(str, name) == 0
	#define send_response(new_status) do { status = new_status; goto end; } while(0)

	/* Status code */
	int status = PACKET_STATUS_OK;

	/* Start the game */
	if(is_command("start_game")) {
		send_response(start_game());
	}

end:
	send_basic_packet(client->id, PACKET_COMMAND, status);
	#undef is_command
}

/* When a client sends a chat message */
void packet_chat(client_t *client, struct json_object *args) {
	/* Make sure that the client is in the lobby stage. */
	if(!is_in_game(client)) {
		/* Chosen chat message */
		char *content; get_string_arg(content, "content");
		
		/* Make sure that the client specified a valid message. */
		if(content == NULL)
			return send_basic_packet(client->id, PACKET_CHAT, PACKET_STATUS_INVALID);

		/* Make sure that the message isn't empty and doesn't exceed the character limit. */
		if(strlen(content) == 0 || strlen(content) > CHAT_LEN_MAX)
			return send_basic_packet(client->id, PACKET_CHAT, PACKET_STATUS_WRONG_LENGTH);

		/* Validate the message. */
		for(int i = 0; i < strlen(content); i++)
			if(!isprint(content[i]))
				return send_basic_packet(client->id, PACKET_CHAT, PACKET_STATUS_INVALID);
				
		send_basic_packet(client->id, PACKET_CHAT, PACKET_STATUS_OK);
		msg_warn(ANSI_COLOR_BOLD "%s" ANSI_COLOR_RESET " [#%d] -> %s", client->name, client->id, content);

		struct json_object *args_object = json_object_new_object();

		json_object_object_add(args_object, "id", json_object_new_int(client->id));
		json_object_object_add(args_object, "content", json_object_new_string(content));

		/* Send the chat message to all other clients. */
		send_global_packet(client->id, PACKET_CHAT, PACKET_STATUS_OK, args_object);
	} else
		return send_basic_packet(client->id, PACKET_CHAT, PACKET_STATUS_INVALID);
}

/* When a client sets their location */
void packet_location(client_t *client, struct json_object *args) {
	/* Make sure that the client is in the game. */
	if(!is_in_game(client))
		return send_basic_packet(client->id, PACKET_LOCATION, PACKET_STATUS_NOT_IN_GAME);

	/* Location ID */
	int id; get_int_arg(id, "id");

	/* Get the specified location. */
	location_t *new_location = get_location_by_id(id);

	/* Make sure that the location is valid. */
	if(new_location == NULL)
		return send_basic_packet(client->id, PACKET_LOCATION, PACKET_STATUS_INVALID);

	/* Set the client's location. */
	int status = set_location(new_location->id, client->id);
	send_basic_packet(client->id, PACKET_LOCATION, status);

	/* Send the client information about the newly entered room. */
	if(status == PACKET_STATUS_OK) send_room_info(client->location, client->id);
}

/* When a client tries to complete a task */
void packet_task(client_t *client, struct json_object *args) {
	/* Make sure that the client is in the game. */
	if(!is_in_game(client))
		return send_basic_packet(client->id, PACKET_TASK, PACKET_STATUS_NOT_IN_GAME);

	/* Make sure that the client is not an impostor. */
	if(state->impostor_id == client->id)
		return send_basic_packet(client->id, PACKET_TASK, PACKET_STATUS_WRONG_ROLE);

	/* Task ID */
	int task_id; get_int_arg(task_id, "id");

	/* Get the task by its ID. */
	task_t *task = get_task_by_id(task_id);

	/* Make sure that a valid task was specified. */
	if(task == NULL)
		return send_basic_packet(client->id, PACKET_TASK, PACKET_STATUS_INVALID);

	/* Try to complete the specified task. */
	int status = do_task(task->id, client->id);
	send_packet_with_int_pair(client->id, PACKET_TASK, status, "id", task_id);
}

/* When an impostor tries to kill a client */
void packet_kill(client_t *client, struct json_object *args) {
	/* Make sure that the client is in the game. */
	if(!is_in_game(client))
		return send_basic_packet(client->id, PACKET_KILL, PACKET_STATUS_NOT_IN_GAME);

	/* Client to kill */
	int target_id; get_int_arg(target_id, "id");

	/* TODO: Implement */
}



/* Send a packet to the specified client ID. */
void send_packet(int id, int type, int status, struct json_object *args) {
	struct json_object *object;

	/* Create a new JSON object. */
	object = json_object_new_object();

	/* Create the type integer. */
	json_object_object_add(object, "type", json_object_new_int(type));

	/* Create the status integer. */
	json_object_object_add(object, "status", json_object_new_int(status));

	if (args != NULL)
		json_object_object_add(object, "arguments", args);

	/* Convert the JSON object into a string. */
	char *str = (char *) json_object_to_json_string_ext(object, JSON_C_TO_STRING_PLAIN);

	/* Send the packet. */
	send_msg(str, id);

	/* Free the JSON object after using it. */
	json_object_put(object);
}

/* Send a packet to all clients, except the specified sender ID. */
void send_global_packet(int id, int type, int status, struct json_object *args) {
	struct json_object *object;

	/* Create a new JSON object. */
	object = json_object_new_object();

	/* Create the type integer. */
	json_object_object_add(object, "type", json_object_new_int(type));

	/* Create the status integer. */
	json_object_object_add(object, "status", json_object_new_int(status));

	if (args != NULL)
		json_object_object_add(object, "arguments", args);

	/* Convert the JSON object into a string. */
	char *str = (char *) json_object_to_json_string_ext(object, JSON_C_TO_STRING_PLAIN);

	/* Send the packet. */
	send_global_msg(str, id);

	/* Free the JSON object after using it. */
	json_object_put(object);
}

/* Handle a packet sent by the specified client. */
int handle_packet(int id, int type, struct json_object *args) {
	client_t *client = get_client_by_id(id);

	/* Make sure that the packet type is not out of bounds. */
	if(type < 0 || type > PACKET_COUNT - 1)
		return 0;

	/* Don't handle any packets except the NAME packet for clients,
	   who have not authenticated yet. */
	if(client->stage == CLIENT_STAGE_NAME && type != PACKET_NAME)
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