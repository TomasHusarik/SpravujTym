import EventsCalendar from "@/components/team-events/calendar/EventsCalendar"
import PageHeader from "@/components/ui/PageHeader"

const CalendarPage = () => {
  return (
    <>
      <PageHeader title="Kalendář" description="Tréninky, zápasy a další akce vašich celků." />
      <EventsCalendar />
    </>
  )
}

export default CalendarPage
