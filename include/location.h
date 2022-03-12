#pragma once

enum location_id {
	LOC_CAFETERIA,
	LOC_WEAPONS,
	LOC_MEDBAY,

	LOC_COUNT
};

/* Location structure */
typedef struct location {
	/* Name of the location */
	char *name;

	/* Door information */
	enum location_id doors[LOC_COUNT];
	int door_count;
} location_t;

/* List of locations */
extern location_t *locations[];

/* Get a location ID by its case-insensitive name. */
enum location_id get_location_by_name(char *name);

/* Send the room information to the specified client. */
void send_room_info(enum location_id location, int id);

/* Set the location of a client. */
void set_client_location(enum location_id location, int id);