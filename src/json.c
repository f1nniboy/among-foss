#include "json.h"

/* Check whether the specified object is valid JSON. */
int is_valid_json(struct json_object *object) {
	return !json_object_is_type(object, json_type_null);
}

/* Get the type of a packet. */
int get_packet_type(struct json_object *object) {
	struct json_object *type_object;
	int type;

	json_object_object_get_ex(object, "type", &type_object);

	if (!is_valid_json(object) || !json_object_is_type(type_object, json_type_int))
		return -1;

	type = json_object_get_int(type_object);
	return type;
}