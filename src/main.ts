import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import { VApp, VBtn, VNavigationDrawer } from 'vuetify/components'
import 'vuetify/styles'
import './style.css'
import App from './App.vue'

const vuetify = createVuetify({
	components: { VApp, VBtn, VNavigationDrawer },
	theme: {
		defaultTheme: 'jupiterLight',
		themes: {
			jupiterLight: {
				dark: false,
				colors: {
					background: '#f6f2e8',
					surface: '#fffdf7',
					primary: '#20564b',
					secondary: '#bb7a32',
					error: '#b84f40',
				},
			},
			jupiterDark: {
				dark: true,
				colors: {
					background: '#1d2925',
					surface: '#273630',
					primary: '#9bc6a7',
					secondary: '#e6b96b',
					error: '#ef9384',
				},
			},
		},
	},
})

createApp(App).use(vuetify).mount('#app')
