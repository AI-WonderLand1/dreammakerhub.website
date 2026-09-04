'use client';

interface IndustryOption {
  label: string;
  emoji: string;
  batchNumber: number;
  description: string;
}

// Kept as reusable metadata for future non-blocking filters in the template
// library. The old modal itself is intentionally disabled so choosing an
// industry is not an extra user-facing step between Start and Build.
export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { label: 'Business site', emoji: '💼', batchNumber: 6, description: 'Corporate / company websites' },
  { label: 'Online store', emoji: '🛍️', batchNumber: 3, description: 'E-commerce & product shops' },
  { label: 'Portfolio', emoji: '🧑‍🎨', batchNumber: 2, description: 'Agency & creative portfolios' },
  { label: 'SaaS landing', emoji: '📈', batchNumber: 1, description: 'Product & startup landings' },
  { label: 'Restaurant', emoji: '🍽️', batchNumber: 10, description: 'Food & hospitality sites' },
  { label: 'Event', emoji: '🎟️', batchNumber: 12, description: 'Conferences & entertainment' },
  { label: 'Agency', emoji: '🏢', batchNumber: 2, description: 'Studio & agency presence' },
  { label: 'Real estate', emoji: '🏠', batchNumber: 7, description: 'Property & listings' },
  { label: 'Education', emoji: '🎓', batchNumber: 8, description: 'Courses & LMS sites' },
  { label: 'Health & wellness', emoji: '🏥', batchNumber: 9, description: 'Clinics & fitness' },
  { label: 'Blog', emoji: '✍️', batchNumber: 4, description: 'Editorial & content' },
  { label: 'Finance', emoji: '🪙', batchNumber: 13, description: 'Fintech & banking' },
  { label: 'Tech / Developer', emoji: '🧑‍💻', batchNumber: 14, description: 'Dev tools & APIs' },
  { label: 'Immersive 3D', emoji: '🌌', batchNumber: 15, description: '3D website experiences' },
  { label: 'Nonprofit', emoji: '💚', batchNumber: 11, description: 'Charities & causes' },
  { label: 'Marketing', emoji: '📣', batchNumber: 5, description: 'Lead-gen & campaigns' },
];

interface IndustryPickerProps {
  isOpen: boolean;
  onSelectIndustry: (batchNumber: number) => void;
  onSkip: () => void;
}

export default function IndustryPicker(_props: IndustryPickerProps) {
  return null;
}
