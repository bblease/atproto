import { InvalidRequestError } from '@atproto/xrpc-server'
import { Server } from '../../../../lexicon'
import { FeedAlgorithm, FeedKeyset, composeFeed } from '../util/feed'
import { paginate } from '../../../../db/pagination'
import AppContext from '../../../../context'
import { FeedRow } from '../../../../services/feed'

export default function (server: Server, ctx: AppContext) {
  server.app.bsky.feed.getTimeline({
    auth: ctx.accessVerifier,
    handler: async ({ params, auth }) => {
      const { algorithm, limit, before } = params
      const db = ctx.db.db
      const { ref } = db.dynamic
      const requester = auth.credentials.did
            
      const feedService = ctx.services.feed(ctx.db)
      
      // which users are muted?
      const mutedQb = db
        .selectFrom('mute')
        .select('did')
        .where('mutedByDid', '=', requester)
      
      let postQb;
      switch(algorithm) {
        case FeedAlgorithm.ReverseChronological: {
          const followingIdsSubquery = db
            .selectFrom('follow')
            .select('follow.subjectDid')
            .where('follow.creator', '=', requester)
          
          postsQb = feedService
            .selectPostQb()
            .where((qb) =>
              qb
                .where('creator', '=', requester)
                .orWhere('creator', 'in', followingIdsSubquery),
            )
            .whereNotExists(mutedQb.whereRef('did', '=', ref('post.creator'))) // Hide posts of muted actors
            
          repostsQb = feedService
            .selectRepostQb()
            .where((qb) =>
              qb
                .where('repost.creator', '=', requester)
                .orWhere('repost.creator', 'in', followingIdsSubquery),
            )
            .whereNotExists(
              mutedQb
                .whereRef('did', '=', ref('post.creator')) // Hide reposts of or by muted actors
                .orWhereRef('did', '=', ref('repost.creator')),
            )
        }
        
        case FeedAlgorithm.AllPosts: {
          postsQb = feedService
            .selectPostQb()
            .whereNotExists(mutedQb.whereRef('did', '=', ref('post.creator'))) // Hide posts of muted actors
            
          repostsQb = feedService
            .selectRepostQb()
            .whereNotExists(
              mutedQb
                .whereRef('did', '=', ref('post.creator')) // Hide reposts of or by muted actors
                .orWhereRef('did', '=', ref('repost.creator')),
            )
        }
        default: {
          throw new InvalidRequestError(`Unsupported algorithm: ${algorithm}`)
        }
      }

      const keyset = new FeedKeyset(ref('cursor'), ref('postCid'))
      let feedItemsQb = db
        .selectFrom(postsQb.union(repostsQb).as('feed_items'))
        .selectAll()
      feedItemsQb = paginate(feedItemsQb, {
        limit,
        before,
        keyset,
      })
      const feedItems: FeedRow[] = await feedItemsQb.execute()
      const feed = await composeFeed(feedService, feedItems, requester)

      return {
        encoding: 'application/json',
        body: {
          feed,
          cursor: keyset.packFromResult(feedItems),
        },
      }
    },
  })
}
