import { redirect } from "next/navigation";
import { logger } from '@/lib/logger';

export const metadata = {
  title: 'Sign In | AI Wonderland',
  description: 'Sign in to your AI Wonderland account.',
};

export default function LoginPage() {
  redirect("/public-pages/auth");
}
