import { Server } from '../../../lexicon'
import AppContext from '../../../context'
import getTimeline from './feed/getTimeline'
import getAuthorFeed from './feed/getAuthorFeed'
import getVotes from './feed/getVotes'
import setVote from './feed/setVote'
import getPostThread from './feed/getPostThread'
import getProfile from './actor/getProfile'
import getProfiles from './actor/getProfiles'
import updateProfile from './actor/updateProfile'
import getRepostedBy from './feed/getRepostedBy'
import getFollowers from './graph/getFollowers'
import getFollows from './graph/getFollows'
import mute from './graph/mute'
import unmute from './graph/unmute'
import getMutes from './graph/getMutes'
import getUsersSearch from './actor/search'
import getUsersTypeahead from './actor/searchTypeahead'
import getNotifications from './notification/list'
import getNotificationCount from './notification/getCount'
import getSuggestions from './actor/getSuggestions'
import postNotificationsSeen from './notification/updateSeen'
import hide from './feed/hide'
import unhide from './feed/unhide'

export default function (server: Server, ctx: AppContext) {
  getTimeline(server, ctx)
  getAuthorFeed(server, ctx)
  getVotes(server, ctx)
  setVote(server, ctx)
  getPostThread(server, ctx)
  getProfile(server, ctx)
  getProfiles(server, ctx)
  updateProfile(server, ctx)
  getRepostedBy(server, ctx)
  getFollowers(server, ctx)
  getFollows(server, ctx)
  mute(server, ctx)
  unmute(server, ctx)
  getMutes(server, ctx)
  getUsersSearch(server, ctx)
  getUsersTypeahead(server, ctx)
  getNotifications(server, ctx)
  getNotificationCount(server, ctx)
  getSuggestions(server, ctx)
  postNotificationsSeen(server, ctx)
  hide(server, ctx)
  unhide(server, ctx)
}
