# Project Plan

## Overview
A playful operational dashboard for a fictional cat-run pest control business run by my cat, Jupiter. The company is named, Jupiter’s Pest Control. The dashboard should feel like a modern interpretation of ancient Egyptian art and Art Deco styles. Combining mild hints of jungle scenes influenced by Egyptian art and art deco advertising style, with a clean, dashboard layout. 
---

## Users
-Owner of the pest control company is reviewing the data to assess progress and make decisions about what areas of the home to focus on based on status reports, personal enjoyment levels, and findings like kill counts for different pests.

---

## Design Style
The interface should feel cheerful, nostalgic, and polished rather than childish. The visual direction should reflect the following:
-1920s graphic art styles
-flat illustration 
-bold typography
-rounded cards
- illustrated patterns, cat and mouse icons, jungle leaves, Egyptian cat-god references 

---

## Layout
-Should be viewable on mobile and desktop breakpoints
-Showcase the stats of household rooms, pest types, pest kill count versus pest sighting ratio by pest type and room, treat inventory and nap count for energy levels and give advice on what rooms to focus on next.
-Make everything interactive and filterable
-Top navigation should contain the logo and a hamburger menu that opens a side sheet that overlays the dashboard offering other pages that allow the user to see pay roll, inventory needs, and the home dashboard.
-Dashboard should give an overview of all the information and a weather widget using the Open-Meteo that tells the weather currently, but also show what the weather was for each work day in the charts to help the owner determine if low kill counts and pest sightings were due to the weather or not. 
-Payroll page should showcase the employee name, shift (A.M. or P.M.), pests vanquished, overall pay (in treats), and days worked.
-Let’s show an alerts panel if the owner is low on treats or sunshine is expected and when, or if there is a type of pest like mouse, beetle or fly that is appearing in unusually high numbers. 

---

## Interactions
- Use smooth, subtle transitions between **250ms and 350ms**
- Apply easing consistently (recommended: `ease-in-out` or `cubic-bezier(0.4, 0, 0.2, 1)`)
- Avoid transitions on elements that could cause motion sickness or distraction
- Hover, focus, and active states should all be visually distinct

---

## Typography
- Import via Google Fonts or host locally using `fontsource`
- Establish hierarchy using **font weight before increasing font size**
- Suggested scale:
| Role         | Weight | Size (rem) |
|--------------|--------|------------|
| H1           | 700    | 2.0        |
| H2           | 700    | 1.75       |
| H3           | 600    | 1.5        |
| H4           | 600    | 1.25       |
| H5           | 500    | 1.125      |
| H6           | 500    | 1.0        |
| Body         | 400    | 1.0        |
| Small/Label  | 400    | 0.875      |
| Caption      | 300    | 0.75       |

---

## Color
-Ensure all foreground/background combinations meet WCAG 2.2 AA contrast ratios (4.5:1 for normal text, 3:1 for large text and UI components).
Use a light and dark theme that has a toggle to switch
---

## Spacing
- Base unit: **8px**
- All spacing, padding, margin, and gap values should be multiples of 8px
- Suggested scale:
| Token    | Value |
|----------|-------|
| space-1  | 8px   |
| space-2  | 16px  |
| space-3  | 24px  |
| space-4  | 32px  |
| space-5  | 40px  |
| space-6  | 48px  |
| space-8  | 64px  |
| space-10 | 80px  |

---

## Border Radius
- **Cards:** `8px`
- **Buttons:** `8px`
- **Input fields:** `8px`
- **Tooltips / Badges / Chips:** `4px` _(half scale, adjust as needed)_
- **Modals / Dialogs:** `16px` _(one step up for larger surfaces)_

---

## Icons
- Use **Phosphor Icons** throughout the application
- Install via: `npm install @phosphor-icons/vue`
- **Prefer outlined variants** over filled
- Use filled variants only to indicate an active or selected state
- Keep icon sizing consistent with surrounding text size
- Do not mix Phosphor with other icon libraries

---

## Charts
- Use clean, minimal data visualisations
- Labels should be clear and always visible — avoid relying on hover alone
- Avoid chartjunk: no unnecessary gridlines, shadows, or 3D effects
- Recommended library: `Chart.js via vue-chartjs`
- Every chart must have a text-based alternative or summary for accessibility

---

## Accessibility
- This project **must meet WCAG 2.2 AA standards**
- Key requirements:
  - All interactive elements must be keyboard navigable
  - Focus indicators must be clearly visible
  - Color must not be the only means of conveying information
  - All images and icons must have appropriate `alt` text or `aria-label`
  - Form inputs must have associated labels
  - Minimum contrast ratio: **4.5:1** for body text, **3:1** for large text and UI components
- Test with: axe DevTools, Lighthouse, and manual keyboard navigation

---

## Tech Stack
| Layer      | Technology                              |
|------------|-----------------------------------------|
| Framework  | Vue 3                                   |
| Build Tool | Vite                                    |
| UI Library | Vuetify 3                               |
| Language   | TypeScript |
| Icons      | Phosphor Icons for Vue                  |
| Charts     | Chart.js via vue-chartjs          |
| Weather app  | Open-meteo         |

## Data
Generate a fake dataset as a JSON file (src/data/metrics.json). The dataset should contain household room types by name, pest sightings (beetles, flies, spiders, mice), pest kills, treat inventory, and payrole (in treats and naps) for two employees. The time range should be for one year only. And let’s assume this is a popular home for pests that is very open-window oriented. Kills and pest sightings should correlate loosely. Make the numbers feel realistic with some seasonal patterns, natural variation. Not too perfect. 
-treat revenue 
-number of pests each day/month
-kill count accuracy average
-hourly kills
-kills by day
-pest type popularity
-weather forecast for the day of work
-alert messages
-payrole for two cats consisting of how much each is making each month
