## Project - Table managed by URL Params use case.

Use case to apply filter management  to filter table in a project.

### Main Techs

- Table : `@tanstack/react-table`: (^8.19.2),
- Router : `@tanstack/react-router` (^1.57.10)
- State Managment : `@tanstack/query` (^5.56.2)

### Project Techs

- Language : `TypeScript` (^5.6.2)
- Web Application framework : `Vite` (^5.4.4)
- Markdown Viewer : `@uiw/react-markdown-preview` (^5.1.2)
- React i18n: `react-i18next` (^15.0.1)
- Validation : `zod` (^3.23.8)
- Styling : `tailwindcss` (^3.4.11)

- Lint : `eslint` (^8.57.0)
- Formatting : `prettier` (^3.3.3)

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
Update dependencies:

```bash

npx npm-check-updates -u

```