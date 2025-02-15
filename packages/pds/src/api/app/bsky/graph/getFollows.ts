import { Server } from '../../../../lexicon'
import { InvalidRequestError } from '@atproto/xrpc-server'
import { paginate, TimeCidKeyset } from '../../../../db/pagination'
import AppContext from '../../../../context'
import { notSoftDeletedClause } from '../../../../db/util'

export default function (server: Server, ctx: AppContext) {
  server.app.bsky.graph.getFollows({
    auth: ctx.accessVerifier,
    handler: async ({ params, auth }) => {
      const { user, limit, before } = params
      const requester = auth.credentials.did
      const { services, db } = ctx
      const { ref } = db.db.dynamic

      const actorService = services.actor(db)

      const creatorRes = await actorService.getUser(user)
      if (!creatorRes) {
        throw new InvalidRequestError(`User not found: ${user}`)
      }

      let followsReq = ctx.db.db
        .selectFrom('follow')
        .where('follow.creator', '=', creatorRes.did)
        .innerJoin('did_handle as subject', 'subject.did', 'follow.subjectDid')
        .innerJoin(
          'repo_root as subject_repo',
          'subject_repo.did',
          'follow.subjectDid',
        )
        .where(notSoftDeletedClause(ref('subject_repo')))
        .selectAll('subject')
        .select(['follow.cid as cid', 'follow.createdAt as createdAt'])

      const keyset = new TimeCidKeyset(
        ref('follow.createdAt'),
        ref('follow.cid'),
      )
      followsReq = paginate(followsReq, {
        limit,
        before,
        keyset,
      })

      const followsRes = await followsReq.execute()
      const [follows, subject] = await Promise.all([
        actorService.views.actorWithInfo(followsRes, requester),
        actorService.views.actorWithInfo(creatorRes, requester),
      ])

      return {
        encoding: 'application/json',
        body: {
          subject,
          follows,
          cursor: keyset.packFromResult(followsRes),
        },
      }
    },
  })
}
