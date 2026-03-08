# GitHub Issues Tracker

A vanilla HTML, CSS, and JavaScript project for the Assignment-05 GitHub Issues Tracker task.

## Live Data Source

This project now uses only the provided API endpoints:

- All issues: `https://phi-lab-server.vercel.app/api/v1/lab/issues`
- Single issue: `https://phi-lab-server.vercel.app/api/v1/lab/issue/{id}`
- Search issues: `https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q={searchText}`

## Demo Credentials

- Username: `admin`
- Password: `admin123`

## Features

- Figma-based login page
- Demo credential sign in
- API-only issue loading
- Search with the provided search endpoint
- `All`, `Open`, and `Closed` tabs
- 4-column issue card layout on desktop
- Responsive layout for smaller screens
- Issue details modal
- Loading state while fetching issue data

## Project Structure

- `index.html` - login page
- `issues.html` - issues dashboard
- `css/styles.css` - all styling
- `js/login.js` - login page logic
- `js/issues.js` - issue loading, filtering, search, and modal logic
- `data/app-config.json` - auth key and API base configuration

## How To Run

1. Open the project folder in your editor.
2. Run a simple local server.
3. Open `index.html`.
4. Sign in using the demo credentials.
5. Browse, search, and open issue details from the API data.

## Questions

### 1. What is the difference between `var`, `let`, and `const`?

`var` is function-scoped and it can be redeclared. `let` is block-scoped and can be reassigned, but it should not be redeclared in the same scope. `const` is also block-scoped, but it cannot be reassigned after declaration. In modern JavaScript, `let` and `const` are preferred because they are safer and more predictable.

### 2. What is the spread operator (`...`)?

The spread operator takes values from an array or object and expands them into another array, object, or function call. It is useful for copying data, merging objects, and passing multiple values easily.

### 3. What is the difference between `map()`, `filter()`, and `forEach()`?

`map()` returns a new array where every item is transformed. `filter()` returns a new array with only the items that pass a condition. `forEach()` does not build a new array; it just runs a function for each item, usually when you want a side effect like updating the UI or logging data.

### 4. What is an arrow function?

An arrow function is a shorter way to write a function in JavaScript. It is commonly used for callbacks and small utility logic. It also handles `this` differently, because it uses the surrounding lexical `this` instead of creating a new one.

### 5. What are template literals?

Template literals are strings written with backticks. They let you inject variables or expressions using `${...}` and make multiline strings easier to write.
