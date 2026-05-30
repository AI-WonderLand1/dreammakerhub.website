import { NextResponse } from "next/server";
import { listPublicScenes } from "@/lib/scene/supabase-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    // First try to get user-created scenes from Supabase
    const supabaseScenes = await listPublicScenes(20);
    
    if (supabaseScenes.length > 0) {
      const templates = supabaseScenes.map(scene => ({
        id: scene.id,
        name: scene.name || "Untitled Scene",
        description: scene.data?.description || "AI Generated Scene",
        category: determineCategory(scene.data),
        thumbnail: scene.data?.thumbnail
      }));
      
      return NextResponse.json({ templates });
    }
    
    // Also try to get from 3d-assets bucket (3D module subfolder)
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = await createClient();
      
      if (supabase) {
        const { data: files } = await supabase.storage
          .from("3d-assets")
          .list("3D module", { limit: 50 });
        
        if (files && files.length > 0) {
          const bucketTemplates = await Promise.all(
            files
              .filter(f => f.name.endsWith(".glb"))
              .slice(0, 20)
              .map(async (f) => {
                const { data: { publicUrl } } = supabase.storage
                  .from("3d-assets")
                  .getPublicUrl(`3D module/${f.name}`);
                
                const thumbName = f.name.replace(".glb", ".png");
                let thumbnailUrl = null;
                
                // Check if PNG thumbnail exists in bucket
                const { data: thumbData } = supabase.storage
                  .from("3d-assets")
                  .getPublicUrl(`3D module/${thumbName}`);
                
                // Try to verify thumbnail exists
                try {
                  const checkRes = await fetch(thumbData.publicUrl, { method: "HEAD" });
                  if (checkRes.ok) {
                    thumbnailUrl = thumbData.publicUrl;
                  }
                } catch {
                  // Thumbnail doesn't exist - will use placeholder
                }
                
                // Generate placeholder color from filename
                const filenameHash = f.name.split("").reduce((a, c) => ((a << 5) - a) + c.charCodeAt(0), 0);
                const hue = Math.abs(filenameHash) % 360;
                const placeholderColor = `hsl(${hue}, 60%, 50%)`;
                
                return {
                  id: f.name.replace(".glb", ""),
                  name: f.name.replace(".glb", "").replace(/_/g, " ").replace(/-/g, " "),
                  description: "3D asset from library",
                  category: "custom",
                  thumbnail: thumbnailUrl || null,
                  placeholderColor: thumbnailUrl ? null : placeholderColor,
                  glbUrl: publicUrl
                };
              })
          );
          
          if (bucketTemplates.length > 0) {
            return NextResponse.json({ templates: bucketTemplates });
          }
        }
      }
    } catch (e) {
      console.log("3d-assets bucket error:", e);
    }
    
    // Try to load local template files
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const templatesDir = '/home/dreammakerhub/htdocs/dreammakerhub.website/psychic-octo-fishstick/templates/3d';
      console.log('Looking for templates in:', templatesDir);
      
      if (!fs.existsSync(templatesDir)) {
        console.log('Templates directory does not exist');
        throw new Error('Templates directory not found');
      }
      
      const templateFiles = fs.readdirSync(templatesDir).filter(file => file.endsWith('.json'));
      console.log('Found template files:', templateFiles);
      
      const localTemplates = templateFiles.map(file => {
        const filePath = path.join(templatesDir, file);
        const sceneData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        
        return {
          id: file.replace('.json', ''),
          name: sceneData.name || file.replace('.json', '').replace(/_/g, ' '),
          description: sceneData.description || "3D Scene Template",
          category: sceneData.category || "custom",
          thumbnail: null
        };
      });
      
      if (localTemplates.length > 0) {
        console.log('Returning local templates:', localTemplates.length);
        return NextResponse.json({ templates: localTemplates });
      }
    } catch (error) {
      console.log("Local templates not available:", error.message);
    }
    
    // Fallback to hardcoded templates
    const defaultTemplates = [
      {
        id: "basic-environment",
        name: "Basic Environment",
        description: "A simple 3D environment with ground plane and ambient lighting to get started.",
        category: "starter",
        thumbnail: null
      },
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