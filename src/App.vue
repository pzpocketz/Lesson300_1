<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useTheme } from 'vuetify'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar, Line } from 'vue-chartjs'
import {
  PhArchiveBox as ArchiveBox,
  PhArrowUpRight as ArrowUpRight,
  PhBell as Bell,
  PhCaretDown as CaretDown,
  PhCheckCircle as CheckCircle,
  PhCloudSun as CloudSun,
  PhHouse as House,
  PhList as List,
  PhMapPin as MapPin,
  PhMoon as Moon,
  PhPackage as Package,
  PhPawPrint as PawPrint,
  PhSun as Sun,
  PhUsers as Users,
  PhWarningCircle as WarningCircle,
  PhWind as Wind,
} from '@phosphor-icons/vue'
import metrics from './data/metrics.json'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler)

type Page = 'dashboard' | 'payroll' | 'inventory'
type WeatherNow = {
  temperature: number
  code: number
  wind: number
  humidity: number
  city: string
  country: string
}

const theme = useTheme()
const accessKey = 'jupiter-pest-control-approved'
const authenticated = ref(sessionStorage.getItem(accessKey) === 'true')
const loginPassword = ref('')
const loginError = ref('')
const drawer = ref(false)
const darkMode = ref(false)
const activePage = ref<Page>('dashboard')
const selectedMonth = ref('all')
const selectedRoom = ref('all')
const selectedPest = ref('all')
const cityQuery = ref('New York')
const weatherNow = ref<WeatherNow | null>(null)
const weatherLoading = ref(false)
const weatherError = ref('')
const inventoryFilter = ref('all')
const orderedItems = ref<string[]>([])
const notice = ref('')

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const navItems = [
  { id: 'dashboard' as const, label: 'Home overview', icon: House },
  { id: 'payroll' as const, label: 'Pawroll', icon: Users },
  { id: 'inventory' as const, label: 'Treat cupboard', icon: ArchiveBox },
]

const filteredDays = computed(() => metrics.daily.filter((day) =>
  selectedMonth.value === 'all' || Number(day.date.slice(5, 7)) - 1 === Number(selectedMonth.value),
))

function countsForDay(day: (typeof metrics.daily)[number]) {
  const roomData = day.rooms.filter((room) => selectedRoom.value === 'all' || room.roomId === selectedRoom.value)
  const pestData = roomData.flatMap((room) => room.pests.filter((pest) => selectedPest.value === 'all' || pest.pestId === selectedPest.value))
  return {
    sightings: pestData.reduce((sum, pest) => sum + pest.sightings, 0),
    kills: pestData.reduce((sum, pest) => sum + pest.kills, 0),
  }
}

const totals = computed(() => {
  const pestTotals = filteredDays.value.reduce((sum, day) => {
    const count = countsForDay(day)
    sum.sightings += count.sightings
    sum.kills += count.kills
    return sum
  }, { sightings: 0, kills: 0 })
  const crewTotals = filteredDays.value.flatMap((day) => day.crew).reduce((sum, shift) => {
    sum.treats += shift.treats
    sum.naps += shift.naps
    sum.shifts += 1
    return sum
  }, { treats: 0, naps: 0, shifts: 0 })
  return { ...pestTotals, ...crewTotals, rate: pestTotals.sightings ? Math.round((pestTotals.kills / pestTotals.sightings) * 100) : 0 }
})

const roomRows = computed(() => metrics.rooms.map((room) => {
  const totalsForRoom = filteredDays.value.reduce((sum, day) => {
    const data = day.rooms.find((entry) => entry.roomId === room.id)
    const pests = data?.pests.filter((pest) => selectedPest.value === 'all' || pest.pestId === selectedPest.value) ?? []
    sum.sightings += pests.reduce((count, pest) => count + pest.sightings, 0)
    sum.kills += pests.reduce((count, pest) => count + pest.kills, 0)
    return sum
  }, { sightings: 0, kills: 0 })
  return { ...room, ...totalsForRoom }
}).sort((a, b) => b.sightings - a.sightings))

const pestRows = computed(() => metrics.pests.map((pest) => {
  const result = filteredDays.value.reduce((sum, day) => {
    const count = day.rooms
      .filter((room) => selectedRoom.value === 'all' || room.roomId === selectedRoom.value)
      .flatMap((room) => room.pests)
      .find((item) => item.pestId === pest.id)
    sum.sightings += count?.sightings ?? 0
    sum.kills += count?.kills ?? 0
    return sum
  }, { sightings: 0, kills: 0 })
  return { ...pest, ...result }
}).sort((a, b) => b.sightings - a.sightings))

