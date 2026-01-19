const users = require('./users.json')
const channels = require('./channels.json')
const channelsInvites = require('./channel_invites.json')
const channelsMembers = require('./channel_members.json')
const verifications = require('./verifications.json')
// the seed data is created by chatgpt ai

// knex db instance
const db = require('../db')

const tableMapping = {
   users: users,
   verifications: verifications,
   channels: channels,
   channel_invites: channelsInvites,
   channel_members: channelsMembers,
}
const tableNames = Object.keys(tableMapping)

const seed = async () => {
   for (let i = 0; i < tableNames.length; i += 1) {
      const tableName = tableNames[i]
      const table = tableMapping[tableName]

      console.log(`Seeding ${table.length} rows into ${tableName} table...`)

      /* eslint-disable */
      await db(tableName).insert(table)
   }
   db.destroy()
}

seed()
