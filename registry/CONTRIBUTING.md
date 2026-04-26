# Contributing a Plugin to OpenDeck

Anyone can publish an OpenDeck plugin by submitting a pull request to this registry.

## Requirements

Your plugin must:

1. **Be a public Git repository** (GitHub, Codeberg, etc.)
2. **Have a `manifest.json`** in the plugin root following the [OpenDeck plugin format](#plugin-format)
3. **Have an `index.js`** that exports an `actions` object
4. **Work with the OpenDeck module-loader** — see the SDK section below

## Plugin Format

### `manifest.json`

```json
{
    "name": "my-plugin",
    "version": "1.0.0",
    "description": "What this plugin does",
    "actions": ["myplugin.doThing", "myplugin.doOtherThing"],
    "actionDetails": {
        "myplugin.doThing": {
            "description": "Does a thing",
            "params": {
                "paramName": "Description of this parameter"
            }
        }
    }
}
```

### `index.js`

```js
module.exports = {
    actions: {
        "myplugin.doThing": async (payload) => {
            const { paramName } = payload || {}
            // your logic here
        },
        "myplugin.doOtherThing": async (payload) => {
            // your logic here
        }
    }
}
```

**Rules:**
- Action IDs must be namespaced: `pluginname.actionName`
- Action handlers receive `payload` (object from button config) and must return a Promise
- The `__variables` key on payload contains the user's global variables
- If your plugin has npm dependencies, include a `package.json` and document that users need to run `npm install` in the plugin folder after installation

## Submitting to the Registry

Edit [`registry.json`](./registry.json) and add an entry to the `plugins` array:

```json
{
    "id": "my-plugin",
    "name": "My Plugin",
    "description": "Short description (1–2 sentences)",
    "author": "YourGitHubUsername",
    "version": "1.0.0",
    "tags": ["tag1", "tag2"],
    "repo": "https://github.com/you/my-opendeck-plugin",
    "cloneUrl": "https://github.com/you/my-opendeck-plugin.git",
    "homepage": "https://github.com/you/my-opendeck-plugin",
    "license": "MIT"
}
```

If the plugin folder is not at the repo root, add:

```json
"subdirectory": "path/to/plugin-folder"
```

Then open a pull request. The maintainers will review for:
- Working `manifest.json` and `index.js`
- No malicious code
- Reasonable description and tags

## Plugin ID Rules

- Must match the folder name that gets placed in the user's `modules/` directory
- Only alphanumeric characters, hyphens, and underscores: `[a-zA-Z0-9_-]`
- Must be unique across the registry
