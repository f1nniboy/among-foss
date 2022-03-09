CC?     = cc
CFLAGS += $(shell pkg-config --cflags json-c) -Iinclude
LIBS   += $(shell pkg-config --libs json-c)
SRCS   := $(wildcard src/*.c)
BUILD   = build
NAME   := among-foss
OBJS   := $(patsubst src/%.c,build/%.o,$(SRCS))
PREFIX ?= /usr/local

.PHONY: all install uninstall clean
all: build $(NAME)

build:
	mkdir -p $(BUILD)

$(NAME): $(OBJS)
	$(CC) $(CFLAGS) -o $(BUILD)/$@ $^ $(LIBS)

build/%.o: src/%.c
	$(CC) $(CFLAGS) -c -o $@ $<

install: all
	install $(BUILD)/$(NAME) $(DESTDIR)/$(PREFIX)/bin/$(NAME)

uninstall:
	rm -f $(DESTDIR)/$(PREFIX)/bin/$(NAME)

clean:
	rm -rf build