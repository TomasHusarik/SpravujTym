import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import App from './App.tsx'
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import 'dayjs/locale/cs';
import { BrowserRouter } from 'react-router';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <DatesProvider settings={{ locale: 'ru', firstDayOfWeek: 0, weekendDays: [0] }}>
        <MantineProvider defaultColorScheme="dark">
          <App />
        </MantineProvider>
      </DatesProvider>
    </BrowserRouter>
  </StrictMode>,
)