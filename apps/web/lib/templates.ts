import templates from "@/data/templates"

export async function loadTemplate(name: string) {
  return templates[name] ?? templates["empty"]
}
