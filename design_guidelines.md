# Design Guidelines: Apple-Style Portfolio

## Design Approach
**Reference-Based: Apple Human Interface Guidelines** - Minimalist, content-focused design with emphasis on typography, generous whitespace, and subtle refinement. Dark theme with sophisticated grays and carefully selected accent colors for visual hierarchy.

## Core Design Principles
- **Restraint**: Less is more - every element earns its place
- **Clarity**: Clean typography and clear visual hierarchy
- **Depth**: Subtle layering through shadows and transparency
- **Fluidity**: Smooth transitions and effortless interactions

## Typography System
- **Primary Font**: SF Pro Display (Apple's system font) or Inter as fallback via Google Fonts
- **Hero Name**: 4xl to 6xl, font-weight 700, tracking tight
- **Section Headings**: 3xl to 4xl, font-weight 600
- **Subheadings**: xl to 2xl, font-weight 500
- **Body Text**: base to lg, font-weight 400, line-height relaxed
- **Captions**: sm, font-weight 400, muted color

## Layout & Spacing System
**Tailwind Units**: Consistently use 4, 6, 8, 12, 16, 20, 24, 32 for spacing
- **Section Padding**: py-20 to py-32 desktop, py-12 to py-16 mobile
- **Container**: max-w-6xl with px-6 to px-8
- **Component Gaps**: gap-6 to gap-12 based on density
- **Card Padding**: p-6 to p-8

## Section-Specific Design

### Hero Section (80vh)
- Centered layout with profile photo (rounded-full, w-32 h-32, subtle ring)
- Name displayed prominently below photo
- Title/role in muted text
- Brief 2-3 line bio in prose format
- Subtle gradient overlay background

### Projects Section
- Grid layout: grid-cols-1 md:grid-cols-2 gap-8
- Project cards with subtle tilt effect (rotate-1, -rotate-1 alternating)
- Each card: Project thumbnail image, title, tech stack tags, brief description
- Hover state: slight scale and shadow enhancement
- "View Project" link with arrow icon

### Experience Section
- Vertical timeline layout with connecting line
- Company logo (w-12 h-12, rounded)
- Role as heading, company name below
- Date range in muted text
- Bullet points for responsibilities/achievements
- Alternating left-right alignment on desktop, stacked on mobile

### Testimonials Section
- 2-column grid on desktop (grid-cols-1 md:grid-cols-2)
- Quote cards with subtle background
- Large opening quote mark
- Testimonial text in italic
- Author name and title below
- Optional small author photo

### Contact Section
- 2-column layout: Form on left, contact info on right
- Form fields: Name, Email, Message (textarea)
- Email display with "Copy" button and keyboard shortcut hint (⌘C)
- Social media icon links (GitHub, LinkedIn, Twitter)
- Submit button with loading state

## Component Library

### Cards
- Background: Subtle dark card with border
- Border radius: rounded-xl to rounded-2xl
- Padding: p-6 to p-8
- Hover: Slight elevation with shadow-lg

### Buttons
- Primary: Solid background, rounded-lg, px-6 py-3
- Ghost: Border only, transparent background
- Hover: Brightness increase, smooth transition

### Form Inputs
- Dark background with light border
- Focus: Accent color ring
- Rounded-lg, px-4 py-3
- Placeholder text muted

### Tags/Badges
- Small pills for tech stack
- Rounded-full, px-3 py-1, text-sm
- Muted background with lighter text

## Animations
- **Scroll Reveal**: Fade-in-up on section entry (opacity + translateY)
- **Hover Effects**: Subtle scale (1.02) and shadow transitions
- **Page Transitions**: Smooth 200-300ms ease-in-out
- **Loading States**: Spinner or skeleton screens where applicable

## Images
- **Hero**: No large background image - clean gradient background
- **Profile Photo**: Professional headshot, circular, 128x128px minimum
- **Project Thumbnails**: 16:9 ratio, high-quality screenshots/mockups
- **Company Logos**: SVG preferred, 48x48px, grayscale or monochrome
- **Testimonial Authors**: Optional 40x40px circular photos

## Responsive Behavior
- Mobile: Single column, stacked sections, reduced spacing
- Tablet: 2-column grids where appropriate
- Desktop: Full multi-column layouts, generous spacing
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)

## Accessibility
- Proper heading hierarchy (h1 → h6)
- Focus indicators on all interactive elements
- Sufficient color contrast ratios (WCAG AA minimum)
- Alt text for all images
- Keyboard navigation support throughout