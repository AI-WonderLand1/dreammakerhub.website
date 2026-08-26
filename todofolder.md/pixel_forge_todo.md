# PixelForge Dashboard & 3D AI Rendering Implementation

## 1. Layout Architecture
- [ ] **Main Canvas Setup**
    - [ ] Implement viewport lock (100vh, 100vw)
    - [ ] Configure sticky Sidebar (15–20% width)
    - [ ] Configure scrollable Main Workspace (80–85% width)
    - [ ] Set global background: `#07090E`

## 2. Component Development

### 🧱 Sidebar Component (`<Sidebar/>`)
- [ ] **Brand Logo** (`<BrandLogo/>`)
    - [ ] Implement purple geometric forge icon
    - [ ] Add "PixelForge" text (White, Bold, Sans-serif)
- [ ] **Navigation Menu** (`<NavMenu/>`)
    - [ ] Vertical flex column stack
    - [ ] Implement `NavItem` (Active: rounded capsule, dark-purple fill, white text; Inactive: muted grey `#94A3B8` -> white on hover)
    - [ ] Add icons: Home, AI Tools, 3D Generator, Print Tools, Creations, Community, Resources, Settings
- [ ] **Upgrade Card** (`<UpgradeCard/>`)
    - [ ] Dark navy gradient background with purple inset glow
    - [ ] Elements: Purple diamond icon, "Upgrade to Pro" header, description, and "Upgrade Now" button

### 🏗️ Header Component (`<Header/>`)
- [ ] **Status Badge** (`<StatusBadge/>`)
    - [ ] Inline flex with pulsing green dot `#10B981` and "1242 online" text
- [ ] **Wallet Widget** (`<WalletWidget/>`)
    - [ ] Dark pill container (`#131722`) with thin border
    - [ ] Gold coin icon + Token amount ("11,256") + "+" button
- [ ] **Action Button** (`<Button variant="outline">`)
    - [ ] "Get Credits" with wireframe box/gift icon
- [ ] **User Avatar** (`<Avatar/>`)
    - [ ] Circular container (`#121622`) with bold white initials "JS"

### 🚀 Hero Banner Section (`<HeroBanner/>`)
- [ ] **Text Panel** (Left 45%)
    - [ ] Tagline: "AI 3D GENERATOR" (muted indigo)
    - [ ] H1: "Turn Ideas into Stunning 3D Models" (with electric purple gradient on "3D Models")
    - [ ] Primary action: "Generate 3D Model" button with magic wand icon
- [ ] **Interactive Split Slider** (`<ImageSlider/>`) (Right 55%)
    - [ ] Implement comparative slider (Original Image vs 3D Result)
    - [ ] Vertical white divider handle with circular chevron toggle
    - [ ] Translucent pill badges: "Original Image" and "3D Result"

### 🛠️ Quick Tools Grid (`<QuickGenerators/>`)
- [ ] **Generator Card** (`<GeneratorCard/>`)
    - [ ] 3-column responsive grid
    - [ ] Header: Icon badge + tool title (H3)
    - [ ] Body: 2-column split (Left: feature text + action button; Right: abstract visual asset/canvas)

### 📦 Categories Showcase (`<CategorySection/>`)
- [ ] **Category Card** (`<CategoryCard/>`)
    - [ ] 6-column grid layout
    - [ ] Aspect ratio 3:4
    - [ ] Centered 3D asset frame (Headphones, Robot, etc.)
    - [ ] Bottom footer label with animated right arrow (→) on hover

### ✨ Feature Value Props (`<ValueProps/>`)
- [ ] **Prop Item** (`<PropItem/>`)
    - [ ] 3-column horizontal layout
    - [ ] Left: Rounded-square icon container (Lightning, Crystal, Shield)
    - [ ] Right: Bold title + summary description

## 3. 3D AI Rendering Page (`/dashboard/ai-generator`)
- [ ] Implement core rendering interface
- [ ] Integrate with 3D Library assets
- [ ] Implement real-time 3D generation preview
- [ ] Add prompt input and generation controls

## 4. Styling & Technical Specs
- [ ] **Typography** (Inter/SF Pro)
    - [ ] H1: 36px/700
    - [ ] H2: 20px/600
    - [ ] H3: 16px/600
    - [ ] Body: 14px/400
    - [ ] Taglines: 11px/600 (Uppercase, Indigo)
- [ ] **Color & Effects**
    - [ ] Implement electric lavender gradient (`#5046E6` -> `#7C3AED`)
    - [ ] Implement card hover states (`#161B26`)
    - [ ] Apply 1px `#1D2433` grid borders
    - [ ] Implement radial-gradient pseudo-elements for glows
- [ ] **Spacing & Radii**
    - [ ] Use p-8 (32px) main padding and space-y-8 gaps
    - [ ] Radii: 16px (Main blocks), 12px (Cards), 8px (Buttons), 9999px (Pills)
