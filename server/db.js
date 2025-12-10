import Datastore from 'nedb-promises'
import fs from 'fs'
import path from 'path'

const dataDir = path.join(process.cwd(), 'server', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

export const users = Datastore.create({ filename: path.join(dataDir, 'users.db'), autoload: true })
export const projects = Datastore.create({ filename: path.join(dataDir, 'projects.db'), autoload: true })
export const directions = Datastore.create({ filename: path.join(dataDir, 'directions.db'), autoload: true })
export const aiConfigs = Datastore.create({ filename: path.join(dataDir, 'ai_configs.db'), autoload: true })
export const userSettings = Datastore.create({ filename: path.join(dataDir, 'user_settings.db'), autoload: true })
export const literatureSites = Datastore.create({ filename: path.join(dataDir, 'literature_sites.db'), autoload: true })

export async function initSchema() {
  await users.ensureIndex({ fieldName: 'username', unique: true })
  await projects.ensureIndex({ fieldName: 'user_id' })
  await directions.ensureIndex({ fieldName: 'project_id' })
  await aiConfigs.ensureIndex({ fieldName: 'user_id', unique: false })
  await aiConfigs.ensureIndex({ fieldName: 'api_name', unique: false })
  await userSettings.ensureIndex({ fieldName: 'user_id', unique: true })
  await literatureSites.ensureIndex({ fieldName: 'user_id', unique: false })
  await literatureSites.ensureIndex({ fieldName: 'site_name', unique: false })
}

const db = { users, projects, directions, aiConfigs, userSettings, literatureSites }
export default db
