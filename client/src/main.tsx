import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@mantine/core/styles.css';
import '@mantine/tiptap/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import App from './App.tsx'
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import 'dayjs/locale/cs';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './context/AuthContext.tsx';
import { AppProvider } from './context/AppContext.tsx';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          <DatesProvider settings={{ locale: 'cs', firstDayOfWeek: 0, weekendDays: [0] }}>
            <MantineProvider defaultColorScheme="light">
              <Notifications
                position="bottom-center"
                zIndex={400}
              />
              <App />
            </MantineProvider>
          </DatesProvider>
        </AuthProvider>
      </AppProvider>
    </BrowserRouter>
  </StrictMode>,
)