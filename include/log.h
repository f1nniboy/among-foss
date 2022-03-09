#pragma once

#define ANSI_COLOR_BLUE   "\x1b[94m"
#define ANSI_COLOR_YELLOW "\x1b[93m"
#define ANSI_COLOR_RED    "\x1b[91m"
#define ANSI_COLOR_BOLD   "\x1b[1m"
#define ANSI_COLOR_RESET  "\x1b[0m"

#define LOG_PREFIX ">>>"

/* Log a message to the console with the specified color. */
void msg_log(char *color, char *fmt, ...);

#define msg_info(...) msg_log(ANSI_COLOR_BLUE, __VA_ARGS__)
#define msg_warn(...) msg_log(ANSI_COLOR_YELLOW, __VA_ARGS__)
#define msg_err(...)  msg_log(ANSI_COLOR_RED, __VA_ARGS__)

/* Print the specified message and shut down the server. */
#define msg_die(...)          \
	do {                      \
		msg_err(__VA_ARGS__); \
		stop_server();        \
	} while (0)