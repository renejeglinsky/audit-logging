const cds = require('@sap/cds')

cds.env.requires['audit-log'] = {
  kind: 'audit-log-to-console',
  impl: '../../srv/log2console',
  outbox: true
}

const { POST, GET } = cds.test(__dirname)

const wait = require('util').promisify(setTimeout)

describe('AuditLogService API with kind audit-log-to-console', () => {
  let __log, _logs
  const _log = (...args) => {
    if (!(args.length === 1 && typeof args[0] === 'string' && args[0].match(/\[audit-log\]/i))) {
      // > not an audit log (most likely, anyway)
      return __log(...args)
    }

    _logs.push(JSON.parse(args[0].split('\n').slice(1).join('')))
  }

  const ALICE = { username: 'alice', password: 'password' }

  beforeAll(async () => {
    __log = global.console.log
    global.console.log = _log
  })

  afterAll(() => {
    global.console.log = __log
  })

  beforeEach(async () => {
    await POST('/api/resetSequence', {}, { auth: ALICE })
    _logs = []
  })

  describe('default', () => {
    test('emit is deferred', async () => {
      const response = await POST('/api/testEmit', {}, { auth: ALICE })
      expect(response).toMatchObject({ status: 204 })
      await wait(42)
      const { data: { value: sequence }} = await GET('/api/getSequence()', { auth: ALICE })
      expect(sequence).toEqual(['request succeeded', 'audit log logged'])
      expect(_logs.length).toBe(1)
      expect(_logs).toContainMatchObject({ user: 'alice', bar: 'baz' })
    })
  
    test('send is immediate', async () => {
      const response = await POST('/api/testSend', {}, { auth: ALICE })
      expect(response).toMatchObject({ status: 204 })
      await wait(42)
      const { data: { value: sequence }} = await GET('/api/getSequence()', { auth: ALICE })
      expect(sequence).toEqual(['audit log logged', 'request succeeded'])
      expect(_logs.length).toBe(1)
      expect(_logs).toContainMatchObject({ user: 'alice', bar: 'baz' })
    })
  })

  describe('new', () => {
    test('log is deferred', async () => {
      const response = await POST('/api/testLog', {}, { auth: ALICE })
      expect(response).toMatchObject({ status: 204 })
      await wait(42)
      const { data: { value: sequence }} = await GET('/api/getSequence()', { auth: ALICE })
      expect(sequence).toEqual(['request succeeded', 'audit log logged'])
      expect(_logs.length).toBe(1)
      expect(_logs).toContainMatchObject({ user: 'alice', bar: 'baz' })
    })
  
    test('logSync is immediate', async () => {
      const response = await POST('/api/testLogSync', {}, { auth: ALICE })
      expect(response).toMatchObject({ status: 204 })
      await wait(42)
      const { data: { value: sequence }} = await GET('/api/getSequence()', { auth: ALICE })
      expect(sequence).toEqual(['audit log logged', 'request succeeded'])
      expect(_logs.length).toBe(1)
      expect(_logs).toContainMatchObject({ user: 'alice', bar: 'baz' })
    })
  })

  describe('compat', () => {
    test('dataAccessLog', async () => {
      const response = await POST('/api/testDataAccessLog', {}, { auth: ALICE })
      expect(response).toMatchObject({ status: 204 })
      expect(_logs.length).toBe(1)
      // REVISIT: data structure is not yet final
      expect(_logs).toContainMatchObject({
        user: 'alice',
        dataObject: { type: 'test', id: [{ keyName: 'test', value: 'test' }] },
        dataSubject: { type: 'test', role: 'test', id: [{ keyName: 'test', value: 'test' }] },
        attributes: [{ name: 'test' }]
      })
    })

    test('dataModificationLog', async () => {
      const response = await POST('/api/testDataModificationLog', {}, { auth: ALICE })
      expect(response).toMatchObject({ status: 204 })
      expect(_logs.length).toBe(1)
      // REVISIT: data structure is not yet final
      expect(_logs).toContainMatchObject({
        user: 'alice',
        dataObject: { type: 'test', id: [{ keyName: 'test', value: 'test' }] },
        dataSubject: { type: 'test', role: 'test', id: [{ keyName: 'test', value: 'test' }] },
        attributes: [{ name: 'test', oldValue: 'test', newValue: 'test' }]
      })
    })

    test('configChangeLog', async () => {
      const response = await POST('/api/testConfigChangeLog', {}, { auth: ALICE })
      expect(response).toMatchObject({ status: 204 })
      expect(_logs.length).toBe(1)
      // REVISIT: data structure is not yet final
      expect(_logs).toContainMatchObject({
        user: 'alice',
        dataObject: { type: 'test', id: [{ keyName: 'test', value: 'test' }] },
        attributes: [{ name: 'test', oldValue: 'test', newValue: 'test' }]
      })
    })

    test('testSecurityLog', async () => {
      const response = await POST('/api/testSecurityLog', {}, { auth: ALICE })
      expect(response).toMatchObject({ status: 204 })
      expect(_logs.length).toBe(1)
      // REVISIT: data structure is not yet final
      expect(_logs).toContainMatchObject({ user: 'alice', action: 'dummy', data: 'dummy' })
    })
  })
})