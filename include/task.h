#pragma once

#include "location.h"

enum task_id {
	TASK_TEST1,
	TASK_TEST2,

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

/* Assign random tasks to the specified client. */
void assign_tasks(int id);

/* Complete the specified task for the specified client.
   Returns a packet status code. */
int do_task(enum task_id task_id, int id);