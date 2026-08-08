import { BatchDefinition } from '../types';

export const SHARED_SCHEMA_BLOCK = `Output ONLY a valid JSON array. No preamble, no markdown fences, no explanation.

Each template object must match this shape exactly:
{
  "id": "template_{category_slug}_{variant_slug}_{01-99}",
  "name": "string, descriptive",
  "description": "string, 1-2 sentences",
  "category": "string, must exactly match the category name given below",
  "thumbnail": "https://picsum.photos/seed/{unique_word}/800/600",
  "elements": [
    {
      "type": "section | div | heading | text | button | image | grid | card | nav | footer",
      "styles": { "camelCase CSS-in-JS keys only, e.g. backgroundColor, fontSize, padding, display, flexDirection" },
      "content": "string, only for heading/text/button types",
      "children": [ /* same element shape, nested for grids/cards/groups */ ]
    }
  ]
}

Rules:
- Every template needs at least 4-6 top-level sections in "elements": hero, features/content, testimonials or social proof, pricing/CTA, footer (adjust per page type — e.g. checkout doesn't need testimonials, use order summary instead).
- Use realistic placeholder company names, headlines, and CTA text — no "Lorem ipsum", no "Company Name" literal.
- Every "thumbnail" seed must be a different word from every other template in this batch.
- All style objects must use camelCase only.
- Do not repeat an "id" within the batch.`;

