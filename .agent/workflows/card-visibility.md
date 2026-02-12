---
description: Ensuring UI cards and glass elements are always clearly visible
---

# Card Visibility Standards

When building or modifying UI components that use glassmorphism (glass cards), ALWAYS ensure:

## CSS Rules
1. `.glass` background opacity should be at least `rgba(255, 255, 255, 0.08)` — never lower than 0.05
2. `.glass` border opacity should be at least `rgba(255, 255, 255, 0.15)` — not 0.05 or 0.1
3. Every `.glass` element MUST have a `box-shadow` for depth (e.g., `0 4px 24px rgba(0, 0, 0, 0.25)`)
4. Add `inset 0 1px 0 rgba(255, 255, 255, 0.06)` for a subtle top-edge highlight

## Tailwind Border Classes
- **NEVER** use `border-white/5` on cards — it is too faint and practically invisible
- **Minimum**: Use `border-white/15` for normal state
- **Hover**: Use `border-white/25` or branded colors like `border-violet-500/40`
- **Dashed borders** (e.g., "Add New" cards): Use `border-white/15` minimum

## Checklist Before Shipping
- [ ] Can you clearly see the card boundaries at first glance?
- [ ] Does the card stand out from the background?
- [ ] Are hover states visibly different from default?
- [ ] Is there sufficient contrast in dark mode?

## Files to Update When Changing Glass Styles
- `app/globals.css` — `.glass` and `.glass-strong` classes
- All page files using `<Card className="glass border-white/...">`:
  - `app/dashboard/page.tsx`
  - `app/project/[id]/page.tsx`
  - `app/page.tsx` (if applicable)

## Golden Rule
> Cards should be UNMISTAKABLY visible. The user should never squint or wonder where a card starts and ends. If in doubt, make it MORE visible, not less.
