#include "util.h"

/* Remove all newline characters. */
void strip_newline(char *str) {
	while (*str != '\0') {
		if (*str == '\r' || *str == '\n')
			*str = '\0';

		str++;
	}
}