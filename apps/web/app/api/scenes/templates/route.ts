import { NextResponse } from "next/server";
import { listPublicScenes } from "@/lib/scene/supabase-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    // First try to get from Supabase
    const supabaseScenes = await listPublicScenes(20);
    
    if (supabaseScenes.length > 0) {
      // Format for template display
      const templates = supabaseScenes.map(scene => ({
        id: scene.id,
        name: scene.name || "Untitled Scene",
        description: scene.data?.description || "AI Generated Scene",
        category: determineCategory(scene.data),
        thumbnail: scene.data?.thumbnail
      }));
      
      return NextResponse.json({ templates });
    }
    
    // Fallback to hardcoded templates
    const defaultTemplates = [
      {
        id: "blank_canvas",
        name: "Blank Canvas",
        description: "Start from scratch with an empty 3D scene. Import your own models or build manually.",
        category: "custom",
        thumbnail: null
      },
      {
        id: "template_futuristic_city",
        name: "Futuristic City",
        description: "Neon-lit skyscrapers with flying vehicles and holographic billboards",
        category: "sci-fi",
        thumbnail: null
      },
      {
        id: "template_tropical_beach",
        name: "Tropical Beach",
        description: "Palm trees, white sand, crystal clear water, and sunset sky",
        category: "nature",
        thumbnail: null
      },
      {
        id: "template_snow_mountains",
        name: "Snow Mountains",
        description: "Icy peaks with snow-covered pine trees and foggy valleys",
        category: "nature",
        thumbnail: null
      },
      {
        id: "template_ancient_ruins",
        name: "Ancient Ruins",
        description: "Crumbling stone columns and mysterious artifacts in a jungle",
        category: "fantasy",
        thumbnail: null
      },
      {
        id: "template_space_station",
        name: "Space Station",
        description: "Orbital station with Earth in background and asteroid field",
        category: "space",
        thumbnail: null
      },
      {
        id: "template_medieval_village",
        name: "Medieval Village",
        description: "Cozy cottages, market square with wooden stalls, and castle in distance",
        category: "fantasy",
        thumbnail: null
      },
      {
        id: "template_modern_office",
        name: "Modern Office",
        description: "Sleek glass walls, ergonomic furniture, city view through windows",
        category: "city",
        thumbnail: null
      },
      {
        id: "template_desert_oasis",
        name: "Desert Oasis",
        description: "Palm trees around a crystal clear pool in golden sand dunes",
        category: "nature",
        thumbnail: null
      }
    ];
    
    return NextResponse.json({ templates: defaultTemplates });
    
  } catch (error) {
    console.error("Failed to load templates:", error);
    return NextResponse.json(
      { error: "Failed to load templates" },
      { status: 500 }
    );
  }
}

function determineCategory(sceneData: any): string {
  if (!sceneData?.description) return "sci-fi";
  
  const desc = sceneData.description.toLowerCase();
  if (desc.includes("city") || desc.includes("building") || desc.includes("office")) return "city";
  if (desc.includes("beach") || desc.includes("mountain") || desc.includes("forest") || desc.includes("desert")) return "nature";
  if (desc.includes("space") || desc.includes("planet") || desc.includes("star")) return "space";
  if (desc.includes("castle") || desc.includes("ruins") || desc.includes("medieval")) return "fantasy";
  if (desc.includes("future") || desc.includes("neon") || desc.includes("tech")) return "sci-fi";
  
  return "sci-fi";
}