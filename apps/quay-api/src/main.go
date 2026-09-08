package main

import (
	"log"

	"quayapi/src/fireweave"
)

// Entrypoint — composition only.
func main() {
	if err := fireweave.InitFwHarness(); err != nil {
		log.Fatal(err)
	}
	listen("quay-api", 3000, false)
}
