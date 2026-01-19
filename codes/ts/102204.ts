import type { CustomRequestOptions, FileInfo, SettledFileInfo } from "naive-ui/es/upload/src/interface"
import { DB, DBTable } from "./DB"
import { ImageWorkerHandler } from "./ImageWorkerHandler"
import { WorkerMessageMethod } from "./WorkerTypes"
import { ref } from "vue"
import { Toolkit } from "./Toolkit"

/** 背景样式信息 */
export interface BackgroundImageInfo {
  url: string
  name: string
  category: string
  html: string
}

/** 用户自定义图片 */
export class CustomBackgroundImage {
  id: string = ''
  name: string = ''
  batchId?: string | null | undefined
  percentage?: number | null | undefined
  status: "pending" | "uploading" | "finished" | "removed" | "error" = 'pending'
  url?: string | null | undefined
  file?: File | null | undefined
  /** 图片的 Blob 数据, File 数据在保存到 indexeddb 后会有同源限制, 所以使用 Blob */
  $blob?: Blob | undefined
  thumbnailUrl?: string | null | undefined
  type?: string | null | undefined
  fullPath?: string | null | undefined

  constructor(info: CustomBackgroundImage) {
    Object.assign(this, info)
  }

  /** 缩略图高度 */
  static THUMBNAIL_HEIGHT: number = 120

  /**
   * 上传文件
   * 
   * 将用户上传的图片保存到 `indexeddb`, 但由于浏览器的同源策略, 无法适用于所有的文章页面, 因为域名可能是不一样的, 例如:
   * 
   * - https://csdnnews.blog.csdn.net/article/details/133896968
   * - https://blog.csdn.net/weixin_44769612/article/details/130941960
   * 
   * 但如果使用 `Tampermonkey` 的 `GM_setValue`, 在存储大量数据后, 会导致页面所有的脚本失效 😭
   * 
   * @param file 上传的文件
   */
  static async save(options: Omit<CustomRequestOptions, 'file'> & { file: CustomBackgroundImage }) {
    const image = options.file.$blob || options.file.file
    if (!image) throw new Error("Missing file / blob");
    try {
      // 1. 在 indexeddb 中保存图片信息
      const data: FileInfo = { ...options.file, file: null }
      await DB.add(DBTable.BackgroundImages, data)

      console.time('保存文件: ' + options.file.id)
      options.onProgress({ percent: Math.max(30, Math.random() * 75) })
      // 2. 在 web worker 进程中将原图和缩略图的文件保存到 indexeddb 中
      if (import.meta.env.DEV) {
        console.warn('当前处于开发环境, 无法使用 Web Worker, 直接写入 IndexedDB')
        await Promise.all([
          // 保存原图
          options.file.url ? () => { } : DB.add(DBTable.BackgroundImageFiles, { id: options.file.id, file: image }),
          // 保存缩略图
          CustomBackgroundImage.convertImage(image, CustomBackgroundImage.THUMBNAIL_HEIGHT, false, true)
            .then(thumbResult => {
              if (!thumbResult.blob) throw new Error('To Blob Failed')
              // 保存缩略图 URL
              options.file.thumbnailUrl = thumbResult.url
              return DB.add(DBTable.BackgroundThumbImageFiles, { id: options.file.id, file: thumbResult.blob })
            })
        ])
      } else {
        await Promise.all([
          // 保存原图
          options.file.url ? () => { } : ImageWorkerHandler.request({ method: WorkerMessageMethod.saveImage, data: { id: options.file.id, file: image } }),
          // 保存缩略图
          CustomBackgroundImage.convertImage(image, CustomBackgroundImage.THUMBNAIL_HEIGHT, false, true)
            .then(thumbResult => {
              if (!thumbResult.blob) throw new Error('To Blob Failed')
              // 保存缩略图 URL
              options.file.thumbnailUrl = thumbResult.url
              return ImageWorkerHandler.request({
                method: WorkerMessageMethod.saveThumbImage,
                data: { id: options.file.id, file: thumbResult.blob }
              })
            })
        ])
      }

      // 3. 保存
      data.status = 'finished'
      // CustomBackgroundImage.images.push(data)

      console.timeEnd('上传文件: ' + options.file.id)
      options.onFinish()
    } catch (err) {
      options.onError()
      throw err
    }
  }

