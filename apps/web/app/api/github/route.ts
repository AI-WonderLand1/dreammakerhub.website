import { Octokit } from '@octokit/rest'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '../../utils/supabase/server'

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { action, projectId, files, commitMessage } = await req.json()
  const token = req.headers.get('authorization')?.replace('Bearer ', '')

  const octokit = new Octokit({ auth: token })

  if (action === 'push') {
    // Get repo info from project
    const { data: project } = await supabase
      .from('projects')
      .select('github_repo')
      .eq('id', projectId)
      .single()

    if (!project?.github_repo) {
      return NextResponse.json({ error: 'Project not found or no GitHub repo linked' }, { status: 404 })
    }

    const [owner, repo] = project.github_repo.split('/')

    // Get current commit SHA
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/main'
    })

    // Create blobs for each file
    const blobs = await Promise.all(
      Object.entries(files).map(async ([path, content]: any) => {
        const { data } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(content).toString('base64'),
          encoding: 'base64'
        })
        return { path, sha: data.sha, mode: '100644', type: 'blob' }
      })
    )

    // Create tree
    const { data: tree } = await octokit.git.createTree({
      owner,
      repo,
      tree: blobs as any,
      base_tree: ref.object.sha
    })

    // Create commit
    const { data: commit } = await octokit.git.createCommit({
      owner,
      repo,
      message: commitMessage || 'WonderSpace auto-commit',
      tree: tree.sha,
      parents: [ref.object.sha]
    })

    // Update reference
    await octokit.git.updateRef({
      owner,
      repo,
      ref: 'heads/main',
      sha: commit.sha
    })

    return NextResponse.json({ success: true, commit: commit.sha })
  }

  if (action === 'pull') {
    // Implementation for pulling changes
    const { data: project } = await supabase
      .from('projects')
      .select('github_repo')
      .eq('id', projectId)
      .single()

    if (!project?.github_repo) {
      return NextResponse.json({ error: 'Project not found or no GitHub repo linked' }, { status: 404 })
    }

    const [owner, repo] = project.github_repo.split('/')

    // Get latest commit
    const { data: commits } = await octokit.repos.listCommits({
      owner,
      repo,
      per_page: 1
    })

    // Get tree
    const { data: tree } = await octokit.git.getTree({
      owner,
      repo,
      tree_sha: commits[0].commit.tree.sha,
      recursive: 'true'
    })

    // Download all files
    const files: any = {}
    for (const item of tree.tree) {
      if (item.type === 'blob') {
        const { data: blob } = await octokit.git.getBlob({
          owner,
          repo,
          file_sha: item.sha!
        })
        files[item.path!] = Buffer.from(blob.content, 'base64').toString()
      }
    }

    return NextResponse.json({ files })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
