# GitHub Issues Tracker

A small vanilla HTML, CSS, and JavaScript project for browsing GitHub-style issues from the `phi-lab` assignment API. The app includes a login screen, issue filtering tabs, server-backed search, loading states, and an issue details modal.

## Demo Credentials

- Username: `admin`
- Password: `admin123`

## API Endpoints

- All issues: `https://phi-lab-server.vercel.app/api/v1/lab/issues`
- Single issue: `https://phi-lab-server.vercel.app/api/v1/lab/issue/{id}`
- Search issues: `https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q={searchText}`

## Features

- Figma-inspired login page with demo credential support
- Local auth gate using `localStorage`
- Issues dashboard with `All`, `Open`, and `Closed` tabs
- 4-column desktop card layout with responsive collapse on smaller screens
- Green top border for open issues and purple top border for closed issues
- Loading spinner while issues are being fetched
- Search powered by the assignment search endpoint with local fallback
- Modal for viewing full issue details

## Project Structure

- `index.html`: login page
- `issues.html`: issues listing page
- `css/styles.css`: all page styling
- `js/login.js`: login page logic
- `js/issues.js`: issues page logic
- `data/app-config.json`: configurable auth and API values
- `data/issues.json`: local fallback issue dataset

## How to Run

1. Clone or download the project.
2. Open the folder in VS Code or any editor.
3. Start a simple local server.
4. Open `index.html`.
5. Sign in with the demo credentials.

If the live API is unavailable, the app can still use `data/issues.json` as a fallback source.

## Answers

### 1. What is the difference between `var`, `let`, and `const`?

`var` is the old way to declare variables in JavaScript. It is function-scoped, which means it does not respect block scope like `if` or `for`. `let` is block-scoped, so it stays limited to the block where it was created. `const` is also block-scoped, but it cannot be reassigned after the first value is set. In modern JavaScript, `let` and `const` are preferred because they are easier to reason about and reduce accidental bugs.

### 2. What is the spread operator (`...`)?

The spread operator takes the values inside an array or object and spreads them out into another place. It is useful when copying arrays, merging objects, or passing many values into a function. It helps write shorter code and avoids mutating the original data in many cases.

### 3. What is the difference between `map()`, `filter()`, and `forEach()`?

`map()` creates a new array by changing every item from the original array. `filter()` creates a new array too, but only keeps the items that match a condition. `forEach()` does not return a transformed array for reuse; it just runs some code for each item, usually when you want a side effect like logging or updating the DOM.

### 4. What is an arrow function?

An arrow function is a shorter syntax for writing functions in JavaScript. It is often used for callbacks because it is concise and easier to read in small pieces of logic. One important difference is that arrow functions do not create their own `this`; they use the surrounding `this` value instead.

### 5. What are template literals?

Template literals are strings written with backticks instead of quotes. They let you insert variables or expressions directly into a string using `${...}`. They are also useful for writing multiline strings without using `+` over and over again.
