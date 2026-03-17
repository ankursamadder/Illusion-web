const readImageFile = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Unable to read image file'))
    }

    image.src = objectUrl
  })

export const optimizeImageFile = async (
  file,
  {
    maxWidth,
    maxHeight,
    mimeType = 'image/webp',
    quality = 0.82,
  } = {}
) => {
  if (!file?.type?.startsWith('image/')) return file

  const image = await readImageFile(file)
  const width = image.width
  const height = image.height

  if (!width || !height) return file

  let targetWidth = width
  let targetHeight = height

  if (maxWidth || maxHeight) {
    const widthLimit = maxWidth ?? width
    const heightLimit = maxHeight ?? height
    const ratio = Math.min(widthLimit / width, heightLimit / height, 1)
    targetWidth = Math.max(1, Math.round(width * ratio))
    targetHeight = Math.max(1, Math.round(height * ratio))
  }

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d')
  if (!context) return file
  context.drawImage(image, 0, 0, targetWidth, targetHeight)

  const blob = await new Promise((resolve) => {
    canvas.toBlob(resolve, mimeType, quality)
  })

  if (!blob) return file

  const baseName = file.name.replace(/\.[^/.]+$/, '')
  const extension = mimeType === 'image/webp' ? 'webp' : 'jpg'

  return new File([blob], `${baseName}.${extension}`, {
    type: mimeType,
    lastModified: Date.now(),
  })
}

const imageOptimization = {
  optimizeImageFile,
}

export default imageOptimization
