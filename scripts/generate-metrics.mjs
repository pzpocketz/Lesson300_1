import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const asOfDate = new Date()
const year = asOfDate.getFullYear()
const lastDate = new Date(Date.UTC(year, asOfDate.getMonth(), asOfDate.getDate()))
let seed = 3001

function random() {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

function between(min, max) {
  return Math.round(min + random() * (max - min))
}

function countFor(mean) {
  const whole = Math.floor(mean)
  return whole + (random() < mean - whole ? 1 : 0)
}

const rooms = [
  { id: 'kitchen', name: 'Kitchen', activity: 1.35 },
  { id: 'pantry', name: 'Pantry', activity: 1.28 },
  { id: 'sunroom', name: 'Sunroom', activity: 1.12 },
  { id: 'living-room', name: 'Living room', activity: 0.92 },
  { id: 'bedroom', name: 'Bedroom', activity: 0.72 },
]

const pests = [
  { id: 'mice', name: 'Mice', base: 0.62, season: [1.45, 1.38, 1.2, 0.92, 0.72, 0.58, 0.54, 0.6, 0.86, 1.16, 1.42, 1.56] },
  { id: 'beetles', name: 'Beetles', base: 0.76, season: [0.34, 0.36, 0.52, 0.86, 1.34, 1.65, 1.73, 1.6, 1.18, 0.72, 0.43, 0.34] },
  { id: 'flies', name: 'Flies', base: 0.94, season: [0.3, 0.32, 0.48, 0.96, 1.42, 1.72, 1.8, 1.66, 1.25, 0.76, 0.4, 0.28] },
  { id: 'spiders', name: 'Spiders', base: 0.58, season: [0.66, 0.62, 0.72, 0.86, 0.98, 1.02, 0.98, 1.04, 1.42, 1.65, 1.32, 0.82] },
]

const employees = [
  { id: 'jupiter', name: 'Jupiter', title: 'Head of patrol', shift: 'A.M.', treatRate: 2.4, color: '#bf7648' },
  { id: 'cleo', name: 'Cleo', title: 'Night watch', shift: 'P.M.', treatRate: 2.1, color: '#38766a' },
]

const inventory = [
  { id: 'salmon-bites', name: 'Salmon bites', category: 'Daily reward', quantity: 28, unit: 'pieces', threshold: 36 },
  { id: 'crunchies', name: 'Golden crunchies', category: 'Patrol bonus', quantity: 74, unit: 'pieces', threshold: 40 },
  { id: 'catnip', name: 'Wild catnip', category: 'Morale boost', quantity: 3, unit: 'bundles', threshold: 5 },
  { id: 'feather-wands', name: 'Feather wands', category: 'Training kit', quantity: 7, unit: 'wands', threshold: 2 },
]

function describeWeather(code) {
  if (code === 0) return 'Clear'
  if ([1, 2].includes(code)) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if ([45, 48].includes(code)) return 'Fog'
  if (code >= 51 && code <= 67) return 'Rain'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain showers'
  if (code >= 95) return 'Thunderstorms'
  return 'Mixed clouds'
}

const dateString = (date) => date.toISOString().slice(0, 10)
const archiveUrl = new URL('https://archive-api.open-meteo.com/v1/archive')
archiveUrl.search = new URLSearchParams({
  latitude: '37.8044',
  longitude: '-122.2712',
  start_date: `${year}-01-01`,
  end_date: dateString(lastDate),
  daily: 'weather_code,temperature_2m_mean,precipitation_sum,sunshine_duration',
  timezone: 'America/Los_Angeles',
}).toString()
const archiveResponse = await fetch(archiveUrl)
if (!archiveResponse.ok) throw new Error(`Open-Meteo archive request failed: ${archiveResponse.status}`)
const archiveData = await archiveResponse.json()
const historicalWeather = new Map(archiveData.daily.time.map((date, index) => [date, {
  code: archiveData.daily.weather_code[index],
  temperature: Math.round(archiveData.daily.temperature_2m_mean[index]),
  precipitationMm: Math.round((archiveData.daily.precipitation_sum[index] ?? 0) * 10) / 10,
  sunshineHours: Math.round((archiveData.daily.sunshine_duration[index] ?? 0) / 360) / 10,
}]))

const daily = []
for (let date = new Date(Date.UTC(year, 0, 1)); date <= lastDate; date.setUTCDate(date.getUTCDate() + 1)) {
  const month = date.getUTCMonth()
  const dayKey = dateString(date)
  const weather = historicalWeather.get(dayKey)
  if (!weather) throw new Error(`Missing Open-Meteo archive record for ${dayKey}`)
  const openWindowFactor = weather.temperature >= 18 && weather.precipitationMm < 1 ? 1.2 : 1
  const roomRecords = rooms.map((room) => {
    const roomPests = pests.map((pest) => {
      const mean = pest.base * pest.season[month] * room.activity * openWindowFactor * (0.72 + random() * 0.56)
      const sightings = countFor(mean)
      const kills = Math.min(sightings, countFor(sightings * (0.48 + random() * 0.36)))
      return { pestId: pest.id, sightings, kills }
    })
    return {
      roomId: room.id,
      pests: roomPests,
      sightings: roomPests.reduce((sum, item) => sum + item.sightings, 0),
      kills: roomPests.reduce((sum, item) => sum + item.kills, 0),
    }
  })
  const totalKills = roomRecords.reduce((sum, room) => sum + room.kills, 0)
  const workingCats = random() > 0.82 ? employees : [employees[random() < 0.52 ? 0 : 1]]
  const remainingKills = { total: totalKills }
  const crew = workingCats.map((employee, index) => {
    const assignedKills = index === workingCats.length - 1
      ? remainingKills.total
      : Math.floor(totalKills * (0.42 + random() * 0.12))
    remainingKills.total -= assignedKills
    return {
      employeeId: employee.id,
      hours: between(3, 6),
      kills: assignedKills,
      treats: Math.round(assignedKills * employee.treatRate + between(3, 8)),
      naps: between(1, 3),
      enjoymentScore: Math.max(1, Math.min(5, Math.round(3.2 + Math.min(weather.sunshineHours, 8) * 0.1 + (assignedKills > 8 ? 0.3 : 0) + (random() - 0.5) * 1.5))),
    }
  })
  const hourlyKills = Array.from({ length: 10 }, () => 0)
  for (let kill = 0; kill < totalKills; kill += 1) {
    const hour = Math.min(9, Math.floor(Math.pow(random(), 0.72) * 10))
    hourlyKills[hour] += 1
  }
  daily.push({
    date: dayKey,
    weather: {
      code: weather.code,
      label: describeWeather(weather.code),
      temperature: weather.temperature,
      precipitationMm: weather.precipitationMm,
      sunshineHours: weather.sunshineHours,
    },
    rooms: roomRecords,
    crew,
    hourlyKills,
    sightings: roomRecords.reduce((sum, room) => sum + room.sightings, 0),
    kills: totalKills,
    treatRevenue: totalKills * 5 + (crew.length ? between(4, 10) : 0),
  })
}

const dataset = { year, weatherSource: 'Open-Meteo archive', weatherLocation: 'Oakland, California', rooms, pests: pests.map(({ id, name }) => ({ id, name })), employees, inventory, daily }
const outputPath = resolve(projectRoot, 'src/data/metrics.json')
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(dataset, null, 2)}\n`)
console.log(`Generated ${daily.length} year-to-date records through ${dateString(lastDate)} with Oakland weather: ${outputPath}`)