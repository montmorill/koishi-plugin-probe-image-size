import type { Context } from 'koishi'
import {} from '@koishijs/plugin-help'
import { h, Logger, Schema } from 'koishi'
import probe from 'probe-image-size'

export const name = 'probe-image-size'
const logger = new Logger(name)

export interface Config {
  command: boolean
  transform: boolean
}

export const Config: Schema<Config> = Schema.object({
  command: Schema.boolean().default(true).description('启用 probe-image-size 命令。'),
  transform: Schema.boolean().default(true).description('为所有图片设置宽度和高度。'),
})

async function processImage(attrs: h['attrs'], children: h['children']) {
  const element = h('img', attrs, children)
  const src: string = attrs.src || attrs.url
  if (src.toLowerCase().endsWith('.gif'))
    return element
  if (!attrs.width || !attrs.height) {
    try {
      const { width, height } = await probe(encodeURI(src))
      if (typeof attrs.width === 'number')
        attrs.height = height / width * attrs.width
      else if (typeof attrs.height === 'number')
        attrs.width = width / height * attrs.height
      else
        [attrs.width, attrs.height] = [width, height]
    }
    catch (e) {
      logger.warn(e)
    }
  }
  return element
}

export function apply(ctx: Context, config: Config) {
  config.command && ctx.command('probe-image-size <content:string>', '嗅探图片信息')
    .action(async (_, content: string) => {
      const [{ attrs }] = h.parse(content)
      const url = attrs.src || attrs.url || attrs.content
      const result = await probe(encodeURI(url))
      return h.text(Object.entries(result)
        .map(([key, value]) => `${key}: ${value}`).join('\n'))
    })

  config.transform && ctx.before('send', async (session) => {
    await h.transformAsync(session.elements || [], {
      img: processImage,
      image: processImage,
    })
  })
}
