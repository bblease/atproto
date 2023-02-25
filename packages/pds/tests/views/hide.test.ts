import AtpAgent from '@atproto/api'
import { Main as FeedViewPost } from '../../src/lexicon/types/app/bsky/feed/feedViewPost'
import {
  runTestServer,
  forSnapshot,
  CloseFn,
  getOriginator,
  adminAuth,
} from '../_util'
import { SeedClient } from '../seeds/client'
import basicSeed from '../seeds/basic'
import { FeedAlgorithm } from '../../src/api/app/bsky/util/feed'

describe('hide certain posts from the user feed', () => {
  let agent: AtpAgent
  let close: CloseFn
  let sc: SeedClient

  // account dids, for convenience
  let alice: string
  let bob: string
  let dan: string

  beforeAll(async () => {
    const server = await runTestServer({
      dbPostgresSchema: 'views_home_feed',
    })
    close = server.close
    agent = new AtpAgent({ service: server.url })
    sc = new SeedClient(agent)
    await basicSeed(sc, server.ctx.messageQueue)
    alice = sc.dids.alice
    bob = sc.dids.bob
    dan = sc.dids.dan
  })

  afterAll(async () => {
    await close()
  })

  it('hides a post from the user feed.', async () => {
    const postUri1 = sc.posts[dan][1].ref.uriStr // Repost
    const postUri2 = sc.replies[bob][0].ref.uriStr // Post and reply parent
    
    const actionResults = await Promise.all(
      [postUri1, postUri2].map((postUri) =>
        agent.api.app.bsky.feed.hide(
          {
            uri: postUri
          },
          {
            encoding: 'application/json',
            headers: sc.getHeaders(alice),
          },
        ),
      ),
    )

    const aliceTL = await agent.api.app.bsky.feed.getTimeline(
      { algorithm: FeedAlgorithm.ReverseChronological },
      { headers: sc.getHeaders(alice) },
    )

    expect(forSnapshot(aliceTL.data.feed)).toMatchSnapshot()
  })
})
