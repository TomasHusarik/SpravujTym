import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/tiptap/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import './index.css'
import App from './App.tsx'
import { MantineProvider } from '@mantine/core';
import { DatesProvider } from '@mantine/dates';
import { Notifications } from '@mantine/notifications';
import 'dayjs/locale/cs';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './context/AuthContext.tsx';
import { AppProvider } from './context/AppContext.tsx';
import { theme } from './theme';


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProvider>
        <AuthProvider>
          {/* Czech calendar: week starts on Monday, weekend is Saturday and Sunday */}
          <DatesProvider settings={{ locale: 'cs', firstDayOfWeek: 1, weekendDays: [0, 6] }}>
            <MantineProvider theme={theme} defaultColorScheme="light">
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
