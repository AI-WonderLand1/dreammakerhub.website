import { redirect } from "next/navigation";
import { logger } from '@/lib/logger';

export default function BuilderAIPage() {
  redirect("/wonder-build");
}
