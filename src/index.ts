import type { Context } from 'koishi'
import {} from '@koishijs/plugin-help'
import { h, Logger, Schema } from 'koishi'
import probe from 'probe-image-size'

export const name = 'probe-image-size'
const logger = new Logger(name)

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

async function processImage(attrs: h['attrs'], children: h['children']) {
  if (!attrs.width || !attrs.height) {
    try {
      const { width, height } = await probe(attrs.src)
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
  return h('img', attrs, children)
}

export function apply(ctx: Context) {
  ctx.command('probe-image-size <content:string>', '嗅探图片信息')
    .action(async (_, content: string) => {
      const [{ attrs }] = h.parse(content)
      const url = attrs.src || attrs.url || attrs.content
      const result = await probe(url)
      return h.text(Object.entries(result)
        .map(([key, value]) => `${key}: ${value}`).join('\n'))
    })

  ctx.before('send', async (session) => {
    await h.transformAsync(session.elements || [], {
      img: processImage,
      image: processImage,
    })
  })
}
