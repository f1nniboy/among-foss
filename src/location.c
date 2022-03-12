#include "constant.h"
#include "client.h"
#include "server.h"
#include "location.h"
#include "packet.h"

/* List of locations */
location_t *locations[] = {
	&(location_t) { LOC_CAFETERIA, "Cafeteria", { LOC_WEAPONS, LOC_MEDBAY }, 3 },
	&(location_t) { LOC_WEAPONS,   "Weapons",   { LOC_CAFETERIA }, 1 },
	&(location_t) { LOC_MEDBAY,    "MedBay",    { LOC_CAFETERIA }, 1 },
	/* TODO: Complete */
};

/* Get a location structure by its ID. */
location_t *get_location_by_id(enum location_id id) {
	for(int i = 0; i < LOC_COUNT; ++i) {
		location_t *location = locations[i];
		if(location->id == id) return location;
	}

	return NULL;
}

/* Get a location structure by its case-insensitive name. */
location_t *get_location_by_name(char *name) {
	for(int i = 0; i < LOC_COUNT; ++i) {
		location_t *location = get_location_by_id(i);

		/* Continue with the next location, if it doesn't exist. */
		if(location == NULL)
			continue;

		/* If the name matches, return the location ID. */
		if(strcmp(name, location->name) == 0)
			return location;
	}

	return NULL;
}

/* Send the room information to the specified client. */
void send_room_info(enum location_id location_id, int id) {
	client_t *client = get_client_by_id(id);

	/* Check whether the client is in the game and a game is currently running. */
	if(client->state != CLIENT_STATE_MAIN || client->state != CLIENT_STATE_MAIN)
		return send_basic_packet(id, PACKET_ROOM_INFO, PACKET_STATUS_NOT_IN_GAME); 

	location_t *location = get_location_by_id(location_id);
	struct json_object *args = json_object_new_object();

	struct json_object *client_args = json_object_new_array();
	struct json_object *body_args   = json_object_new_array();
	struct json_object *doors_args   = json_object_new_array();

	/* Room name */
	json_object_object_add(args, "name", json_object_new_string(location->name));

	/* Doors */
	/* TODO: Implement */

	/* Alive clients */
	client_for_each(cli)
		if(cli->alive)
			json_object_object_add(client_args, "id", json_object_new_int(cli->id));
	}

	/* Dead clients */
	client_for_each(cli)
		if(!cli->alive)
			json_object_object_add(body_args, "id", json_object_new_int(cli->id));
	}

	json_object_object_add(args, "clients", client_args);
	json_object_object_add(args, "bodies", body_args);

	/* Send the packet. */
	send_packet(id, PACKET_ROOM_INFO, PACKET_STATUS_OK, args);
}

/* Check whether the movement from @old_location to @new_location is possible using doors. */
int check_doors(enum location_id old_id, enum location_id new_id) {
	/* TODO: Implement */
	return 1;
}