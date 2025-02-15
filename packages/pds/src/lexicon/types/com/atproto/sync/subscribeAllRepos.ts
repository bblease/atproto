/**
 * GENERATED CODE - DO NOT MODIFY
 */
import { ValidationResult } from '@atproto/lexicon'
import { lexicons } from '../../../../lexicons'
import { isObj, hasProp } from '../../../../util'
import { HandlerAuth, InfoFrame, ErrorFrame } from '@atproto/xrpc-server'
import { IncomingMessage } from 'http'

export interface QueryParams {
  /** The last known event to backfill from. */
  cursor?: number
}

export interface OutputSchema {
  seq: number
  event: 'repo_append' | 'rebase' | (string & {})
  repo: string
  commit: string
  prev?: string
  blocks: {}
  blobs: string[]
  time: string
  [k: string]: unknown
}

export type HandlerError = ErrorFrame<'FutureCursor'>
export type HandlerInfo = InfoFrame<'OutdatedCursor'>
export type HandlerOutput = HandlerInfo | HandlerError | OutputSchema
export type Handler<HA extends HandlerAuth = never> = (ctx: {
  auth: HA
  params: QueryParams
  req: IncomingMessage
}) => AsyncIterable<HandlerOutput>
