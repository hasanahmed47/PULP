# PULP® Fruit-Forward. Full-On Flavour.

A playful, interactive website for **PULP**, a fruit-forward canned cocktail concept. Built to make exploring flavours feel less like scrolling through a product catalogue and more like getting to know the brand.

**[Explore the Live Website](https://pulp47.vercel.app/)**

## About the Project

PULP blends bold visual design, colourful product imagery, cinematic video and interactive experiences into one responsive website. Each of the four flavours has its own personality, from the colour palette to the can and fruit visuals.

This is a front-end brand and shopping experience. The bag and wishlist are interactive; **online checkout is not live yet**.

## Features

- **Four distinct flavours:** Blood Orange, Passionfruit Yuzu, Blueberry and Lime Basil.
- **Interactive 3D cans:** Scroll-based movement, rotation and flavour changes.
- **Flavour details:** Product imagery, nutrition and ingredients panels, and serving suggestions.
- **Cinematic storytelling:** Video highlights with carousel controls.
- **Build your mix:** Choose flavours, adjust quantities, add cans to your bag and save favourites to a wishlist.
- **Persistent bag:** Shopping selections are saved locally so they remain after a refresh.
- **Responsive layouts:** Designed for desktop and mobile, with reduced-motion preferences respected.

## Built With

| Technology | Purpose |
|---|---|
| React | UI and interactive components |
| Vite | Development and production builds |
| JavaScript + CSS | Application logic, layouts and styling |
| Three.js | 3D can scenes |
| GSAP + ScrollTrigger | Motion and scroll-based interactions |
| Lenis | Smooth scrolling |

## Getting Started

Make sure **Node.js** and **npm** are installed.

Clone the repository:

```bash
git clone YOUR_REPO_URL
cd YOUR_REPOSITORY_FOLDER
```

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open the local URL shown in your terminal, typically `http://localhost:5173`.

To create a production build:

```bash
npm run build
```

*Check your root `package.json` for the exact scripts available.*

## Project Structure

```text
src/
├── components/   # Reusable UI and shopping elements
├── context/      # Scroll and scene context
├── data/         # Flavours and media paths
├── hooks/        # Interactions and shopping hooks
├── lib/          # Helpers and shopping logic
├── sections/     # Homepage sections
├── styles/       # Component styles
├── three/        # Three.js rendering
└── App.jsx       # Main page composition

public/media/     # Images, cans and videos
```

## Product Information

Nutrition figures, ingredients, alcohol content, reviews, prices, stock messages and product claims shown in a demo should be treated as sample content unless verified against the final product specification.

## Project Status

PULP is an evolving front-end concept. The shopping bag and wishlist showcase the interaction design, while payment processing and live order fulfilment are not currently available.

*Made to feel fruity, playful and a little unexpected.*
