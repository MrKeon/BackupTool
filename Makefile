NAME := backupTool
DIST := dist
BLOB := $(NAME).blob
SEA_CONFIG := sea-config.json
ENTRY := src/cli.ts

UNAME_S := $(shell uname -s)
ifeq ($(UNAME_S),Darwin)
  TARGET := macos
  BIN_NAME := $(NAME)-macos
else ifeq ($(UNAME_S),Linux)
  TARGET := linux
  BIN_NAME := $(NAME)-linux
else
  $(error Unsupported platform: $(UNAME_S))
endif

.PHONY: all clean macos linux dist

all: clean build compile blob inject-$(TARGET)

build:
	npx tsc

compile:
	echo 'require("./$(DIST)/cli.js")' > bootstrap.js

blob:
	node --experimental-sea-config $(SEA_CONFIG)

inject-macos:
	cp $(shell command -v node) $(BIN_NAME)
	npx postject $(BIN_NAME) NODE_SEA_BLOB $(BLOB) \
		--sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2 \
		--macho-segment-name NODE_SEA
	chmod +x $(BIN_NAME)

inject-linux:
	curl -sL https://nodejs.org/dist/v22.1.0/node-v22.1.0-linux-x64.tar.xz | tar -xJf -
	cp node-v22.1.0-linux-x64/bin/node $(BIN_NAME)
	npx postject $(BIN_NAME) NODE_SEA_BLOB $(BLOB) --sentinel-fuse SEA
	chmod +x $(BIN_NAME)

clean:
	rm -rf $(DIST) $(NAME)-macos $(NAME)-linux $(BLOB) bootstrap.js node-v22.1.0-linux-x64

dist:
	tar -czvf $(NAME)-$(TARGET).tar.gz $(BIN_NAME)
