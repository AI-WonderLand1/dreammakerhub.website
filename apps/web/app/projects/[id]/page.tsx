import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const project = await prisma.projects.findUnique({
    where: { id },
    select: { name: true }
  });

  return {
    title: project ? `${project.name} - DreamMakerHub` : 'Project Not Found',
  };
}

const FILE_TYPE_COLORS: Record<string, string> = {
  glb: 'bg-blue-500',
  gltf: 'bg-blue-600',
  js: 'bg-yellow-500',
  ts: 'bg-blue-400',
  json: 'bg-gray-500',
  png: 'bg-purple-500',
  jpg: 'bg-purple-600',
  jpeg: 'bg-purple-600',
  mp4: 'bg-red-500',
  default: 'bg-gray-400'
};

const LICENSE_ICONS: Record<string, string> = {
  'MIT': '⚖️',
  'CC0': '� Public Domain',
  'CC-BY': '📝',
  'CC-BY-NC': '📝',
  'GPL': '📜',
  'Apache': '📜',
  'BSD': '📜'
};

function getFileColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return FILE_TYPE_COLORS[ext] || FILE_TYPE_COLORS.default;
}

function formatDate(date: Date | string | null): string {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  const project = await prisma.projects.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true, email: true, full_name: true }
      },
      assets: {
        select: {
          id: true,
          name: true,
          type: true,
          file_path: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' },
        take: 50
      },
      folders: {
        select: {
          id: true,
          name: true,
          created_at: true
        },
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!project) {
    notFound();
  }

  const isOwner = user?.id === project.user_id;
  const isPublic = project.is_public || false;

  // Group assets by type for language bar
  const assetTypes = project.assets.reduce((acc, asset) => {
    const ext = asset.name.split('.').pop()?.toLowerCase() || 'other';
    acc[ext] = (acc[ext] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalFiles = project.assets.length + project.folders.length;
  const languageBar = Object.entries(assetTypes).map(([ext, count]) => ({
    ext,
    count,
    percentage: totalFiles > 0 ? (count / totalFiles) * 100 : 0,
    color: getFileColor(ext)
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center text-sm text-gray-500 mb-3">
            <Link href="/dashboard" className="hover:text-blue-600">Dashboard</Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-medium">{project.name}</span>
          </nav>

          {/* Project Title Row */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              {isPublic ? (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">Public</span>
              ) : (
                <span className="px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">Private</span>
              )}
            </div>
            
            <div className="flex gap-2">
              {isOwner && (
                <>
                  <Link
                    href={`/wonder-build/playcanvas?sceneId=${project.id}`}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Open in Editor
                  </Link>
                  <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                    Settings
                  </button>
                </>
              )}
              {!isOwner && isPublic && (
                <Link
                  href={`/wonder-build/playcanvas?sceneId=${project.id}`}
                  className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Fork Project
                </Link>
              )}
            </div>
          </div>

          {/* Language Bar */}
          {totalFiles > 0 && (
            <div className="flex items-center gap-1 mt-4 h-2 rounded overflow-hidden">
              {languageBar.map((lang, i) => (
                <div
                  key={lang.ext}
                  className={`${lang.color} h-full first:rounded-l last:rounded-r`}
                  style={{ width: `${lang.percentage}%` }}
                  title={`${lang.ext}: ${lang.count} files`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left: File Explorer */}
          <div className="flex-1">
            {/* Folders */}
            {project.folders.length > 0 && (
              <div className="bg-white rounded-md border border-gray-200 mb-4">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h2 className="text-sm font-medium text-gray-900">Folders</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {project.folders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer"
                    >
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                      </svg>
                      <span className="text-sm text-gray-700">{folder.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Files / Assets */}
            <div className="bg-white rounded-md border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-900">Files</h2>
                <span className="text-xs text-gray-500">{project.assets.length} files</span>
              </div>
              <div className="divide-y divide-gray-100">
                {project.assets.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    <p>No files yet</p>
                    <p className="text-xs mt-1">Add assets in the editor</p>
                  </div>
                ) : (
                  project.assets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer group"
                    >
                      <div className={`w-3 h-3 rounded-full ${getFileColor(asset.name)}`} />
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm text-gray-700 group-hover:text-blue-600">{asset.name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{formatDate(asset.created_at)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* 3D Preview Placeholder */}
            <div className="mt-6 bg-white rounded-md border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-900">3D Preview</h2>
              </div>
              <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gray-300 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-sm">Click "Open in Editor" to view 3D scene</p>
                  <Link
                    href={`/wonder-build/playcanvas?sceneId=${project.id}`}
                    className="inline-block mt-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Launch 3D Viewer
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-72 shrink-0">
            <div className="bg-white rounded-md border border-gray-200">
              <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-sm font-medium text-gray-900">About</h2>
              </div>
              <div className="p-4 space-y-4">
                {/* Description */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Description</h3>
                  <p className="text-sm text-gray-700">
                    {project.name} - A 3D project built with DreamMakerHub
                  </p>
                </div>

                {/* Owner */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Owner</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                      {project.users.full_name?.[0] || project.users.email?.[0] || 'U'}
                    </div>
                    <span className="text-sm text-gray-700">
                      {project.users.full_name || project.users.email}
                    </span>
                  </div>
                </div>

                {/* Created */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Created</h3>
                  <p className="text-sm text-gray-700">{formatDate(project.created_at)}</p>
                </div>

                {/* Last Updated */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">Last Updated</h3>
                  <p className="text-sm text-gray-700">{formatDate(project.updated_at)}</p>
                </div>

                {/* License */}
                <div>
                  <h3 className="text-xs font-medium text-gray-500 uppercase mb-1">License</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-700">
                    <span>📜</span>
                    <span>MIT License</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{project.assets.length}</div>
                      <div className="text-xs text-gray-500">Files</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{project.folders.length}</div>
                      <div className="text-xs text-gray-500">Folders</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{project.project_members.length}</div>
                      <div className="text-xs text-gray-500">Members</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}