/** Encode each path segment so spaces / unicode in poster filenames work in URLs. */
export function encodePosterPath(imagePath: string): string {
  return imagePath
    .split('/')
    .map((segment) => (segment ? encodeURIComponent(segment) : ''))
    .join('/')
}

export function posterJpg(imagePath: string): string {
  return `${encodePosterPath(imagePath)}.jpg`
}

export function posterWebpSrcSet(
  imagePath: string,
  widths: number[]
): string {
  const base = encodePosterPath(imagePath)
  return widths.map((w) => `${base}-${w}.webp ${w}w`).join(', ')
}

export function posterBestSrc(imagePath: string): { webp: string; jpg: string } {
  const base = encodePosterPath(imagePath)
  return {
    webp: `${base}-3000.webp`,
    jpg: `${base}.jpg`,
  }
}
