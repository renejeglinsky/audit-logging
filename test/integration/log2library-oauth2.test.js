const cds = require('@sap/cds')

cds.env.requires['audit-log'] = {
  kind: 'audit-log-to-library',
  impl: '../../srv/log2library',
  credentials: process.env.ALS_CREDS_OAUTH2 && JSON.parse(process.env.ALS_CREDS_OAUTH2)
}

// stay in provider account (i.e., use "$PROVIDER")
cds.env.requires.auth.users.alice.tenant = cds.env.requires['audit-log'].credentials.uaa.tenantid

describe('Log to Audit Log Service via library with oauth2 plan', () => {
  if (!cds.env.requires['audit-log'].credentials)
    return test.skip('Skipping tests due to missing credentials', () => {})

  require('./tests')
})