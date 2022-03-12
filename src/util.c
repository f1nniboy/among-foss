#include "util.h"
#include <stdlib.h>

/* Remove all newline characters. */
void strip_newline(char *str) {
	while (*str != '\0') {
		if (*str == '\r' || *str == '\n')
			*str = '\0';

		str++;
	}
}

/* Generate a random number. */
int random_num(int min, int max) {
	return (rand() % (max - min + 1)) + min;
}