export const BATCH_DEFINITIONS: BatchDefinition[] = [
  {
    batchNumber: 1,
    category: 'SaaS',
    categorySlug: 'saas',
    count: 6,
    variants: [
      'minimal landing',
      'bold landing',
      'animated hero',
      'video hero',
      'stats-heavy',
      'comparison table',
    ],
    description: 'SaaS product landing pages with various visual hero styles, social proof, and feature sections.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 6 complete website templates for the category "SaaS".
Required variants (one template per variant, in this order): minimal landing, bold landing, animated hero, video hero, stats-heavy, comparison table.`,
  },
  {
    batchNumber: 2,
    category: 'Agency/Portfolio',
    categorySlug: 'agency_portfolio',
    count: 6,
    variants: [
      'creative studio',
      'design agency',
      'digital marketing',
      'photography portfolio',
      'video production',
      'freelance designer',
    ],
    description: 'Creative studio, portfolio showcases, and agency agency client presentation layouts.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 6 complete website templates for the category "Agency/Portfolio".
Required variants (one template per variant, in this order): creative studio, design agency, digital marketing, photography portfolio, video production, freelance designer.`,
  },
  {
    batchNumber: 3,
    category: 'Ecommerce',
    categorySlug: 'ecommerce',
    count: 8,
    variants: [
      'product detail',
      'category grid',
      'cart',
      'checkout',
      'order confirmation',
      'wishlist',
      'flash sale',
      'subscription page',
    ],
    description: 'Full online store purchase journey including product catalog, checkout, cart, and flash sales.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 8 complete website templates for the category "Ecommerce".
Required variants (one template per variant, in this order): product detail, category grid, cart, checkout, order confirmation, wishlist, flash sale, subscription page.`,
  },
  {
    batchNumber: 4,
    category: 'Blog/Content',
    categorySlug: 'blog_content',
    count: 6,
    variants: [
      'standard article',
      'listicle',
      'grid view',
      'magazine',
      'author profile',
      'newsletter signup',
    ],
    description: 'Editorial layouts, longform article readers, magazine grids, and author biography hubs.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 6 complete website templates for the category "Blog/Content".
Required variants (one template per variant, in this order): standard article, listicle, grid view, magazine, author profile, newsletter signup.`,
  },
  {
    batchNumber: 5,
    category: 'Marketing/LeadGen',
    categorySlug: 'marketing_leadgen',
    count: 6,
    variants: [
      'webinar',
      'event registration',
      'lead magnet (ebook)',
      'landing page',
      'coming soon',
      'thank you/confirmation',
    ],
    description: 'Conversion-focused lead capture, ebook download pages, webinar signups, and coming soon teasers.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 6 complete website templates for the category "Marketing/LeadGen".
Required variants (one template per variant, in this order): webinar, event registration, lead magnet (ebook), landing page, coming soon, thank you/confirmation.`,
  },
  {
    batchNumber: 6,
    category: 'Corporate/Business',
    categorySlug: 'corporate_business',
    count: 5,
    variants: [
      'about us',
      'careers',
      'services',
      'contact',
      'company news',
    ],
    description: 'Professional corporate identity, executive leadership teams, career openings, and press releases.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 5 complete website templates for the category "Corporate/Business".
Required variants (one template per variant, in this order): about us, careers, services, contact, company news.`,
  },
  {
    batchNumber: 7,
    category: 'RealEstate',
    categorySlug: 'realestate',
    count: 3,
    variants: ['property listing', 'property detail', 'agent profile'],
    description: 'Luxury real estate property directory, architectural floorplans, and realtor bio cards.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 3 complete website templates for the category "RealEstate".
Required variants (one template per variant, in this order): property listing, property detail, agent profile.`,
  },
  {
    batchNumber: 8,
    category: 'Education/Courses',
    categorySlug: 'education_courses',
    count: 3,
    variants: ['course catalog', 'course detail', 'instructor profile'],
    description: 'Online learning academy, video curriculum breakdown, and educator portfolios.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 3 complete website templates for the category "Education/Courses".
Required variants (one template per variant, in this order): course catalog, course detail, instructor profile.`,
  },
  {
    batchNumber: 9,
    category: 'Health/Wellness',
    categorySlug: 'health_wellness',
    count: 3,
    variants: ['clinic landing', 'wellness program', 'telehealth booking'],
    description: 'Medical practices, holistic health memberships, and online appointment scheduling.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 3 complete website templates for the category "Health/Wellness".
Required variants (one template per variant, in this order): clinic landing, wellness program, telehealth booking.`,
  },
  {
    batchNumber: 10,
    category: 'Travel/Hospitality',
    categorySlug: 'travel_hospitality',
    count: 3,
    variants: ['hotel landing', 'destination guide', 'booking form'],
    description: 'Luxury resort stay booking, curated travel itinerary guides, and reservation checkouts.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 3 complete website templates for the category "Travel/Hospitality".
Required variants (one template per variant, in this order): hotel landing, destination guide, booking form.`,
  },
  {
    batchNumber: 11,
    category: 'Nonprofit/Charity',
    categorySlug: 'nonprofit_charity',
    count: 3,
    variants: ['donation page', 'mission statement', 'volunteer signup'],
    description: 'Impact stories, fundraising goal counters, and community advocacy volunteer forms.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 3 complete website templates for the category "Nonprofit/Charity".
Required variants (one template per variant, in this order): donation page, mission statement, volunteer signup.`,
  },
  {
    batchNumber: 12,
    category: 'Entertainment/Events',
    categorySlug: 'entertainment_events',
    count: 3,
    variants: ['concert landing', 'movie promo', 'festival schedule'],
    description: 'Live music tour announcements, cinematic movie trailers, and lineup stage timelines.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 3 complete website templates for the category "Entertainment/Events".
Required variants (one template per variant, in this order): concert landing, movie promo, festival schedule.`,
  },
  {
    batchNumber: 13,
    category: 'Finance/Fintech',
    categorySlug: 'finance_fintech',
    count: 3,
    variants: ['banking dashboard', 'investment landing', 'insurance quote'],
    description: 'Modern neo-bank account portals, crypto asset managers, and instant quote calculators.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 3 complete website templates for the category "Finance/Fintech".
Required variants (one template per variant, in this order): banking dashboard, investment landing, insurance quote.`,
  },
  {
    batchNumber: 14,
    category: 'Tech/Developer',
    categorySlug: 'tech_developer',
    count: 2,
    variants: ['API documentation', 'open-source project page'],
    description: 'Developer documentation portals, REST endpoint references, and GitHub open-source hubs.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 2 complete website templates for the category "Tech/Developer".
Required variants (one template per variant, in this order): API documentation, open-source project page.`,
  },
  {
    batchNumber: 15,
    category: '3D Website Templates',
    categorySlug: '3d_website_templates',
    count: 6,
    variants: [
      '3D Interactive Hero',
      '3D Product Showcase',
      '3D Metaverse Studio',
      '3D Spline Canvas Landing',
      '3D Cyberpunk Dark Experience',
      '3D Spatial Audio & Vision',
    ],
    description: 'Immersive 3D web experiences, WebGL canvas layouts, interactive 3D product previews, and spatial UI concepts.',
    promptText: `${SHARED_SCHEMA_BLOCK}

Generate 6 complete website templates for the category "3D Website Templates".
Required variants (one template per variant, in this order): 3D Interactive Hero, 3D Product Showcase, 3D Metaverse Studio, 3D Spline Canvas Landing, 3D Cyberpunk Dark Experience, 3D Spatial Audio & Vision.`,
  },
];
