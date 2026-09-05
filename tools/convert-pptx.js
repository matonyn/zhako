const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const sharp = require('sharp')

// This script converts .pptx files in public/posters/station-XX/ into high-quality
// JPG and WebP images. Requirements:
//  - LibreOffice (soffice) available on PATH to export PPTX -> PNG
//  - Node.js and npm packages installed (sharp)

const ROOT = path.resolve(__dirname, '..')
const POSTERS = path.join(ROOT, 'public', 'posters')
const OUTPUT_WIDTHS = [1200, 2000, 3000]

function findPPTXFolders() {
  if (!fs.existsSync(POSTERS)) return []
  return fs.readdirSync(POSTERS).filter(name => name.startsWith('station-')).map(name => path.join(POSTERS, name))
}

async function convertPPTX(pptxPath, outBase) {
  const tmpDir = path.join(path.dirname(pptxPath), '.tmp_convert')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir)

  console.log('Converting', pptxPath)
  try {
    // LibreOffice conversion
    execSync(`soffice --headless --convert-to png --outdir "${tmpDir}" "${pptxPath}"`, { stdio: 'inherit' })
  } catch (e) {
    console.error('LibreOffice conversion failed. Ensure `soffice` is installed.', e.message)
    return
  }

  // pick first PNG output (assume single-slide poster file)
  const files = fs.readdirSync(tmpDir).filter(f => f.toLowerCase().endsWith('.png'))
  if (files.length === 0) {
    console.warn('No PNG produced for', pptxPath)
    return
  }

  const src = path.join(tmpDir, files[0])

  // produce JPG full-res and WebP variants
  const jpgOut = outBase + '.jpg'
  await sharp(src).jpeg({ quality: 92 }).toFile(jpgOut)
  console.log('Wrote', jpgOut)

  for (const w of OUTPUT_WIDTHS) {
    const out = `${outBase}-${w}.webp`
    await sharp(src).resize({ width: w }).webp({ quality: 90 }).toFile(out)
    console.log('Wrote', out)
  }

  // cleanup tmp
  try { fs.unlinkSync(src) } catch {};
}

async function walk() {
  const folders = findPPTXFolders()
  for (const folder of folders) {
    const files = fs.readdirSync(folder).filter(f => f.toLowerCase().endsWith('.pptx'))
    for (const f of files) {
      const full = path.join(folder, f)
      const base = path.join(folder, path.basename(f, path.extname(f)))
      await convertPPTX(full, base)
    }
  }
}

walk().then(()=> console.log('Done')).catch(e=>{ console.error(e); process.exit(1) })
