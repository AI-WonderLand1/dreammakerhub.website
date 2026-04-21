import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface AssetMetadata {
  id: string
  name: string
  source: string
  url: string
  thumbnailUrl: string
  downloadUrl: string
  format: string
  category: string
  tags: string[]
  author?: string
  license: string
}

async function syncSketchfabAssets(limit = 100) {
  console.log('🔍 Fetching from Sketchfab...')
  const res = await fetch(
    `https://api.sketchfab.com/v3/search/models?downloadable=true&license=cc&limit=${limit}`
  )
  const data = await res.json()
  
  let synced = 0
  for (const item of data.results || []) {
    const thumb = item.thumbnails?.images?.[0]
    const assetData: AssetMetadata = {
      id: `sf_${item.uid}`,
      name: item.name,
      source: 'sketchfab',
      url: `https://sketchfab.com/models/${item.uid}`,
      thumbnailUrl: thumb?.url || '',
      downloadUrl: item.download?.url || '',
      format: 'glb',
      category: item.categories?.[0]?.name || 'model',
      tags: item.tags || [],
      author: item.user?.displayName,
      license: item.license?.slug || 'CC-BY-NC'
    }

    try {
      await prisma.assets.upsert({
        where: { id: assetData.id },
        update: assetData,
        create: assetData
      })
      synced++
    } catch (err) {
      console.error(`Error syncing ${assetData.id}:`, err)
    }
  }
  console.log(`✅ Synced ${synced} Sketchfab assets`)
}

async function syncPolyHavenAssets() {
  console.log('🔍 Fetching from Poly Haven...')
  
  const categories = ['props', 'characters', 'architecture', 'nature', 'vehicles']
  let synced = 0

  for (const category of categories) {
    try {
      const res = await fetch(`https://3dmodelhaven.com/files/models?category=${category}&limit=50`)
      const data = await res.json()
      
      const items = Array.isArray(data) ? data : data.files || []
      
      for (const item of items) {
        const assetData: AssetMetadata = {
          id: `ph_${item.id || item.model_id}`,
          name: item.model_name || item.name,
          source: 'poly-haven',
          url: `https://3dmodelhaven.com/mod/${item.model_id || item.id}`,
          thumbnailUrl: `https://3dmodelhaven.com/tex/thumbs/${item.model_id || item.id}_256_256.jpg`,
          downloadUrl: item.download || '',
          format: 'glb',
          category: category,
          tags: item.tags || [],
          author: item.author,
          license: 'CC0'
        }

        try {
          await prisma.assets.upsert({
            where: { id: assetData.id },
            update: assetData,
            create: assetData
          })
          synced++
        } catch (err) {
          console.error(`Error syncing ${assetData.id}:`, err)
        }
      }
    } catch (err) {
      console.error(`Error fetching Poly Haven ${category}:`, err)
    }
  }
  console.log(`✅ Synced ${synced} Poly Haven assets`)
}

async function syncOpenSourceAssets() {
  console.log('🔍 Fetching from Open Source 3D Assets...')
  
  try {
    const res = await fetch('https://raw.githubusercontent.com/ToxSam/open-source-3d-assets/main/data/projects.json')
    const projects = await res.json()
    
    let synced = 0
    for (const project of projects) {
      const assetData: AssetMetadata = {
        id: `ossa_${project.slug}`,
        name: project.name,
        source: 'open-source',
        url: project.repo || project.download,
        thumbnailUrl: project.preview || '',
        downloadUrl: project.download || '',
        format: 'glb',
        category: project.category || 'model',
        tags: project.tags || [],
        author: project.author,
        license: project.license || 'CC0'
      }

      try {
        await prisma.assets.upsert({
          where: { id: assetData.id },
          update: assetData,
          create: assetData
        })
        synced++
      } catch (err) {
        console.error(`Error syncing ${assetData.id}:`, err)
      }
    }
    console.log(`✅ Synced ${synced} Open Source 3D Assets`)
  } catch (err) {
    console.error('Error fetching Open Source 3D Assets:', err)
  }
}

async function main() {
  console.log('🚀 Starting asset sync...\n')
  
  const start = Date.now()
  
  await syncOpenSourceAssets()
  await syncSketchfabAssets(100)
  await syncPolyHavenAssets()
  
  const duration = (Date.now() - start) / 1000
  console.log(`\n✨ Asset sync complete in ${duration}s`)
  
  const count = await prisma.assets.count()
  console.log(`📊 Total assets in database: ${count}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())