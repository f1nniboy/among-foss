#include "log.h"

/* Log a message to the console with the specified color. */
void msg_log(char *color, char *fmt, ...) {
	va_list args;
	va_start(args, fmt);

	printf("%s" ANSI_COLOR_BOLD LOG_PREFIX ANSI_COLOR_RESET " ", color);
	vprintf(fmt, args);
	printf("\n");

	va_end(args);
}