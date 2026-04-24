import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/utils/supabase/server";
import { supabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(req: NextRequest, { params }: { params: Promise<{ projectId: string }> }) {
  try {
    const { projectId } = await params;
    
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: project } = await supabase
      .from("projects")
      .select("id, user_id, name, engine, metadata")
      .eq("id", projectId)
      .single();

    if (!project || project.user_id !== user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { format, includeAssets } = await req.json();
    const exportFormat = format || 'wonder';

    const fileKey = `projects/${projectId}/files.json`;
    const { data: fileData, error: downloadError } = await supabaseAdmin.storage
      .from('project-files')
      .download(fileKey);

    let files = {};
    if (!downloadError) {
      files = JSON.parse(new TextDecoder().decode(fileData));
    }

    const exportData = {
      version: '1.0',
      projectId,
      projectName: project.name,
      engine: project.engine,
      exportedAt: new Date().toISOString(),
      files,
      metadata: {
        ...project.metadata,
        exportedBy: user.id
      }
    };

    if (exportFormat === 'json') {
      return NextResponse.json(exportData);
    }

    if (exportFormat === 'zip') {
      const JSZip = require('jszip');
      const zip = new JSZip();
      
      zip.file('project.json', JSON.stringify(exportData, null, 2));
      
      if (includeAssets && files && Object.keys(files).length > 0) {
        for (const [filename, content] of Object.entries(files)) {
          if (typeof content === 'string' && (filename.endsWith('.js') || filename.endsWith('.json'))) {
            zip.file(filename, content);
          }
        }
      }
      
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      return new NextResponse(zipBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="${project.name}.${projectId}.zip"`,
          'Content-Length': zipBuffer.length.toString()
        }
      });
    }

    if (exportFormat === 'html') {
      const htmlContent = generateStandaloneHTML(exportData);
      
      return new NextResponse(htmlContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Content-Disposition': `attachment; filename="${project.name}.html"`
        }
      });
    }

    const wonderContent = JSON.stringify(exportData, null, 2);
    
    return new NextResponse(wonderContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${project.name}.wonder"`,
        'X-Project-Version': '1.0'
      }
    });
  } catch (error: any) {
    console.error("Export error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function generateStandaloneHTML(projectData: any): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${projectData.projectName}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { overflow: hidden; background: #000; }
    canvas { display: block; }
    #loading {
      position: fixed; inset: 0;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-family: system-ui; background: #0a0a0f;
    }
  </style>
</head>
<body>
  <div id="loading">Loading ${projectData.projectName}...</div>
  <script>
    const projectData = ${JSON.stringify(projectData)};
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00d4ff, wireframe: true });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);
    
    function animate() {
      requestAnimationFrame(animate);
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      renderer.render(scene, camera);
    }
    
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    document.getElementById('loading').style.display = 'none';
    animate();
  </script>
</body>
</html>`;
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    error: 'Use POST to export project',
    formats: ['wonder', 'json', 'zip', 'html'],
    options: {
      format: 'wonder|json|zip|html',
      includeAssets: 'boolean - include files in zip'
    }
  }, { status: 405 });
}