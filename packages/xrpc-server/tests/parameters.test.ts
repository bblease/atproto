import * as http from 'http'
import { createServer, closeServer } from './_util'
import * as xrpcServer from '../src'
import xrpc from '@atproto/xrpc'

const LEXICONS = [
  {
    lexicon: 1,
    id: 'io.example.paramTest',
    defs: {
      main: {
        type: 'query',
        parameters: {
          type: 'params',
          required: ['str', 'int', 'num', 'bool', 'arr'],
          properties: {
            str: { type: 'string', minLength: 2, maxLength: 10 },
            int: { type: 'integer', minimum: 2, maximum: 10 },
            num: { type: 'number', minimum: 2, maximum: 10 },
            bool: { type: 'boolean' },
            arr: { type: 'array', items: { type: 'integer' }, maxLength: 2 },
            def: { type: 'integer', default: 0 },
          },
        },
        output: {
          encoding: 'application/json',
        },
      },
    },
  },
]

describe('Parameters', () => {
  let s: http.Server
  const server = xrpcServer.createServer(LEXICONS)
  server.method(
    'io.example.paramTest',
    (ctx: { params: xrpcServer.Params }) => ({
      encoding: 'json',
      body: ctx.params,
    }),
  )
  const client = xrpc.service(`http://localhost:8889`)
  xrpc.addLexicons(LEXICONS)
  beforeAll(async () => {
    s = await createServer(8889, server)
  })
  afterAll(async () => {
    await closeServer(s)
  })

  it('validates query params', async () => {
    const res1 = await client.call('io.example.paramTest', {
      str: 'valid',
      int: 5,
      num: 5.5,
      bool: true,
      arr: [1, 2],
      def: 5,
    })
    expect(res1.success).toBeTruthy()
    expect(res1.data.str).toBe('valid')
    expect(res1.data.int).toBe(5)
    expect(res1.data.num).toBe(5.5)
    expect(res1.data.bool).toBe(true)
    expect(res1.data.arr).toEqual([1, 2])
    expect(res1.data.def).toEqual(5)

    const res2 = await client.call('io.example.paramTest', {
      str: 10,
      int: '5',
      num: '5.5',
      bool: 'foo',
      arr: '3',
    })
    expect(res2.success).toBeTruthy()
    expect(res2.data.str).toBe('10')
    expect(res2.data.int).toBe(5)
    expect(res2.data.num).toBe(5.5)
    expect(res2.data.bool).toBe(true)
    expect(res2.data.arr).toEqual([3])
    expect(res2.data.def).toEqual(0)

    // @TODO test sending blatantly bad types
    await expect(
      client.call('io.example.paramTest', {
        str: 'n',
        int: 5,
        num: 5.5,
        bool: true,
        arr: [1],
      }),
    ).rejects.toThrow('str must not be shorter than 2 characters')
    await expect(
      client.call('io.example.paramTest', {
        str: 'loooooooooooooong',
        int: 5,
        num: 5.5,
        bool: true,
        arr: [1],
      }),
    ).rejects.toThrow('str must not be longer than 10 characters')
    await expect(
      client.call('io.example.paramTest', {
        int: 5,
        num: 5.5,
        bool: true,
        arr: [1],
      }),
    ).rejects.toThrow(`Params must have the property "str"`)

    await expect(
      client.call('io.example.paramTest', {
        str: 'valid',
        int: -1,
        num: 5.5,
        bool: true,
        arr: [1],
      }),
    ).rejects.toThrow('int can not be less than 2')
    await expect(
      client.call('io.example.paramTest', {
        str: 'valid',
        int: 11,
        num: 5.5,
        bool: true,
        arr: [1],
      }),
    ).rejects.toThrow('int can not be greater than 10')
    await expect(
      client.call('io.example.paramTest', {
        str: 'valid',
        num: 5.5,
        bool: true,
        arr: [1],
      }),
    ).rejects.toThrow(`Params must have the property "int"`)

    await expect(
      client.call('io.example.paramTest', {
        str: 'valid',
        int: 5,
        num: -5.5,
        bool: true,
        arr: [1],
      }),
    ).rejects.toThrow('num can not be less than 2')
    await expect(
      client.call('io.example.paramTest', {
        str: 'valid',
        int: 5,
        num: 50.5,
        bool: true,
        arr: [1],
      }),
    ).rejects.toThrow('num can not be greater than 10')
    await expect(
      client.call('io.example.paramTest', {
        str: 'valid',
        int: 5,
        bool: true,
        arr: [1],
      }),
    ).rejects.toThrow(`Params must have the property "num"`)

    await expect(
      client.call('io.example.paramTest', {
        str: 'valid',
        int: 5,
        num: 5.5,
        arr: [1],
      }),
    ).rejects.toThrow(`Params must have the property "bool"`)

    await expect(
      client.call('io.example.paramTest', {
        str: 'valid',
        int: 5,
        num: 5.5,
        bool: true,
        arr: [],
      }),
    ).rejects.toThrow('Error: Params must have the property "arr"')
    await expect(
      client.call('io.example.paramTest', {
        str: 'valid',
        int: 5,
        num: 5.5,
        bool: true,
        arr: [1, 2, 3],
      }),
    ).rejects.toThrow('Error: arr must not have more than 2 elements')
  })
})
