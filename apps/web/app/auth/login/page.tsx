import { redirect } from "next/navigation";
import { logger } from '@/lib/logger';

export default function LoginPage() {
  redirect("/public-pages/auth");
}
