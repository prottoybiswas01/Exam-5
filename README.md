# Assignment-05: GitHub Issues Tracker

This is a responsive GitHub Issues Tracker built with **HTML, CSS, and Vanilla JavaScript**.

## Live Features

- Login page with default credential check
- Protected issue dashboard (redirects to login if not signed in)
- API-based issue loading
- Tab filter: `All`, `Open`, `Closed`
- Search functionality using API endpoint
- 4-column issue card layout on desktop (responsive on smaller devices)
- Card top border color by status:
  - Open: green
  - Closed: purple
- Loading spinner during API requests
- Active tab state
- Issue details modal using single issue endpoint

## Demo Credentials

- Username: `admin`
- Password: `admin123`

## API Endpoints Used

- All Issues: `https://phi-lab-server.vercel.app/api/v1/lab/issues`
- Single Issue: `https://phi-lab-server.vercel.app/api/v1/lab/issue/{id}`
- Search Issue: `https://phi-lab-server.vercel.app/api/v1/lab/issues/search?q={searchText}`

## Run Locally

1. Open this project in VS Code.
2. Run with Live Server (or any static server).
3. Open `index.html`.
4. Log in using the demo credentials.

## Suggested 8 Meaningful Commits

1. `feat: scaffold login and issue tracker pages with base layout`
2. `style: implement figma-inspired responsive UI for login and dashboard`
3. `feat: add credential-based login with localStorage session guard`
4. `feat: integrate all issues API with loading spinner and error state`
5. `feat: add all/open/closed tab filtering with active state and counters`
6. `feat: implement search endpoint integration and filtered rendering`
7. `feat: add issue detail modal using single issue API endpoint`
8. `docs: write README setup guide and JavaScript concept answers`

## Short JS Theory Answers

### 1) What is the difference between var, let, and const?

- `var` is function-scoped and can be redeclared, which can lead to accidental bugs.
- `let` is block-scoped and can be reassigned, but cannot be redeclared in the same scope.
- `const` is block-scoped and cannot be reassigned after declaration. It is best for values that should stay fixed.

### 2) What is the spread operator (...)?

The spread operator expands values from arrays, objects, or iterables.  
It is useful for copying, merging, and passing multiple values quickly.

Example:

```js
const a = [1, 2];
const b = [...a, 3]; // [1, 2, 3]
```

### 3) What is the difference between map(), filter(), and forEach()?

- `map()` creates a **new array** by transforming each item.
- `filter()` creates a **new array** with only items that pass a condition.
- `forEach()` loops through items but **does not return a new array**.

### 4) What is an arrow function?

An arrow function is a shorter syntax for writing functions in JavaScript.  
It also keeps `this` from the surrounding scope, which is helpful in callbacks.

Example:

```js
const sum = (a, b) => a + b;
```

### 5) What are template literals?

Template literals are strings written with backticks (`` ` ``).  
They allow variable interpolation with `${...}` and support multi-line strings.

Example:

```js
const name = "Admin";
const text = `Welcome, ${name}!`;
```
