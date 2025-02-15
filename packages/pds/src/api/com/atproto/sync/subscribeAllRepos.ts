import { Server } from '../../../../lexicon'
import AppContext from '../../../../context'
import Outbox from '../../../../sequencer/outbox'
import { OutputSchema as RepoEvent } from '../../../../lexicon/types/com/atproto/sync/subscribeAllRepos'
import { InfoFrame, InvalidRequestError } from '@atproto/xrpc-server'

export default function (server: Server, ctx: AppContext) {
  server.com.atproto.sync.subscribeAllRepos(async function* ({ params }) {
    const { cursor } = params
    const outbox = new Outbox(ctx.sequencer, {
      maxBufferSize: ctx.cfg.maxSubscriptionBuffer,
    })

    const backfillTime = new Date(
      Date.now() - ctx.cfg.repoBackfillLimitMs,
    ).toISOString()
    if (cursor) {
      const [next, curr] = await Promise.all([
        ctx.sequencer.next(cursor),
        ctx.sequencer.curr(),
      ])
      if (next && next.sequencedAt < backfillTime) {
        yield new InfoFrame({
          info: 'OutdatedCursor',
          message: 'Requested cursor exceeded limit. Possibly missing events',
        })
      }
      if (curr && cursor > curr.seq) {
        throw new InvalidRequestError('Cursor in the future.', 'FutureCursor')
      }
    }

    for await (const evt of outbox.events(cursor, backfillTime)) {
      const { seq, time, repo, commit, prev, blocks, blobs } = evt
      const toYield: RepoEvent = {
        seq,
        event: 'repo_append',
        repo,
        commit,
        blocks,
        blobs,
        time,
      }
      // Undefineds not allowed by dag-cbor encoding
      if (prev !== undefined) {
        toYield.prev = prev
      }
      yield toYield
    }
  })
}