const monthlyData = computed<ChartData<'line'>>(() => ({
  labels: monthNames,
  datasets: [
    {
      label: 'Sightings',
      data: monthNames.map((_, month) => filteredDays.value
        .filter((day) => Number(day.date.slice(5, 7)) - 1 === month)
        .reduce((sum, day) => sum + countsForDay(day).sightings, 0)),
      borderColor: '#c96f50',
      backgroundColor: 'rgba(201, 111, 80, .12)',
      fill: true,
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 5,
    },
    {
      label: 'Vanquished',
      data: monthNames.map((_, month) => filteredDays.value
        .filter((day) => Number(day.date.slice(5, 7)) - 1 === month)
        .reduce((sum, day) => sum + countsForDay(day).kills, 0)),
      borderColor: '#317467',
      backgroundColor: '#317467',
      tension: 0.35,
      pointRadius: 2,
      pointHoverRadius: 5,
    },
  ],
}))

const roomChartData = computed<ChartData<'bar'>>(() => ({
  labels: roomRows.value.map((room) => room.name),
  datasets: [{
    label: 'Pests vanquished',
    data: roomRows.value.map((room) => room.kills),
    backgroundColor: ['#32786b', '#d6a64b', '#548f9a', '#cf7556', '#6d8550'],
    borderRadius: 4,
    maxBarThickness: 34,
  }],
}))

const recentDays = computed(() => filteredDays.value.filter((day) => day.crew.length > 0).slice(-14))
const dailyChartData = computed<ChartData<'line'>>(() => ({
  labels: recentDays.value.map((day) => day.date.slice(5)),
  datasets: [{
    label: 'Daily vanquishes',
    data: recentDays.value.map((day) => countsForDay(day).kills),
    borderColor: '#bb7a32',
    backgroundColor: 'rgba(187, 122, 50, .12)',
    fill: true,
    tension: 0.3,
    pointRadius: 2,
  }],
}))

const hourlyChartData = computed<ChartData<'bar'>>(() => ({
  labels: ['7a', '8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p'],
  datasets: [{
    label: 'Vanquishes',
    data: filteredDays.value.reduce((hours, day) => hours.map((count, index) => count + day.hourlyKills[index]), Array(10).fill(0)),
    backgroundColor: '#548f9a',
    borderRadius: 4,
    maxBarThickness: 25,
  }],
}))

const payrollRows = computed(() => metrics.employees.map((employee) => {
  const shifts = filteredDays.value.flatMap((day) => day.crew.filter((shift) => shift.employeeId === employee.id))
  return {
    ...employee,
    days: shifts.length,
    kills: shifts.reduce((sum, shift) => sum + shift.kills, 0),
    treats: shifts.reduce((sum, shift) => sum + shift.treats, 0),
    naps: shifts.reduce((sum, shift) => sum + shift.naps, 0),
    hours: shifts.reduce((sum, shift) => sum + shift.hours, 0),
  }
}))

const inventoryRows = computed(() => metrics.inventory.filter((item) =>
  inventoryFilter.value === 'all' || (inventoryFilter.value === 'low' ? item.quantity < item.threshold : orderedItems.value.includes(item.id)),
))

const alertItems = computed(() => {
  const items = metrics.inventory.filter((item) => item.quantity < item.threshold)
    .map((item) => ({ title: `${item.name} is running low`, detail: `${item.quantity} ${item.unit} left · reorder point ${item.threshold}`, kind: 'warning' }))
  if (weatherNow.value && [0, 1, 2].includes(weatherNow.value.code)) {
    items.push({ title: 'Golden patrol weather', detail: `Clear skies in ${weatherNow.value.city} · a fine day for window watch`, kind: 'sunny' })
  }
  const busiestPest = pestRows.value[0]
  const pestShare = totals.value.sightings ? busiestPest.sightings / totals.value.sightings : 0
  if (busiestPest.sightings > 0 && pestShare >= 0.3) {
    items.push({ title: `${busiestPest.name} sightings are elevated`, detail: `${busiestPest.name} account for ${Math.round(pestShare * 100)}% of recorded sightings`, kind: 'pest' })
  }
  return items.slice(0, 4)
})

