# Among FOSS
A recreation of **Among Us**, but as a *multiplayer text adventure* instead of a *graphical client*.

## Building
### Dependencies
`json-c` ➔ *Parsing and sending of JSON messages*

### Compilation
Run `make` to compile the program.

### Installation
Run `make install` to install the program.

### Running
```shell-session
$ ./build/among-foss
```

This will *start a server* on the port `1234`. After the server has started, players may connect to it.

## Clients
**[Raniconduh/sus-ui](https://github.com/Raniconduh/sus-ui)** ➔ *TUI client*