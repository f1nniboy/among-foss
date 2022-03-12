#include "constant.h"
#include "client.h"
#include "location.h"

/* List of locations */
location_t *locations[] = {
	[LOC_CAFETERIA] = &(location_t) { "Cafeteria", { LOC_WEAPONS, LOC_MEDBAY }, 3 },
	[LOC_WEAPONS]   = &(location_t) { "Weapons",   { LOC_CAFETERIA }, 1 },
	[LOC_MEDBAY]    = &(location_t) { "MedBay",    { LOC_CAFETERIA }, 1 },
	/* TODO: Complete */
};

/* Get a location ID by its case-insensitive name. */
enum location_id get_location_by_name(char *name) {
	/* TODO: Implement */
	return -1;
}

/* Send the room information to the specified client. */
void send_room_info(enum location_id location, int id) {
	/* TODO: Implement */
}

/* Set the location of a client. */
void set_client_location(enum location_id location, int id) {
	/* TODO: Implement */
}