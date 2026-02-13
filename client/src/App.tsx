import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AppShell, Button } from '@mantine/core'
import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import { useDisclosure } from '@mantine/hooks'
import Overview from './pages/Overview';
import Calendar from './pages/Calendar';

const App = () => {
  const [opened, { toggle }] = useDisclosure();

  return (
    <>
      <AppShell
        padding="md"
        header={{ height: 100 }}
        footer={{ height: 80 }}
      >
        <AppShell.Header>
          <Header />
        </AppShell.Header>

        <AppShell.Main>
          <Routes>
            <Route path="/" element={<Navigate to="/overview" />} />
            <Route path="/overview" element={<Overview />}/>
            <Route path="/calendar" element={<Calendar />} />
          </Routes>
        </AppShell.Main>

        <AppShell.Footer>
          <Footer />
        </AppShell.Footer>
      </AppShell >
    </>
  )
}

export default App