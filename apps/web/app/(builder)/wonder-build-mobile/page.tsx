import { redirect } from "next/navigation";
import { logger } from '@/lib/logger';

export default function WonderBuildMobilePage() {
  redirect("/wonder-build/playcanvas");
}
