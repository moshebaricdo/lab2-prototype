
  # (TEMPLATE) Web Lab 2 Prototype

  This is a code bundle for (TEMPLATE) Web Lab 2 Prototype. The original project is available at https://www.figma.com/design/AV32I61a6IN2dUxRBX8ODX/-TEMPLATE--Web-Lab-2-Prototype.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Design Tokens

  Run `npm run token:generate` to regenerate `src/styles/tokens.css` from semantic token JSON.

  The command resolves token files in this order:
  - `WL2_LIGHT_TOKENS_PATH` / `WL2_DARK_TOKENS_PATH` environment variables
  - `tokens/semantic/light.tokens.json` and `tokens/semantic/dark.tokens.json`
  - the original desktop export paths used during migration
  