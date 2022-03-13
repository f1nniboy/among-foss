#include <stdio.h>
#include <string.h>

#include "location.h"
#include "constant.h"
#include "client.h"
#include "packet.h"
#include "task.h"
#include "game.h"
#include "util.h"
#include "log.h"

/* List of tasks */
task_t *tasks[] = {
	&(task_t) { TASK_TEST1, "Test 1", LOC_CAFETERIA },
	&(task_t) { TASK_TEST2, "Test 2", LOC_MEDBAY    }
};

/* Get a task structure by its ID. */
task_t *get_task_by_id(enum task_id id) {
	for(int i = 0; i < TASK_COUNT; ++i) {
		task_t *task = tasks[i];
		if(task->id == id) return task;
	}

	return NULL;
}

/* Get a task structure by its description. */
task_t *get_task_by_description(char *description) {
	for(int i = 0; i < LOC_COUNT; ++i) {
		task_t *task = get_task_by_id(i);

		/* Continue with the next task, if it doesn't exist. */
		if(task == NULL)
			continue;

		/* If the description matches, return the task structure. */
		if(strcmp(description, task->description) == 0)
			return task;
	}

	return NULL;
}

/* Assign random tasks to the specified client. */
void assign_tasks(int id) {
	/* Don't assign tasks to an impostor. */
	if(state->impostor_id == id)
		return;

	struct json_object *args = json_object_new_array();

	client_t *client = get_client_by_id(id);
	int task_id = -1;

	/* Initialize or clean up the clients's task list. */
	for(int i = 0; i < TASK_AMOUNT; ++i) {
		client->tasks[i] = -1;
		client->tasks_done[i] = 0;
	}
	
	for(int i = 0; i < TASK_AMOUNT; ++i) {
retry:
		task_id = random_num(0, TASK_COUNT - 1);

		for(int j = 0; j < TASK_AMOUNT; ++j) {
			/* Check whether the task has already been assigned. */
			if(client->tasks[i] != -1 || client->tasks[j] == task_id)
				goto retry;
		}

		task_t *task = get_task_by_id(task_id);

		/* Assign the task. */
		client->tasks[i] = task_id;

		struct json_object *task_object = json_object_new_object();

		json_object_object_add(task_object, "description", json_object_new_string(task->description));
		json_object_object_add(task_object, "location", json_object_new_int(task->location));

		/* Add the task to the JSON array. */
		json_object_array_add(args, task_object);
	}

	/* Send the packet. */
	send_packet(id, PACKET_TASKS, PACKET_STATUS_OK, args);
}

/* Complete the specified task for the specified client.
   Returns a packet status code. */
int do_task(enum task_id task_id, int id) {
	client_t *client = get_client_by_id(id);
	int task_index = -1;

	/* Find the corresponding task. */
	for(int i = 0; i < TASK_AMOUNT; ++i) {
		if(client->tasks[i] == task_id) {
			task_index = i;
			break;
		}
	}

	/* Check whether the client has actually been assigned the specified task. */
	if(task_index == -1)
		return PACKET_STATUS_INVALID;

	/* Check whether the client has already completed the task. */
	if(client->tasks_done[task_index])
		return PACKET_STATUS_AGAIN;

	task_t *task = get_task_by_id(task_id);

	/* Check whether the client is in the correct location. */
	if(client->location != task->location)
		return PACKET_STATUS_WRONG_LOCATION;

	/* Complete the task. */
	client->tasks_done[task_index] = 1;

	/* Check whether the crewmates have won. */
	check_game();

	return PACKET_STATUS_OK;
}