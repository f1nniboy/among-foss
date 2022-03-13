#pragma once

#include "location.h"

enum task_id {
	TASK_CAFE_TRASH,
	TASK_CAFE_COFFEE,
	TASK_CAFE_WIRES,
	TASK_STORAGE_TRASH,
	TASK_STORAGE_WIRES,
	TASK_STORAGE_CLEAN,
	TASK_ELECTRICAL_WIRES,
	TASK_ELECTRICAL_BREAKERS,
	TASK_ADMIN_WIRES,
	TASK_ADMIN_CLEAN,
	TASK_NAVIGATION_WIRES,
	TASK_NAVIGATION_COURSE,
	TASK_NAVIGATION_HEADING,
	TASK_WEAPONS_WIRES,
	TASK_WEAPONS_CALIBRATE,
	TASK_SHIELDS_WIRES,
	TASK_SHIELDS_CALIBRATE,
	TASK_O2_WIRES,
	TASK_O2_CLEAN,
	TASK_O2_WATER,
	TASK_MEDBAY_WIRES,
	TASK_MEDBAY_SCAN,
	TASK_UPPER_CATALYZER,
	TASK_LOWER_CATALYZER,
	TASK_UPPER_COIL,
	TASK_LOWER_COIL,

	TASK_COUNT
};

/* Task structure */
typedef struct task {
	/* ID of the task */
	enum task_id id;

	/* Description of the task, without the location name */
	char *description;

	/* Location ID of the task */
	enum location_id location;
} task_t;

/* List of tasks */
extern task_t *tasks[];

/* Get a task structure by its ID. */
task_t *get_task_by_id(enum task_id id);

/* Get a task structure by its description. */
task_t *get_task_by_description(char *description);

/* Check whether all clients have completed their tasks. */
int check_tasks();

/* Assign random tasks to the specified client. */
void assign_tasks(int id);

/* Complete the specified task for the specified client.
   Returns a packet status code. */
int do_task(enum task_id task_id, int id);