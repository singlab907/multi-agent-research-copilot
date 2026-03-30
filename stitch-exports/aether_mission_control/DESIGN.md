# Design System Strategy: The Synthetic Intelligence Terminal

## 1. Overview & Creative North Star
**The Creative North Star: "The Sovereign Analyst"**
This design system moves away from the friendly, rounded "SaaS-standard" aesthetic to embrace a high-precision, mission-critical environment. It is designed for the AI Research Copilot—a tool that demands clinical clarity, massive data density, and an elite, "terminal-first" philosophy. 

We break the "template" look by using **Monolithic Asymmetry**. Instead of centered, balanced grids, we lean into technical layouts where information is anchored to edges, creating a sense of an expansive, infinite workspace. The interface doesn't just display data; it feels like a high-performance engine idling, ready for complex computation.

## 2. Colors & Surface Architecture
The palette is rooted in the "Void"—a series of deep, cold neutrals that provide a high-contrast stage for the surgical Teal accents.

*   **Primary Action:** `primary` (#46f1c5) / `primary_container` (#00d4aa)
*   **Neutral Foundation:** `surface` (#111319) / `surface_container_lowest` (#0c0e14)
*   **Typography:** `on_surface` (#e2e2eb)

### The "No-Line" Rule
Standard UI relies on 1px borders to separate sections. In this system, **visible borders are a failure of hierarchy.** Boundaries must be defined through tonal shifts. A `surface_container_low` sidebar should simply sit against a `surface` background. If the user cannot distinguish sections without a line, increase the tonal contrast between containers rather than adding a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of technical components. 
- **Base Layer:** `surface_dim` or `background` for the deepest global canvas.
- **Content Blocks:** Use `surface_container` for primary work areas.
- **Active Focus:** Use `surface_container_high` for elevated panels or active research threads.
- **The "Glass & Gradient" Rule:** To provide "soul" to the terminal, floating command bars or AI status indicators should use `surface_bright` at 80% opacity with a `backdrop-blur` of 20px. This prevents the UI from feeling "flat" and creates a lens-like focus effect.

### Signature Textures
Apply a subtle linear gradient to `primary` CTAs, transitioning from `primary_fixed` (#55fcd0) at the top-left to `primary_container` (#00d4aa) at the bottom-right. This mimics the slight glow of a phosphor screen.

## 3. Typography: The Editorial Monospace
The typography system is a dialogue between human-readable headers and machine-readable data.

*   **Display & Headline (Space Grotesk):** These fonts are used for high-level orientation. They should feel authoritative and structural. Use `headline-lg` for terminal headers to establish a "top-down" command structure.
*   **Body & Titles (Inter):** Reserved for research notes and long-form AI responses. Inter provides the legibility required for deep reading that monospace lacks.
*   **Labels & Badges (Space Grotesk Monospace):** All metadata, status tags, and system logs must use the `label` scales. This reinforces the "Mission Control" aesthetic, making every piece of data feel like a calculated output.

## 4. Elevation & Depth: Tonal Layering
We reject "Material" shadows. Depth in this system is achieved through light emission and density.

*   **The Layering Principle:** Stack `surface_container_lowest` cards inside `surface_container_high` layouts to create "sunken" wells for data entry. This creates an architectural, recessed feel.
*   **Ambient Glows:** When an element must "float" (like a command palette), do not use a black shadow. Use a tinted glow: a 20px blur using `primary` at 5% opacity. It should feel like the screen is projecting light, not casting a shadow.
*   **The "Ghost Border" Fallback:** If accessibility requires a container edge, use a "Ghost Border"—the `outline_variant` token at 15% opacity. It should be felt, not seen.

## 5. Components
### Buttons
*   **Primary:** Sharp 0px corners. Solid `primary_container`. Text in `on_primary`. On hover, add a 4px outer glow of `primary`.
*   **Tertiary/Ghost:** No background. `label-md` monospace text. Hover state reveals a `surface_container_highest` background.

### Input Fields
*   **The "Terminal Input":** No background fill. Only a bottom border using `outline_variant`. On focus, the bottom border transitions to `primary` and a subtle 2px teal glow appears beneath the line.

### Cards & Data Modules
*   **Forbid Divider Lines:** Use `Spacing 8` (1.75rem) or `surface` shifts to separate content.
*   **Status Indicators:** Small 4px square "pips" using `primary` for active, `error` for halted, and `secondary` for idle.

### Additional Signature Components
*   **The Pulse Indicator:** A 1px tall progress bar at the very top of a container that pulses with `primary` when the AI is "thinking."
*   **Breadcrumb Coordinates:** Replace standard breadcrumbs with monospace "coordinates" (e.g., `RES // NAV // 042`) to maintain the high-tech feel.

## 6. Do's and Don'ts

### Do:
*   **Embrace the Sharp Edge:** All containers must use `0px` or `4px` maximum radius. Roundness is for consumers; sharpness is for experts.
*   **Use Intentional Asymmetry:** Align sidebar content to the bottom-left and main headers to the top-right to create a bespoke, non-centered layout.
*   **Data Density:** Don't be afraid of small `label-sm` text for metadata. The "Mission Control" look thrives on visible complexity.

### Don't:
*   **Never use 100% Opaque Borders:** This creates "boxes within boxes" and kills the sophisticated terminal depth.
*   **Avoid Soft Grays:** Every neutral should have a slight blue or teal tint (referenced in the `surface` tokens) to avoid a "dead" or "generic" dark mode.
*   **No Circular Avatars:** Use square or "clipped corner" shapes for user/AI representation.