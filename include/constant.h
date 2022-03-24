#pragma once

/* General */
#define VERSION  "dev" /* Current server version */
#define DEF_PORT 1234  /* Default server port */

/* Client */
#define NUM_CLIENTS    10 /* Maximum amount of clients connected at a time */
#define NAME_LEN_MIN    2 /* Minimum name length */
#define NAME_LEN_MAX   10 /* Maximum name length */
#define BUFFER_SIZE  2048 /* Buffer size, in bytes */
#define CHAT_LEN_MAX  100 /* Maximum chat message length */

/* Game */
#define KILL_COOLDONW  5 /* How many rooms the impostor has to move through, to be able to kill someone again */
#define TASK_AMOUNT   10 /* How many tasks each player should receive */