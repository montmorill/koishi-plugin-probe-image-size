import type { Context, Dict } from 'koishi'
import { h, Schema } from 'koishi'
import probe from 'probe-image-size'

export const name = 'probe-image-size'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

async function processAttrs(attrs: Dict) {
  if (!attrs.width || !attrs.height) {
    const { width, height } = await probe(attrs.src)
    attrs.width = width
    attrs.height = height
  }
}

export function apply(ctx: Context) {
  ctx.before('send', async (session) => {
    await h.transformAsync(session.elements || [], {
      async img(attrs, children) {
        await processAttrs(attrs)
        return h('img', attrs, children)
      },
      async image(attrs, children) {
        await processAttrs(attrs)
        return h('image', attrs, children)
      },
    })
  })
}
