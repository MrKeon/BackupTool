NAME := backupTool
DIST := dist
ENTRY := src/cli.ts
OUT := $(NAME)

.PHONY: all clean build package

all: clean build package

build:
	npx esbuild $(ENTRY) \
	  --bundle \
	  --platform=node \
	  --target=node18 \
	  --format=cjs \
	  --outfile=$(DIST)/cli.js

package:
	npx pkg $(DIST)/cli.js --output $(OUT)

clean:
	rm -rf $(DIST) $(OUT) *.tar.gz
