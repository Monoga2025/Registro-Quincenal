# lib

Shared workspace packages used by the apps in `artifacts/`.

- `db/`: Drizzle ORM schema and database client
- `api-spec/`: OpenAPI specification and codegen config
- `api-zod/`: Zod schemas generated from the spec
- `api-client-react/`: Generated React API client

Regenerate the generated packages after changing `api-spec/openapi.yaml`.
