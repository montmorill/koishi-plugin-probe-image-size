import type { Context, Dict } from 'koishi'
import { h, Schema } from 'koishi'
import probe from 'probe-image-size'

export const name = 'probe-image-size'

export interface Config { }

export const Config: Schema<Config> = Schema.object({})

async function processAttrs(attrs: Dict) {
  if (!attrs.width || !attrs.height) {
    const { width, height } = await probe(attrs.src)
    if (typeof attrs.width === 'number')
      attrs.height = height / width * attrs.width
    else if (typeof attrs.height === 'number')
      attrs.width = width / height * attrs.height
    else
      [attrs.width, attrs.height] = [width, height]
  }
  // eslint-disable-next-line style/multiline-ternary
  const scale = typeof attrs.scale === 'number' ? attrs.scale
    : typeof attrs.zoom === 'number' ? attrs.zoom : 1
  if (typeof scale === 'number') {
    if (scale > 0) {
      attrs.width *= scale
      attrs.height *= scale
    }
  }
}

export function apply(ctx: Context) {
  ctx.command('probe-image-size <url:string>')
    .action(async (_, url) => {
      const result = await probe(url)
      return h.text(Object.entries(result)
        .map(([key, value]) => `${key}: ${value}`).join('\n'))
    })

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
