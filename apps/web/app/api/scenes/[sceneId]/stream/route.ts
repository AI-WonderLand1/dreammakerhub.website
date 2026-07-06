import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sceneId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { sceneId } = resolvedParams;
    const supabase = await createSupabaseServerClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    // Create a stream response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // First, send basic scene metadata
          const { data: sceneMeta, error: metaError } = await supabase
            .from("scenes")
            .select("id, name, created_at, updated_at")
            .eq("id", sceneId)
            .single();

          if (metaError || !sceneMeta) {
            // Try to load from local template files
            try {
              const fs = await import('fs');
              const path = await import('path');
              
              const templatesDir = path.join(process.cwd(), 'templates/3d');
              const templateFile = `${sceneId}.json`;
              const filePath = path.join(templatesDir, templateFile);
              
              if (fs.existsSync(filePath)) {
                const sceneData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                
                // Send metadata first
                controller.enqueue(new TextEncoder().encode(
                  JSON.stringify({ 
                    type: "metadata", 
                    data: { id: sceneId, name: sceneData.name || sceneId } 
                  }) + "\n"
                ));
                
                // Stream nodes as entities
                if (sceneData.nodes) {
                  controller.enqueue(new TextEncoder().encode(
                    JSON.stringify({ 
                      type: "entities_start", 
                      count: sceneData.nodes.length 
                    }) + "\n"
                  ));
                  
                  for (let i = 0; i < sceneData.nodes.length; i++) {
                    controller.enqueue(new TextEncoder().encode(
                      JSON.stringify({ 
                        type: "entity", 
                        index: i,
                        data: sceneData.nodes[i] 
                      }) + "\n"
                    ));
                    
                    // Small delay to simulate streaming
                    await new Promise(resolve => setTimeout(resolve, 10));
                  }
                  
                  controller.enqueue(new TextEncoder().encode(
                    JSON.stringify({ type: "entities_end" }) + "\n"
                  ));
                }
                
                // Stream environment
                if (sceneData.environment) {
                  controller.enqueue(new TextEncoder().encode(
                    JSON.stringify({ 
                      type: "environment", 
                      data: sceneData.environment 
                    }) + "\n"
                  ));
                }
                
                // Send completion
                controller.enqueue(new TextEncoder().encode(
                  JSON.stringify({ type: "complete" }) + "\n"
                ));
                controller.close();
                return;
              }
            } catch (localError) {
              console.log("Local template not available:", localError.message);
            }
            
            controller.enqueue(new TextEncoder().encode(
              JSON.stringify({ error: "Scene not found" })
            ));
            controller.close();
            return;
          }

          // Send metadata first
          controller.enqueue(new TextEncoder().encode(
            JSON.stringify({ 
              type: "metadata", 
              data: sceneMeta 
            }) + "\n"
          ));

          // Now stream the scene data in chunks
          const { data: sceneData, error: dataError } = await supabase
            .from("scenes")
            .select("data")
            .eq("id", sceneId)
            .single();

          if (dataError || !sceneData?.data) {
            controller.enqueue(new TextEncoder().encode(
              JSON.stringify({ error: "Scene data not found" })
            ));
            controller.close();
            return;
          }

          // Parse the scene data
          const scene = sceneData.data;
          
          // Stream entities first
          if (scene.entities) {
            controller.enqueue(new TextEncoder().encode(
              JSON.stringify({ 
                type: "entities_start", 
                count: scene.entities.length 
              }) + "\n"
            ));
            
            for (let i = 0; i < scene.entities.length; i++) {
              controller.enqueue(new TextEncoder().encode(
                JSON.stringify({ 
                  type: "entity", 
                  index: i,
                  data: scene.entities[i] 
                }) + "\n"
              ));
              
              // Small delay to simulate streaming
              await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            controller.enqueue(new TextEncoder().encode(
              JSON.stringify({ type: "entities_end" }) + "\n"
            ));
          }

          // Stream environment
          if (scene.environment) {
            controller.enqueue(new TextEncoder().encode(
              JSON.stringify({ 
                type: "environment", 
                data: scene.environment 
              }) + "\n"
            ));
          }

          // Stream lights
          if (scene.lights) {
            controller.enqueue(new TextEncoder().encode(
              JSON.stringify({ 
                type: "lights_start", 
                count: scene.lights.length 
              }) + "\n"
            ));
            
            for (let i = 0; i < scene.lights.length; i++) {
              controller.enqueue(new TextEncoder().encode(
                JSON.stringify({ 
                  type: "light", 
                  index: i,
                  data: scene.lights[i] 
                }) + "\n"
              ));
            }
            
            controller.enqueue(new TextEncoder().encode(
              JSON.stringify({ type: "lights_end" }) + "\n"
            ));
          }

          // Send completion
          controller.enqueue(new TextEncoder().encode(
            JSON.stringify({ type: "complete" }) + "\n"
          ));
          
          controller.close();
          
        } catch (error) {
          console.error("Stream error:", error);
          controller.enqueue(new TextEncoder().encode(
            JSON.stringify({ error: "Stream failed" })
          ));
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "Transfer-Encoding": "chunked"
      }
    });

  } catch (error: any) {
    console.error("Scene stream error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to stream scene" },
      { status: 500 }
    );
  }
}