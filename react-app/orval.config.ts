import { defineConfig } from "orval";

export default defineConfig({
  openbase: {
    input: {
      target: "./openapi.json",
    },
    output: {
      mode: "tags-split",
      target: "src/api/generated/openbase.ts",
      schemas: "src/api/generated/models",
      client: "fetch",
      clean: true,
      override: {
        mutator: {
          path: "src/api/fetch-client.ts",
          name: "openbaseFetch",
        },
      },
    },
  },
});
