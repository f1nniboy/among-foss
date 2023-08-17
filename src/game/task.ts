import { LocationID } from "./location.ts";

export type TaskName = string

export interface Task {
    /** Description of the task */
    desc: string;

	/* Locations where this task is */
	loc: LocationID[];
}

/** Choose X random tasks from the specified list. */
export const randomTasks = (tasks: Record<TaskName, Task>, amount: number): Record<string, boolean> => {
    const taskKeys = Object.keys(tasks);
    const result: Record<string, boolean> = {};

    for (let i = 0; i < amount; i++) {
        const randomTaskIndex = Math.floor(Math.random() * taskKeys.length);
        const randomTaskKey = taskKeys[randomTaskIndex];
        const randomTask = tasks[randomTaskKey];

        /* Choose a random location from the task's locations. */
        const randomLocationIndex = Math.floor(Math.random() * randomTask.loc.length);
        const randomLocation = randomTask.loc[randomLocationIndex];

        /* Add the task to the result. */
        result[`${randomLocation}:${randomTaskKey}`] = false;

        /* Swap the chosen task with the last task in the array. */
        taskKeys[randomTaskIndex] = taskKeys[taskKeys.length - 1];
        taskKeys.pop();
    }

    return result;
}