#pragma once

enum location_id {
	LOC_CAFETERIA,
	LOC_REACTOR,
	LOC_UPPER_ENGINE,
	LOC_LOWER_ENGINE,
	LOC_SECURITY,
	LOC_MEDBAY,
	LOC_ELECTRICAL,
	LOC_STORAGE,
	LOC_ADMIN,
	LOC_COMMUNICATIONS,
	LOC_O2,
	LOC_WEAPONS,
	LOC_SHIELDS,
	LOC_NAVIGATION,

	LOC_COUNT
};

/* Location structure */
typedef struct location {
	/* ID of the location */
	enum location_id id;

	/* Name of the location */
	char *name;

	/* Door information */
	enum location_id doors[LOC_COUNT];
	int door_count;
} location_t;

/* List of locations */
extern location_t *locations[];

/* Get a location structure by its ID. */
location_t *get_location_by_id(enum location_id id);

/* Get a location structure by its name. */
location_t *get_location_by_name(char *name);

/* Send the room information to the specified client. */
void send_room_info(enum location_id location_id, int id);

/* Notify other clients in the specified room about the specified client
   entering or leaving the room. */
void notify_movement(enum location_id location_id, int state, int id);

/* Check whether the movement from @old_location to @new_location is possible using doors. */
int check_doors(enum location_id old_id, enum location_id new_id);

/* Set the location of a player.
   Returns a packet status code. */
int set_location(enum location_id location_id, int id);