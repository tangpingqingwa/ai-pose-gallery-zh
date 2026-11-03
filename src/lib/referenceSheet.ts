import { referenceImageUrl } from './recipeImages.ts'

export async function createReferenceSheet(references: { name: string; role: string | undefined; url: string }[], indices: number[]): Promise<string> {
  if (!indices.length) throw new Error('请先选择参考图片')
  const images = await Promise.all(indices.map((index) => new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`参考图片无法载入：${references[index].name}`))
    image.src = referenceImageUrl(references[index].url)
  })))
  const columns = Math.min(3, images.length)
  const rows = Math.ceil(images.length / columns)
  const gap = 18, width = 512, height = 640, caption = 62
  const canvas = document.createElement('canvas')
  canvas.width = columns * width + (columns + 1) * gap
  canvas.height = rows * (height + caption) + (rows + 1) * gap
  const context = canvas.getContext('2d')
  if (!context) throw new Error('浏览器无法创建拼图')
  context.fillStyle = '#e9e9e7'
  context.fillRect(0, 0, canvas.width, canvas.height)
  const labels: Record<string, string> = { identity: '人像身份', outfit: '服装穿搭', pose: '动作姿势', expression: '表情神态', grooming: '妆发状态', body_guide: '体型参考', identity_detail: '人物细节', gesture: '习惯仪态', character_body: '体型母版' }
  images.forEach((image, position) => {
    const index = indices[position]
    const x = gap + (position % columns) * (width + gap)
    const y = gap + Math.floor(position / columns) * (height + caption + gap)
    context.fillStyle = '#ffffff'
    context.fillRect(x, y, width, height + caption)
    const scale = Math.min(width / image.naturalWidth, height / image.naturalHeight)
    const w = image.naturalWidth * scale, h = image.naturalHeight * scale
    context.drawImage(image, x + (width - w) / 2, y + (height - h) / 2, w, h)
    context.fillStyle = '#171717'
    context.font = 'bold 19px "Microsoft YaHei", Arial, sans-serif'
    context.fillText(`图${index + 1} · ${labels[references[index].role ?? ''] ?? '补充参考'}`, x + 12, y + height + 25)
    context.font = '15px "Microsoft YaHei", Arial, sans-serif'
    context.fillText(references[index].name.slice(0, 33), x + 12, y + height + 49)
  })
  return canvas.toDataURL('image/png')
}
