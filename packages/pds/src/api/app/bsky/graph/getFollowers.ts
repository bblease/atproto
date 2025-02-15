import { Server } from '../../../../lexicon'
import { InvalidRequestError } from '@atproto/xrpc-server'
import { paginate, TimeCidKeyset } from '../../../../db/pagination'
import AppContext from '../../../../context'
import { notSoftDeletedClause } from '../../../../db/util'

export default function (server: Server, ctx: AppContext) {
  server.app.bsky.graph.getFollowers({
    auth: ctx.accessVerifier,
    handler: async ({ params, auth }) => {
      const { user, limit, before } = params
      const requester = auth.credentials.did
      const { services, db } = ctx
      const { ref } = db.db.dynamic

      const actorService = services.actor(db)

      const subjectRes = await actorService.getUser(user)
      if (!subjectRes) {
        throw new InvalidRequestError(`User not found: ${user}`)
      }

      let followersReq = ctx.db.db
        .selectFrom('follow')
        .where('follow.subjectDid', '=', subjectRes.did)
        .innerJoin('did_handle as creator', 'creator.did', 'follow.creator')
        .innerJoin(
          'repo_root as creator_repo',
          'creator_repo.did',
          'follow.creator',
        )
        .where(notSoftDeletedClause(ref('creator_repo')))
        .selectAll('creator')
        .select(['follow.cid as cid', 'follow.createdAt as createdAt'])

      const keyset = new TimeCidKeyset(
        ref('follow.createdAt'),
        ref('follow.cid'),
      )
      followersReq = paginate(followersReq, {
        limit,
        before,
        keyset,
      })

      const followersRes = await followersReq.execute()
      const [followers, subject] = await Promise.all([
        actorService.views.actorWithInfo(followersRes, requester),
        actorService.views.actorWithInfo(subjectRes, requester),
      ])

      return {
        encoding: 'application/json',
        body: {
          subject,
          followers,
          cursor: keyset.packFromResult(followersRes),
        },
      }
    },
  })
}