const periodLabel = computed(() => selectedMonth.value === 'all' ? `Full year ${metrics.year}` : `${monthNames[Number(selectedMonth.value)]} ${metrics.year}`)
const weatherDescription = computed(() => weatherNow.value ? weatherCodeLabel(weatherNow.value.code) : '')
const weatherStats = computed(() => {
  const observations = filteredDays.value.filter((day) => day.crew.length > 0).map((day) => day.weather)
  return {
    average: observations.length ? Math.round(observations.reduce((sum, item) => sum + item.temperature, 0) / observations.length) : 0,
    clear: observations.filter((item) => [0, 1, 2].includes(item.code)).length,
    wet: observations.filter((item) => item.code >= 51).length,
  }
})

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' },
  plugins: {
    legend: { display: false },
    tooltip: { displayColors: true, padding: 10, cornerRadius: 4 },
  },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: '#74766f', maxRotation: 0 } },
    y: { beginAtZero: true, border: { display: false }, grid: { color: 'rgba(81, 88, 75, .11)' }, ticks: { color: '#74766f', precision: 0 } },
  },
}

const barOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { displayColors: true, padding: 10, cornerRadius: 4 } },
  scales: {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: '#74766f', maxRotation: 0 } },
    y: { beginAtZero: true, border: { display: false }, grid: { color: 'rgba(81, 88, 75, .11)' }, ticks: { color: '#74766f', precision: 0 } },
  },
}

const dailyChartOptions: ChartOptions<'line'> = {
  ...chartOptions,
  plugins: {
    ...chartOptions.plugins,
    tooltip: {
      displayColors: false,
      padding: 10,
      cornerRadius: 4,
      callbacks: {
        afterBody: (items) => {
          const day = recentDays.value[items[0]?.dataIndex ?? -1]
          return day ? [`Weather: ${day.weather.label}, ${day.weather.temperature}°C`, `Rain chance: ${day.weather.rainProbability}%`] : []
        },
      },
    },
  },
}

function weatherCodeLabel(code: number) {
  if (code === 0) return 'Clear sky'
  if ([1, 2].includes(code)) return 'Partly cloudy'
  if (code === 3) return 'Overcast'
  if ([45, 48].includes(code)) return 'Foggy'
  if (code >= 51 && code <= 67) return 'Rain showers'
  if (code >= 71 && code <= 77) return 'Snow'
  if (code >= 80 && code <= 82) return 'Rain showers'
  if (code >= 95) return 'Thunderstorms'
  return 'Mixed clouds'
}

async function updateWeather() {
  const city = cityQuery.value.trim()
  if (!city) return
  weatherLoading.value = true
  weatherError.value = ''
  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`)
    if (!geoResponse.ok) throw new Error('Location lookup is unavailable right now.')
    const geoData = await geoResponse.json()
    const place = geoData.results?.[0]
    if (!place) throw new Error('No matching place found. Try another city.')
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`)
    if (!weatherResponse.ok) throw new Error('The forecast could not be loaded.')
    const weatherData = await weatherResponse.json()
    weatherNow.value = {
      temperature: Math.round(weatherData.current.temperature_2m),
      code: weatherData.current.weather_code,
      wind: Math.round(weatherData.current.wind_speed_10m),
      humidity: Math.round(weatherData.current.relative_humidity_2m),
      city: place.name,
      country: place.country,
    }
  } catch (error) {
    weatherError.value = error instanceof Error ? error.message : 'Weather is unavailable.'
  } finally {
    weatherLoading.value = false
  }
}

function switchPage(page: Page) {
  activePage.value = page
  drawer.value = false
}

function submitLogin() {
  if (loginPassword.value !== 'protogen2026') {
    loginError.value = 'That password is not quite right. Try again.'
    return
  }

  sessionStorage.setItem(accessKey, 'true')
  authenticated.value = true
  loginPassword.value = ''
  loginError.value = ''
  void updateWeather()
}

function scrollToAlerts() {
  document.getElementById('alerts')?.scrollIntoView({ behavior: 'smooth' })
}

function toggleTheme() {
  darkMode.value = !darkMode.value
  theme.change(darkMode.value ? 'jupiterDark' : 'jupiterLight')
}

async function copyRestockList() {
  const lowItems = metrics.inventory.filter((item) => item.quantity < item.threshold)
  const contents = lowItems.map((item) => `${item.name}: order ${item.threshold - item.quantity} more ${item.unit}`).join('\n')
  try {
    await navigator.clipboard.writeText(contents || 'No low-stock items.')
    notice.value = contents ? 'Restock list copied' : 'Cupboard is in good shape'
  } catch {
    notice.value = 'Clipboard access is unavailable in this browser'
  }
  window.setTimeout(() => { notice.value = '' }, 2600)
}

