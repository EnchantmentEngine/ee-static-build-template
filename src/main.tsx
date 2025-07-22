// tslint:disable:ordered-imports
/** @ts-ignore */
globalThis.process = { env: { ...(import.meta as any).env, APP_ENV: (import.meta as any).env.MODE } }

import React, { lazy } from 'react'
import { createRoot } from 'react-dom/client'

import '@ir-engine/client/src/themes/base.css'
import '@ir-engine/client/src/themes/components.css'
import '@ir-engine/client/src/themes/utilities.css'

import { createHyperStore } from '@ir-engine/hyperflux'

createHyperStore()

const CustomLocationPage = lazy(() => import('./CustomLocationPage'))

const App = () => {
  return <CustomLocationPage />
}

const container = document.getElementById('root')
const root = createRoot(container!)
root.render(<App />)
