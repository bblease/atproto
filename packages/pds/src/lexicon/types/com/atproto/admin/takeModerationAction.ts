/**
 * GENERATED CODE - DO NOT MODIFY
 */
import express from 'express'
import { HandlerAuth } from '@atproto/xrpc-server'
import * as ComAtprotoRepoRepoRef from '../repo/repoRef'
import * as ComAtprotoRepoRecordRef from '../repo/recordRef'
import * as ComAtprotoAdminModerationAction from './moderationAction'

export interface QueryParams {}

export interface InputSchema {
  action:
    | 'com.atproto.admin.moderationAction#takedown'
    | 'com.atproto.admin.moderationAction#flag'
    | 'com.atproto.admin.moderationAction#acknowledge'
    | (string & {})
  subject:
    | ComAtprotoRepoRepoRef.Main
    | ComAtprotoRepoRecordRef.Main
    | { $type: string; [k: string]: unknown }
  reason: string
  createdBy: string
  [k: string]: unknown
}

export type OutputSchema = ComAtprotoAdminModerationAction.View

export interface HandlerInput {
  encoding: 'application/json'
  body: InputSchema
}

export interface HandlerSuccess {
  encoding: 'application/json'
  body: OutputSchema
}

export interface HandlerError {
  status: number
  message?: string
}

export type HandlerOutput = HandlerError | HandlerSuccess
export type Handler<HA extends HandlerAuth = never> = (ctx: {
  auth: HA
  params: QueryParams
  input: HandlerInput
  req: express.Request
  res: express.Response
}) => Promise<HandlerOutput> | HandlerOutput
