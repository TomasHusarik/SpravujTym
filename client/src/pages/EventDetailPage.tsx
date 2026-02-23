import EventDetail from '@/components/team-events/EventDetail';
import React from 'react'
import { useParams } from 'react-router'

const EventDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    
  return (
    <EventDetail eventId={id} />
  )
}

export default EventDetailPage