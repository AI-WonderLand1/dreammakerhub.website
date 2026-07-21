import { metadata } from "./homepage/page";
import Homepage from "./homepage/Homepage";
import { logger } from '@/lib/logger';

export { metadata };

export default function RootPage() {
  return <Homepage />;
}