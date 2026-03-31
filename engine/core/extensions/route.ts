import { NextRequest, NextResponse } from 'next/server'
import { extensionManager } from '@core/plugins/extensionManager'

export async function POST(req: NextRequest) {
  const { manifest, code } = await req.json()
  
  const extensionId = await extensionManager.install(manifest, code)
  
  return NextResponse.json({ extensionId })
}

export async function DELETE(req: NextRequest) {
  const { extensionId } = await req.json()
  
  extensionManager.uninstall(extensionId)
  
  return NextResponse.json({ success: true })
}