  /**
   * 将图片转换为指定高度并保持宽高比的Blob格式的URL和base64数据。
   * @description created by ChatGPT 😊
   * @param image 图片，可以是字符串类型的图片地址或File类型的图片。
   * @param targetHeight 目标高度，可选参数。如果提供了目标高度，则会根据目标高度调整图片大小并保持宽高比; 如果值为 'canvas', 则强制使用 `canvas` 绘制
   * @param toBase64 是否生成 Base64 数据
   * @param convertToBlob 是否显示的将图片转为 Blob(在传入链接形式的图片时将会执行转换)
   * @returns 包含Blob格式的URL和base64数据的Promise。
   */
  static convertImage(image: string | File | Blob, targetHeight?: number | 'canvas', toBase64: boolean = true, convertToBlob: boolean = false): Promise<{ url: string, blob?: Blob, base64: string }> {
    let imageUrl: string;

    if (typeof image === 'string') {
      imageUrl = image;
    } else if (image instanceof Blob) {
      imageUrl = URL.createObjectURL(image);
    } else {
      throw new Error('Invalid image parameter');
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let canvas: HTMLCanvasElement | null = null;
        if (targetHeight) {
          targetHeight = targetHeight === 'canvas' ? img.height : targetHeight
          const aspectRatio = img.width / img.height;
          const targetWidth = targetHeight * aspectRatio;

          canvas = document.createElement('canvas');
          canvas.width = targetWidth;
          canvas.height = targetHeight;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, targetWidth, targetHeight);
        }

        if (canvas) {
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              if (toBase64) {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve({
                    url: url,
                    blob,
                    base64: reader.result as string
                  });
                };
                reader.readAsDataURL(blob);
              } else {
                resolve({ url, blob, base64: '' })
              }
            } else {
              reject(new Error('Failed to create Blob.'));
            }
          });
        } else {
          if (convertToBlob && typeof image === 'string') {
            CustomBackgroundImage.urlToBlob(image)
              .then(blob => {
                if (toBase64) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    resolve({
                      url: imageUrl,
                      blob,
                      base64: reader.result as string
                    });
                  };
                  reader.readAsDataURL(blob);
                } else {
                  resolve({ url: imageUrl, blob, base64: '' })
                }
              })
          } else {
            const blob = image instanceof File ? image : undefined
            if (toBase64) {
              const reader = new FileReader();
              reader.onloadend = () => {
                resolve({
                  url: imageUrl,
                  blob: image as Blob,
                  base64: reader.result as string
                });
              };
              reader.readAsDataURL(image instanceof File ? image : new Blob([img.src]));
            } else {
              resolve({ url: imageUrl, blob, base64: '' })
            }
          }
        }
      };

      img.onerror = (error) => {
        reject(error);
      };

      img.src = imageUrl;
    });
  }

  /**
   * 将Base64格式的图片数据转换为Blob URL。
   * @param url 连接或 Base64 格式的图片数据。
   * @returns Blob URL。
   */
  static async urlToBlob(url: string | File): Promise<Blob> {
    if (url instanceof File) return url
    const response = await fetch(url);
    const blob = await response.blob();
    return blob
  }

  /** 所有保存的图片数据(响应式) */
  static images = ref<Array<CustomBackgroundImage>>([])

  /** 从本地获取用户以保存的自定义图片 */
  static async getLocaleImages() {
    const localeImages = await DB.getList<CustomBackgroundImage>(DBTable.BackgroundImages)
    return localeImages.map(img => new CustomBackgroundImage(img))
  }

  /** 从本地获取用户以保存的自定义图片 ID list */
  static async getLocaleImageIdList() {
    const localeImages = await DB.getAllKeys<string>(DBTable.BackgroundImages)
    return localeImages
  }

  /** 从 indexeddb 中获取所有图片数据 */
  static async getImages() {
    if (CustomBackgroundImage.images.value.length) return CustomBackgroundImage.images.value
    console.time('获取所有背景图片')
    // 1. 读取以保存的所有背景图片
    // console.time('GM_getValue("CustomBackgroundImage")')
    CustomBackgroundImage.images.value = await CustomBackgroundImage.getLocaleImages()
    // console.timeEnd('GM_getValue("CustomBackgroundImage")')
    // 2. 根据原图 File 生成缩略图, 并创建原图和缩略图的 Blob URL
    await Promise.all(CustomBackgroundImage.images.value.map(async img => {
      if (img.url) return // http* 链接格式的图片
      img.status = 'pending'
      if (import.meta.env.DEV) {
        console.warn('当前处于开发环境, 无法使用 Web Worker, 直接读 IndexedDB')
        const thumbnailUrl = await DB.get<{ file: File }>(DBTable.BackgroundThumbImageFiles, img.id)
        img.thumbnailUrl = URL.createObjectURL(thumbnailUrl.file)
        img.status = 'finished'
      } else {
        // console.log('获取缩略图并生成 Blob URL - ' + img.id)
        const thumbnailUrl = await ImageWorkerHandler.request({ method: WorkerMessageMethod.getThumbImageURL, data: { id: img.id } })
        img.thumbnailUrl = thumbnailUrl.data.url
        img.status = 'finished'
        // console.log('获取缩略图并生成 Blob URL - ' + img.id)
      }
    }))
    console.timeEnd('获取所有背景图片')
    return CustomBackgroundImage.images
  }

  /** 图片 Blob URL 缓存, 避免重复从 indexeddb 中读取并生成新的 Blob URL */
  private static _imageBlobURLCache: Record<string, string> = {}

  /** 通过 ID 获取图片的 Blog URL */
  static async getImageUrlByID(id: string) {
    // 优先从缓存中取出 URL
    if (CustomBackgroundImage._imageBlobURLCache[id]) return CustomBackgroundImage._imageBlobURLCache[id]
    const image = await DB.get<{ id: string, file: Blob }>(DBTable.BackgroundImageFiles, id)
    CustomBackgroundImage._imageBlobURLCache[id] = URL.createObjectURL(image.file)
    return CustomBackgroundImage._imageBlobURLCache[id]
  }

  /** 通过 ID 获取(URL 链接形式的)图片的 Image URL */
  static async getUrlByImageID(id: string) {
    // 优先从缓存中取出 URL
    if (CustomBackgroundImage._imageBlobURLCache[id]) return CustomBackgroundImage._imageBlobURLCache[id]
    const image = await DB.get<CustomBackgroundImage>(DBTable.BackgroundImages, id)
    CustomBackgroundImage._imageBlobURLCache[id] = image.url as string
    return CustomBackgroundImage._imageBlobURLCache[id]
  }
  /**
   * 删除以保存的图片
   * @param file 图片
   */
  static async remove(file: SettledFileInfo) {
    await DB.delete(DBTable.BackgroundImages, file.id)
    await DB.delete(DBTable.BackgroundImageFiles, file.id)
    await DB.delete(DBTable.BackgroundThumbImageFiles, file.id)
    // const index = CustomBackgroundImage.images.value.findIndex(img => img.id === file.id)
    // CustomBackgroundImage.images.value.splice(index, 1)
  }
  /**
   * 删除所有以保存的图片
   */
  static async clear() {
    await Promise.all([
      DB.clear(DBTable.BackgroundImages),
      DB.clear(DBTable.BackgroundImageFiles),
      DB.clear(DBTable.BackgroundThumbImageFiles),
    ])
    CustomBackgroundImage.images.value = []
  }

  /**
   * 判断响应是否为图片类型
   * @param {Response} response - 响应对象
   * @returns {boolean} 如果响应类型为图片则返回 true，否则返回 false
   */
  static _isImageResponse(response: Response): boolean {
    const contentType = response.headers.get('Content-Type')
    return contentType ? contentType.startsWith('image/') : false
  }

  /**
   * 直接调用 a-upload 的请求方法保存图片
   * @param image 自定义图片对象
   */
  static async saveImage(img: CustomBackgroundImage) {
    const options: CustomRequestOptions = {
      file: img as SettledFileInfo,
      onProgress: function (e: { percent: number }): void {
        img.percentage = e.percent
      },
      onFinish: function (): void {
        img.status = 'finished'
        img.percentage = 100
      },
      onError: function (): void {
        img.status = 'error'
      }
    }
    await CustomBackgroundImage.save(options)
    return img
  }
  /**
   * 保存 URL 格式的图片
   * @param url 图片 URL
   */
  static async saveRemoteImage(url: string) {
    const id = 'url-' + Date.now()
    const image: Omit<CustomBackgroundImage, 'url' | 'thumbnailUrl'> = {
      id,
      name: id,
      status: 'finished'
    }
    const blob = await Toolkit.getImageBlobFromUrl(url)
    const img = new CustomBackgroundImage({
      ...image,
      file: null,
      $blob: blob,
      type: blob.type,
      url,
      batchId: image.id || null,
    })
    await CustomBackgroundImage.saveImage(img)
    Reflect.deleteProperty(img, '$blob')
    CustomBackgroundImage.images.value.push(img)
  }
  static async saveClipboardImage() {
    const image = await CustomBackgroundImage.getClipboardImage()
    const fileName = `copy-${Date.now()}.${image.type.split('/')[1]}`
    const id = fileName.split('.')[0]
    const img = new CustomBackgroundImage({
      id,
      name: fileName,
      file: null,
      $blob: image,
      type: image.type,
      status: 'finished',
      batchId: id,
    })
    await CustomBackgroundImage.saveImage(img)
    Reflect.deleteProperty(img, '$blob')
    CustomBackgroundImage.images.value.push(img)
  }
  static async getClipboardImage() {
    try {
      const clipboardItems = await navigator.clipboard.read();

      for (const clipboardItem of clipboardItems) {
        const types = clipboardItem.types;

        for (const type of types) {
          if (type.startsWith('image/')) {
            const blob = await clipboardItem.getType(type);
            return blob
          }
        }
      }

      throw new Error('剪贴板中没有图片数据');
    } catch (error) {
      throw new Error('获取剪贴板数据失败');
    }
  }
}