function exportPayroll() {
  const rows = [['Employee', 'Shift', 'Days worked', 'Pests vanquished', 'Treat pay', 'Naps']]
  payrollRows.value.forEach((row) => rows.push([row.name, row.shift, String(row.days), String(row.kills), String(row.treats), String(row.naps)]))
  const csv = rows.map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n')
  const link = document.createElement('a')
  link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  link.download = `jupiter-pawroll-${metrics.year}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

onMounted(() => {
  if (authenticated.value) void updateWeather()
})
</script>

<template>
  <v-app :class="{ 'theme-dark': darkMode }">
    <section v-if="!authenticated" class="login-stage" aria-labelledby="login-title">
      <div class="login-panel">
        <div class="login-brand-mark"><PawPrint :size="29" weight="duotone" /></div>
        <p class="login-eyebrow"><span></span> JUPITER'S PEST CONTROL <span></span></p>
        <h1 id="login-title">A private field ledger.</h1>
        <p class="login-copy">Enter the password to open the home patrol dashboard.</p>
        <form class="login-form" @submit.prevent="submitLogin">
          <label for="dashboard-password">Password</label>
          <input id="dashboard-password" v-model="loginPassword" type="password" name="password" autocomplete="current-password" required autofocus :aria-invalid="Boolean(loginError)" :aria-describedby="loginError ? 'login-error' : undefined" />
          <p v-if="loginError" id="login-error" class="login-error" role="alert">{{ loginError }}</p>
          <button class="primary-action login-submit" type="submit">Submit <ArrowUpRight :size="16" /></button>
        </form>
        <div class="login-footer"><span></span><PawPrint :size="14" weight="duotone" /><span></span></div>
      </div>
      <p class="login-caption">JPC · EST. WHENEVER THE SUN IS OUT</p>
    </section>
    <template v-else>
    <v-navigation-drawer v-model="drawer" temporary location="left" width="296" class="navigation-sheet">
      <div class="drawer-brand">
        <div class="brand-mark"><PawPrint :size="23" weight="duotone" /></div>
        <div><strong>Jupiter's</strong><span>PEST CONTROL</span></div>
      </div>
      <p class="drawer-label">OPERATIONS</p>
      <nav class="drawer-nav" aria-label="Main navigation">
        <button v-for="item in navItems" :key="item.id" class="drawer-link" :class="{ active: activePage === item.id }" @click="switchPage(item.id)">
          <component :is="item.icon" :size="19" weight="regular" />
          <span>{{ item.label }}</span>
          <span v-if="item.id === 'inventory' && metrics.inventory.some((stock) => stock.quantity < stock.threshold)" class="nav-count">2</span>
        </button>
      </nav>
      <div class="drawer-footnote">
        <div class="deco-stamp"><PawPrint :size="18" weight="duotone" /></div>
        <p>Keep the home<br />in purr-fect order.</p>
        <span>EST. WHENEVER THE SUN IS OUT</span>
      </div>
    </v-navigation-drawer>

    <header class="topbar">
      <div class="topbar-left">
        <v-btn icon variant="text" class="icon-button menu-button" aria-label="Open navigation" @click="drawer = true"><List :size="22" /></v-btn>
        <a class="wordmark" href="#home" @click.prevent="switchPage('dashboard')">
          <span class="brand-mark"><PawPrint :size="19" weight="duotone" /></span>
          <span>Jupiter's <b>PEST CONTROL</b></span>
        </a>
      </div>
      <div class="topbar-actions">
        <span class="topbar-date">FIELD REPORT · {{ metrics.year }}</span>
        <v-btn icon variant="text" class="icon-button theme-toggle" :aria-label="darkMode ? 'Switch to light theme' : 'Switch to dark theme'" @click="toggleTheme">
          <Sun v-if="darkMode" :size="19" />
          <Moon v-else :size="19" />
        </v-btn>
        <v-btn icon variant="text" class="icon-button notification-button" aria-label="View alerts" @click="scrollToAlerts"><Bell :size="19" /></v-btn>
        <span class="avatar-mark" aria-label="Jupiter, account owner">J</span>
      </div>
    </header>

    <main id="home" class="page-content">
      <template v-if="activePage === 'dashboard'">
        <section class="page-heading">
          <div>
            <p class="eyebrow"><span class="eyebrow-rule"></span> THE HOME PATROL · {{ metrics.year }}</p>
            <h1>A cleaner home,<br class="mobile-break" /> one pounce at a time.</h1>
            <p class="heading-subtitle">A year of watchful whiskers, open windows, and fewer uninvited guests.</p>
          </div>
          <div class="heading-seal" aria-hidden="true">
            <span class="seal-rays"></span>
            <PawPrint :size="32" weight="duotone" />
            <span>JPC · EST.</span>
          </div>
        </section>

        <section class="filter-row" aria-label="Dashboard filters">
          <div class="filter-context"><span class="live-dot"></span><strong>{{ periodLabel }}</strong><span class="filter-divider"></span><span>Field ledger</span></div>
          <div class="filter-controls">
            <label class="filter-select-wrap"><span class="sr-only">Filter by month</span><select v-model="selectedMonth" aria-label="Filter by month"><option value="all">All months</option><option v-for="(month, index) in monthNames" :key="month" :value="String(index)">{{ month }} {{ metrics.year }}</option></select><CaretDown :size="13" /></label>
            <label class="filter-select-wrap"><span class="sr-only">Filter by room</span><select v-model="selectedRoom" aria-label="Filter by room"><option value="all">Every room</option><option v-for="room in metrics.rooms" :key="room.id" :value="room.id">{{ room.name }}</option></select><CaretDown :size="13" /></label>
            <label class="filter-select-wrap"><span class="sr-only">Filter by pest</span><select v-model="selectedPest" aria-label="Filter by pest"><option value="all">All pests</option><option v-for="pest in metrics.pests" :key="pest.id" :value="pest.id">{{ pest.name }}</option></select><CaretDown :size="13" /></label>
          </div>
        </section>

        <section class="metrics-grid" aria-label="At a glance">
          <article class="metric-card metric-forest">
            <div class="metric-topline"><span>VANQUISHED</span><PawPrint :size="18" weight="duotone" /></div>
            <strong>{{ totals.kills.toLocaleString() }}</strong>
            <div class="metric-foot"><span class="metric-marker"></span><span>pests sent packing</span><span class="metric-trend"><ArrowUpRight :size="13" /> {{ totals.rate }}%</span></div>
          </article>
          <article class="metric-card metric-coral">
            <div class="metric-topline"><span>SIGHTINGS</span><WarningCircle :size="18" weight="duotone" /></div>
            <strong>{{ totals.sightings.toLocaleString() }}</strong>
            <div class="metric-foot"><span class="metric-marker"></span><span>across {{ metrics.rooms.length }} rooms</span><span class="metric-trend">{{ totals.rate }}% handled</span></div>
          </article>
          <article class="metric-card metric-blue">
            <div class="metric-topline"><span>TREAT PAY</span><Package :size="18" weight="duotone" /></div>
            <strong>{{ totals.treats.toLocaleString() }}</strong>
            <div class="metric-foot"><span class="metric-marker"></span><span>well-earned pieces</span><span class="metric-trend">{{ totals.shifts }} shifts</span></div>
          </article>
          <article class="metric-card metric-gold">
            <div class="metric-topline"><span>NAP BREAKS</span><Sun :size="18" weight="duotone" /></div>
            <strong>{{ totals.naps.toLocaleString() }}</strong>
            <div class="metric-foot"><span class="metric-marker"></span><span>recharging hours</span><span class="metric-trend">2 employees</span></div>
          </article>
        </section>

        <section class="feature-grid">
          <article class="weather-panel">
            <div class="weather-ornament" aria-hidden="true"><span></span><span></span><span></span></div>
            <div class="weather-header"><div><p class="panel-eyebrow">RIGHT NOW · OPEN-METEO</p><h2>Patrol conditions</h2></div><div class="weather-icon"><CloudSun :size="25" weight="duotone" /></div></div>
            <form class="weather-search" @submit.prevent="updateWeather">
              <label class="location-input"><MapPin :size="16" /><span class="sr-only">Weather city</span><input v-model="cityQuery" aria-label="Weather city" placeholder="Search a city" /></label>
              <button type="submit" :disabled="weatherLoading"><span>{{ weatherLoading ? 'Checking' : 'Update' }}</span><ArrowUpRight :size="15" /></button>
            </form>
            <p v-if="weatherNow" class="weather-place">{{ weatherNow.city }}, {{ weatherNow.country }}</p>
            <p v-if="weatherError" class="weather-error" role="status">{{ weatherError }}</p>
            <div v-if="weatherNow" class="weather-reading">
              <div class="temperature">{{ weatherNow.temperature }}<span>°</span></div>
              <div class="weather-condition"><strong>{{ weatherDescription }}</strong><span>Feels very patrol-able.</span></div>
              <div class="weather-details"><span><Wind :size="15" /> {{ weatherNow.wind }} km/h</span><span><span class="humidity-mark">%</span> {{ weatherNow.humidity }}% humidity</span></div>
            </div>
            <div v-else-if="!weatherLoading" class="weather-empty"><p>Find the local forecast by entering a city above.</p></div>
            <div class="weather-history"><span><Sun :size="14" /> {{ weatherStats.clear }} clear workdays</span><span class="history-divider"></span><span>{{ weatherStats.wet }} rainy patrols</span><span class="history-average">{{ weatherStats.average }}° avg.</span></div>
          </article>

          <article id="alerts" class="alerts-panel">
            <div class="panel-heading"><div><p class="panel-eyebrow">THE NOTICE BOARD</p><h2>Worth a whisker</h2></div><span class="alert-count">{{ alertItems.length }}</span></div>
            <ul v-if="alertItems.length" class="alert-list">
              <li v-for="(alert, index) in alertItems" :key="alert.title" class="alert-item" :class="`alert-${alert.kind}`">
                <span class="alert-glyph"><WarningCircle v-if="alert.kind === 'warning'" :size="17" weight="duotone" /><Sun v-else-if="alert.kind === 'sunny'" :size="17" weight="duotone" /><PawPrint v-else :size="17" weight="duotone" /></span>
                <span><strong>{{ alert.title }}</strong><small>{{ alert.detail }}</small></span>
                <span class="alert-index">0{{ index + 1 }}</span>
              </li>
            </ul>
            <div v-else class="all-clear"><CheckCircle :size="21" /><span>All clear. The house is in good paws.</span></div>
            <button class="text-action" @click="switchPage('inventory')">Open the treat cupboard <ArrowUpRight :size="14" /></button>
          </article>
        </section>

        <section class="charts-grid">
          <article class="panel chart-panel trend-panel">
            <div class="panel-heading"><div><p class="panel-eyebrow">FIELD NOTES · {{ periodLabel.toUpperCase() }}</p><h2>Seen, then sorted</h2></div><div class="chart-legend"><span><i class="legend-dot coral-dot"></i>Sightings</span><span><i class="legend-dot green-dot"></i>Vanquished</span></div></div>
            <div class="chart-wrap"><Line :data="monthlyData" :options="chartOptions" /></div>
            <p class="chart-alt">{{ totals.sightings.toLocaleString() }} sightings and {{ totals.kills.toLocaleString() }} vanquishes {{ selectedMonth === 'all' ? 'across the year' : `in ${periodLabel}` }}. Workday weather averaged {{ weatherStats.average }}°; {{ weatherStats.wet }} days brought rain.</p>
          </article>
          <article class="panel chart-panel room-panel">
            <div class="panel-heading"><div><p class="panel-eyebrow">ROOM-BY-ROOM</p><h2>Where the paws land</h2></div><span class="mini-tag"><House :size="14" /> {{ roomRows[0]?.name }} leads</span></div>
            <div class="chart-wrap room-chart"><Bar :data="roomChartData" :options="barOptions" /></div>
            <div class="room-leader"><span class="leader-mark"><PawPrint :size="16" weight="duotone" /></span><span><strong>{{ roomRows[0]?.sightings.toLocaleString() }} sightings in {{ roomRows[0]?.name }}</strong><small>Keep an extra eye on this corner of the house.</small></span><ArrowUpRight :size="16" /></div>
          </article>
        </section>

        <section class="charts-grid lower-charts">
          <article class="panel chart-panel">
            <div class="panel-heading"><div><p class="panel-eyebrow">LAST 14 PATROLS</p><h2>Day by day</h2></div><span class="chart-caption">Daily vanquishes</span></div>
            <div class="chart-wrap compact-chart"><Line :data="dailyChartData" :options="dailyChartOptions" /></div>
            <p class="chart-alt">Daily counts from {{ recentDays[0]?.date }} through {{ recentDays[recentDays.length - 1]?.date }}. Hover a patrol for its recorded weather and rain chance; {{ weatherStats.clear }} clear and {{ weatherStats.wet }} wet patrols in this period.</p>
          </article>
          <article class="panel chart-panel">
            <div class="panel-heading"><div><p class="panel-eyebrow">THE BUSY HOURS</p><h2>Prime pouncing time</h2></div><span class="chart-caption">{{ totals.kills.toLocaleString() }} total</span></div>
            <div class="chart-wrap compact-chart"><Bar :data="hourlyChartData" :options="barOptions" /></div>
            <p class="chart-alt">Hourly vanquishes from 7 A.M. to 4 P.M., aggregated over {{ periodLabel.toLowerCase() }}.</p>
          </article>
        </section>

        <section class="bottom-grid">
          <article class="panel room-list-panel">
            <div class="panel-heading"><div><p class="panel-eyebrow">HOUSE MAP</p><h2>Rooms under watch</h2></div><button class="round-link" aria-label="View all rooms"><ArrowUpRight :size="17" /></button></div>
            <div class="room-list">
              <div v-for="(room, index) in roomRows" :key="room.id" class="room-row">
                <span class="room-order">0{{ index + 1 }}</span><span class="room-name">{{ room.name }}</span><span class="room-meter"><i :style="{ width: `${Math.max(7, (room.sightings / Math.max(1, roomRows[0]?.sightings)) * 100)}%` }"></i></span><strong>{{ room.sightings }}</strong><span class="room-unit">sightings</span>
              </div>
            </div>
          </article>
          <article class="panel pest-panel">
            <div class="panel-heading"><div><p class="panel-eyebrow">THE UNINVITED</p><h2>Pest roll call</h2></div><span class="pest-total"><PawPrint :size="15" /> {{ totals.sightings.toLocaleString() }}</span></div>
            <div class="pest-list">
              <div v-for="(pest, index) in pestRows" :key="pest.id" class="pest-row">
                <span class="pest-portrait" :class="`pest-tone-${index}`"><PawPrint :size="17" weight="duotone" /></span>
                <span class="pest-name">{{ pest.name }}<small>{{ Math.round(totals.sightings ? pest.sightings / totals.sightings * 100 : 0) }}% of sightings</small></span>
                <span class="pest-count"><strong>{{ pest.sightings.toLocaleString() }}</strong><small>seen</small></span>
                <span class="pest-count killed"><strong>{{ pest.kills.toLocaleString() }}</strong><small>caught</small></span>
              </div>
            </div>
          </article>
        </section>
      </template>

      <template v-else-if="activePage === 'payroll'">
        <section class="page-heading subpage-heading">
          <div><p class="eyebrow"><span class="eyebrow-rule"></span> THE HOME PATROL · {{ metrics.year }}</p><h1>A fair day's catch.</h1><p class="heading-subtitle">Two good cats, honest work, and a treat for every triumph.</p></div>
          <button class="primary-action" @click="exportPayroll"><ArrowUpRight :size="16" /> Export pawroll</button>
        </section>
        <section class="filter-row"><div class="filter-context"><span class="live-dot"></span><strong>{{ periodLabel }}</strong><span class="filter-divider"></span><span>Team ledger</span></div><div class="filter-controls"><label class="filter-select-wrap"><span class="sr-only">Filter payroll by month</span><select v-model="selectedMonth" aria-label="Filter payroll by month"><option value="all">All months</option><option v-for="(month, index) in monthNames" :key="month" :value="String(index)">{{ month }} {{ metrics.year }}</option></select><CaretDown :size="13" /></label></div></section>
        <section class="payroll-summary">
          <div class="payroll-total"><span class="panel-eyebrow">TREAT PAY · {{ periodLabel.toUpperCase() }}</span><strong>{{ payrollRows.reduce((sum, row) => sum + row.treats, 0).toLocaleString() }} <small>treats</small></strong><span>{{ totals.shifts }} completed shifts and {{ totals.naps }} earned naps</span></div>
          <div class="payroll-stamp"><PawPrint :size="28" weight="duotone" /><span>GOOD<br />CATS</span></div>
        </section>
        <section class="payroll-grid">
          <article v-for="employee in payrollRows" :key="employee.id" class="panel employee-card">
            <div class="employee-top"><div class="employee-avatar" :style="{ '--employee-color': employee.color }">{{ employee.name.slice(0, 1) }}</div><span class="shift-pill">{{ employee.shift }} SHIFT</span></div>
            <p class="employee-role">{{ employee.title }}</p><h2>{{ employee.name }}</h2>
            <div class="employee-pay"><span>Earned this period</span><strong>{{ employee.treats.toLocaleString() }} <small>treats</small></strong></div>
            <div class="employee-stats"><span><strong>{{ employee.days }}</strong> days</span><span><strong>{{ employee.kills.toLocaleString() }}</strong> vanquished</span><span><strong>{{ employee.naps }}</strong> naps</span></div>
            <div class="employee-progress"><span :style="{ width: `${Math.min(100, Math.round(employee.days / Math.max(1, ...payrollRows.map((row) => row.days)) * 100))}%` }"></span></div>
          </article>
        </section>
        <section class="panel payroll-table-panel">
          <div class="panel-heading"><div><p class="panel-eyebrow">SHIFT RECORDS</p><h2>Earned, not given</h2></div><span class="chart-caption">A.M. / P.M. rotations</span></div>
          <div class="table-scroll"><table><thead><tr><th>Employee</th><th>Shift</th><th>Days worked</th><th>Vanquished</th><th>Treat pay</th><th>Nap breaks</th></tr></thead><tbody><tr v-for="employee in payrollRows" :key="employee.id"><td><span class="table-employee"><i :style="{ background: employee.color }"></i>{{ employee.name }}</span></td><td>{{ employee.shift }}</td><td>{{ employee.days }}</td><td>{{ employee.kills.toLocaleString() }}</td><td class="table-pay">{{ employee.treats.toLocaleString() }} pcs</td><td>{{ employee.naps }}</td></tr></tbody></table></div>
        </section>
      </template>

      <template v-else>
        <section class="page-heading subpage-heading">
          <div><p class="eyebrow"><span class="eyebrow-rule"></span> THE HOME PATROL · STOCKROOM</p><h1>Good work needs good treats.</h1><p class="heading-subtitle">A well-stocked cupboard makes for very motivated patrol cats.</p></div>
          <button class="primary-action" @click="copyRestockList"><List :size="16" /> Copy restock list</button>
        </section>
        <section class="inventory-summary-row"><div class="inventory-summary"><Package :size="21" /><span><strong>{{ metrics.inventory.reduce((sum, item) => sum + item.quantity, 0) }}</strong><small>total stock units</small></span></div><div class="inventory-summary low-summary"><WarningCircle :size="21" /><span><strong>{{ metrics.inventory.filter((item) => item.quantity < item.threshold).length }}</strong><small>items below reorder point</small></span></div><div class="inventory-summary"><CheckCircle :size="21" /><span><strong>{{ orderedItems.length }}</strong><small>{{ orderedItems.length === 1 ? 'item' : 'items' }} on restock list</small></span></div></section>
        <section class="panel inventory-panel">
          <div class="panel-heading inventory-heading"><div><p class="panel-eyebrow">THE TREAT CUPBOARD</p><h2>Supplies & morale</h2></div><div class="inventory-filters"><button :class="{ selected: inventoryFilter === 'all' }" @click="inventoryFilter = 'all'">All items</button><button :class="{ selected: inventoryFilter === 'low' }" @click="inventoryFilter = 'low'">Running low</button><button :class="{ selected: inventoryFilter === 'ordered' }" @click="inventoryFilter = 'ordered'">On order</button></div></div>
          <div class="inventory-list"><article v-for="item in inventoryRows" :key="item.id" class="inventory-item"><span class="inventory-icon"><PawPrint :size="19" weight="duotone" /></span><span class="inventory-name"><strong>{{ item.name }}</strong><small>{{ item.category }}</small></span><span class="inventory-quantity"><strong>{{ item.quantity }}</strong><small>{{ item.unit }} in stock</small></span><span class="stock-meter" :class="{ low: item.quantity < item.threshold }"><i :style="{ width: `${Math.min(100, Math.round(item.quantity / (item.threshold * 1.8) * 100))}%` }"></i></span><span class="stock-status" :class="{ 'status-low': item.quantity < item.threshold }">{{ item.quantity < item.threshold ? 'Reorder' : 'Healthy' }}</span><button class="order-button" :class="{ ordered: orderedItems.includes(item.id) }" :aria-label="orderedItems.includes(item.id) ? `Remove ${item.name} from restock list` : `Add ${item.name} to restock list`" @click="orderedItems = orderedItems.includes(item.id) ? orderedItems.filter((id) => id !== item.id) : [...orderedItems, item.id]"><CheckCircle v-if="orderedItems.includes(item.id)" :size="19" weight="fill" /><span v-else>Add to order</span></button></article><p v-if="!inventoryRows.length" class="empty-filter">No items match this view.</p></div>
        </section>
        <section class="inventory-note"><PawPrint :size="18" weight="duotone" /><span>Tip: a little salmon goes a long way. A sunbeam goes even further.</span><span class="note-lines"></span></section>
      </template>

      <footer class="page-footer"><span>JPC · {{ metrics.year }} FIELD LEDGER</span><span><PawPrint :size="13" weight="duotone" /> Compiled with care, and one very clean paw.</span></footer>
    </main>
    <div v-if="notice" class="toast-notice" role="status"><CheckCircle :size="17" />{{ notice }}</div>
    </template>
  </v-app>
</template>
