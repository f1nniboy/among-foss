#include "constant.h"
#include "client.h"
#include "server.h"
#include "location.h"
#include "game.h"
#include "packet.h"
#include "log.h"

/* List of locations */
location_t *locations[] = {
	&(location_t) { LOC_CAFETERIA,      "Cafeteria",      { LOC_MEDBAY, LOC_ADMIN, LOC_WEAPONS                         }, 3 },
	&(location_t) { LOC_REACTOR,        "Reactor",        { LOC_UPPER_ENGINE, LOC_SECURITY, LOC_LOWER_ENGINE           }, 3 },
	&(location_t) { LOC_UPPER_ENGINE,   "Upper Engine",   { LOC_REACTOR, LOC_SECURITY, LOC_MEDBAY                      }, 3 },
	&(location_t) { LOC_LOWER_ENGINE,   "Lower Engine",   { LOC_REACTOR, LOC_SECURITY, LOC_ELECTRICAL                  }, 3 },
	&(location_t) { LOC_SECURITY,       "Security",       { LOC_UPPER_ENGINE, LOC_LOWER_ENGINE, LOC_REACTOR            }, 3 },
	&(location_t) { LOC_MEDBAY,         "MedBay",         { LOC_UPPER_ENGINE, LOC_CAFETERIA                            }, 2 },
	&(location_t) { LOC_ELECTRICAL,     "Electrical",     { LOC_LOWER_ENGINE, LOC_STORAGE                              }, 2 },
	&(location_t) { LOC_STORAGE,        "Storage",        { LOC_ELECTRICAL, LOC_ADMIN, LOC_COMMUNICATIONS, LOC_SHIELDS }, 4 },
	&(location_t) { LOC_ADMIN,          "Admin",          { LOC_CAFETERIA, LOC_STORAGE                                 }, 2 },
	&(location_t) { LOC_COMMUNICATIONS, "Communications", { LOC_STORAGE, LOC_SHIELDS                                   }, 2 },
	&(location_t) { LOC_O2,             "O2",             { LOC_SHIELDS, LOC_WEAPONS, LOC_NAVIGATION                   }, 3 },
	&(location_t) { LOC_WEAPONS,        "Weapons",        { LOC_CAFETERIA, LOC_O2, LOC_NAVIGATION                      }, 3 },
	&(location_t) { LOC_SHIELDS,        "Shields",        { LOC_STORAGE, LOC_COMMUNICATIONS, LOC_O2, LOC_NAVIGATION    }, 4 },
	&(location_t) { LOC_NAVIGATION,     "Navigation",     { LOC_WEAPONS, LOC_O2, LOC_SHIELDS                           }, 3 }
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
	if(client->state != CLIENT_STATE_MAIN || state->state != GAME_STATE_MAIN)
		return send_basic_packet(id, PACKET_ROOM_INFO, PACKET_STATUS_NOT_IN_GAME); 

	location_t *location = get_location_by_id(location_id);
	struct json_object *args = json_object_new_object();

	struct json_object *client_array = json_object_new_array();
	struct json_object *door_array   = json_object_new_array();

	/* Room name */
	json_object_object_add(args, "name", json_object_new_string(location->name));

	/* Doors */
	for (int i = 0; i < location->door_count; i++) {
		enum location_id door_id = location->doors[i];
		location_t *door = get_location_by_id(door_id);

		json_object_array_add(door_array, json_object_new_string(door->name));
	}

	/* Clients */
	client_for_each(cli)
		/* Don't add the client, which requested the room information, to the list.
		   Also don't add clients, which are not actually in the room, to the list. */
		if(cli->id == id || cli->location != location_id) continue;

		struct json_object *client_info = json_object_new_object();

		json_object_object_add(client_info, "id", json_object_new_int(cli->id));
		json_object_object_add(client_info, "alive", json_object_new_boolean(cli->alive));

		json_object_array_add(client_array, client_info);
	}
	
	json_object_object_add(args, "doors", door_array);
	json_object_object_add(args, "clients", client_array);

	/* Send the packet. */
	send_packet(id, PACKET_ROOM_INFO, PACKET_STATUS_OK, args);
}

/* Notify other clients in the specified room about the specified client
   entering or leaving the room. */
void notify_movement(enum location_id location_id, int state, int id) {
	client_for_each(cli)
		/* Don't send the packet to clients, which are not in the room. */
		if((state == PACKET_CLIENT_INFO_ROOM_ENTER && cli->location != location_id) || cli->id == id)
			return;

		struct json_object *client_object = json_object_new_object();

		/* Add the client's information to the object. */
		json_object_object_add(client_object, "id", json_object_new_int(cli->id));
		json_object_object_add(client_object, "name", json_object_new_string(cli->name));

		/* Send the packet to the client. */
		send_packet(cli->id, PACKET_CLIENT_INFO, state, client_object);
	}
}

/* Check whether the movement from @old_location to @new_location is possible using doors. */
int check_doors(enum location_id old_id, enum location_id new_id) {
	location_t *old_location = get_location_by_id(old_id);
	if(old_location == NULL) return 1;

	for (int i = 0; i < old_location->door_count; i++) {
		enum location_id door_id = old_location->doors[i];

		/* Check if the door is adjacent to the new location. */
		if(door_id == new_id)
			return 1;
	}

	return 0;
}

/* Set the location of a player.
   Returns a packet status code. */
int set_location(enum location_id location_id, int id) {
	client_t *client = get_client_by_id(id);

	/* Make sure that the client doesn't set the location to the same ID twice. */
	if(client->location == location_id)
		return PACKET_STATUS_AGAIN;

	/* Check whether the movement is possible using the adjacent doors. */
	if(!check_doors(client->location, location_id))
		return PACKET_STATUS_INVALID;

	/* Old client location */
	location_t *old_location = get_location_by_id(client->location);

	/* Set the client's location. */
	client->location = location_id;

	/* Notify other clients in the room. */
	if(old_location != NULL) notify_movement(old_location->id, PACKET_CLIENT_INFO_ROOM_LEAVE, id);
	notify_movement(location_id, PACKET_CLIENT_INFO_ROOM_ENTER, id);

	return PACKET_STATUS_OK;
}