#pragma once

#include <json-c/json.h>

/* Check whether the specified object is valid JSON. */
int is_valid_json(struct json_object *object);

/* Get the type of a packet. */
int get_packet_type(struct json_object *object);