#include <stdio.h>
#include <string.h>

#include "location.h"
#include "constant.h"
#include "client.h"
#include "server.h"
#include "packet.h"
#include "task.h"
#include "game.h"
#include "util.h"
#include "log.h"

/* List of tasks */
task_t *tasks[] = {
	&(task_t) { TASK_CAFE_TRASH,  "Empty trash", LOC_CAFETERIA },
	&(task_t) { TASK_CAFE_COFFEE, "Start the coffee maker", LOC_CAFETERIA },
	&(task_t) { TASK_CAFE_WIRES, "Fix wiring", LOC_CAFETERIA },

	&(task_t) { TASK_STORAGE_TRASH, "Empty the trash chute", LOC_STORAGE },
	&(task_t) { TASK_STORAGE_WIRES, "Fix wiring", LOC_STORAGE },
	&(task_t) { TASK_STORAGE_CLEAN, "Clean the floor", LOC_STORAGE },

	&(task_t) { TASK_ELECTRICAL_WIRES, "Fix wiring", LOC_ELECTRICAL },
	&(task_t) { TASK_ELECTRICAL_BREAKERS, "Reset breakers", LOC_ELECTRICAL },
	
	&(task_t) { TASK_ADMIN_WIRES, "Fix wiring", LOC_ADMIN },
	&(task_t) { TASK_ADMIN_CLEAN, "Clean the floor", LOC_ADMIN },

	&(task_t) { TASK_NAVIGATION_WIRES, "Fix wiring", LOC_NAVIGATION },
	&(task_t) { TASK_NAVIGATION_COURSE, "Adjust course", LOC_NAVIGATION },
	&(task_t) { TASK_NAVIGATION_HEADING, "Check headings", LOC_NAVIGATION },

	&(task_t) { TASK_WEAPONS_WIRES, "Fix wiring", LOC_WEAPONS },
	&(task_t) { TASK_WEAPONS_CALIBRATE, "Calibrate targeting system", LOC_WEAPONS },

	&(task_t) { TASK_SHIELDS_WIRES, "Fix wiring", LOC_SHIELDS },
	&(task_t) { TASK_SHIELDS_CALIBRATE, "Calibrate shields", LOC_SHIELDS },

	&(task_t) { TASK_O2_WIRES, "Fix wiring", LOC_O2 },
	&(task_t) { TASK_O2_CLEAN, "Clean oxygen filter", LOC_O2 },
	&(task_t) { TASK_O2_WATER, "Water plants", LOC_O2 },

	&(task_t) { TASK_MEDBAY_WIRES, "Fix wiring", LOC_MEDBAY },
	&(task_t) { TASK_MEDBAY_SCAN, "Scan", LOC_MEDBAY },

	&(task_t) { TASK_UPPER_CATALYZER, "Check catalyzer", LOC_UPPER_ENGINE },
	&(task_t) { TASK_UPPER_COIL, "Replace compression coil", LOC_UPPER_ENGINE },

	&(task_t) { TASK_LOWER_CATALYZER, "Check catalyzer", LOC_LOWER_ENGINE },
	&(task_t) { TASK_LOWER_COIL, "Replace compression coil", LOC_LOWER_ENGINE }
};

/* Get a task structure by its ID. */
task_t *get_task_by_id(enum task_id id) {
	for(int i = 0; i < TASK_COUNT; ++i) {
		task_t *task = tasks[i];
		if(task->id == id) return task;
	}

	return NULL;
}

/* Check whether all clients have completed their tasks. */
int check_tasks() {
	client_for_each(client)
		/* Skip the impostor and dead players. */
		if(!client->alive || state->impostor_id == client->id)
			continue;

		/* Loop through the client's tasks. */
		for(int i = 0; i < TASK_AMOUNT; ++i) {
			if(!client->tasks_done[i])
				return 0;
		}
	}

	return 1;
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

		location_t *location = get_location_by_id(task->location);
		json_object_array_add(args, json_object_new_int(task_id));
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