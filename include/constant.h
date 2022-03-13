#pragma once

/* General */
#define VERSION  "dev" /* Current server version */
#define DEF_PORT 1234  /* Default server port */
#define DEBUG    1     /* Whether to print debug messages */

/* Player */
#define NUM_CLIENTS  10   /* Maximum amount of clients connected at a time */
#define NAME_LEN_MIN  2   /* Minimum name length */
#define NAME_LEN_MAX 10   /* Maximum name length */
#define BUFFER_SIZE  2048 /* Buffer size, in bytes */

/* Game */
#define KILL_COOLDONW  5 /* How many rooms the impostor has to move through, to be able to kill someone again */
#define TASK_AMOUNT   10 /* How many tasks each player should receive */