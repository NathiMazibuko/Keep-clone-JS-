# Google Keep Clone

A pixel-accurate clone of Google Keep built with semantic HTML5, modern CSS3, and modular Vanilla JavaScript. Features full CRUD capability, light/dark themes, responsive layout, and client-side data persistence.

---

## Features

- **Full CRUD Operations:**
  - **Create:** Expandable note creation box with title, body, and pin options.
  - **Read:** Fluid auto-fitting card layout separated into "PINNED" and "OTHERS" sections.
  - **Update:** Centered modal dialog with backdrop blur to edit note content.
  - **Delete:** Soft delete workflow sending notes to Bin with permanent removal/restore options.
- **Search & Filter:** Real-time text filtering across note titles and content.
- **Theming:** Dynamic Light and Dark mode toggle powered by CSS custom properties.
- **Interactive UI:**
  - Sticky header with an elevation drop shadow on page scroll.
  - Collapsible sidebar rail that expands into an elevated floating drawer on hover.
  - Card hover interactions (selection badge, pin toggle, quick action toolbar).
- **Data Persistence:** All notes, themes, and display preferences sync to `localStorage`.

---

## Tech Stack

- **HTML5:** Semantic document structure and accessibility attributes (`aria-*`).
- **CSS3:** Flexbox, CSS Grid (`minmax`, `auto-fit`), CSS Custom Properties, and fluid sizing via `clamp()`.
- **Vanilla JavaScript:** State-driven architecture adhering strictly to DRY principles.
- **Icons & Fonts:** Google Material Symbols Outlined, Google Sans, and Roboto.

---

## Project Structure

```text
├── index.html            # Main markup and DOM structure
├── styles.css            # Design tokens, variables, themes, and component styles
├── responsiveness.css    # Breakpoint and fluid layout rules
├── scripts.js            # State management, DOM events, and CRUD logic
├── keep-logo-light.png   # Keep brand icon
└── account-image.png     # User avatar asset