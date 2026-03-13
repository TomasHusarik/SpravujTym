import EventComments from '@/components/team-events/EventComments';
import EventDetail from '@/components/team-events/EventDetail';
import { Tabs } from '@mantine/core';
import React from 'react'
import { useParams } from 'react-router'

const EventDetailPage = () => {
    const { id } = useParams<{ id: string }>();
    
  return (
    <>
    { id ?       
      <Tabs defaultValue="detail">
            <Tabs.List>
                <Tabs.Tab value="detail">
                    Událost
                </Tabs.Tab>
                <Tabs.Tab value="payments">
                    Komentáře
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="detail" pt="md">
                    <EventDetail eventId={id} />
            </Tabs.Panel>
            <Tabs.Panel value="payments" pt="md">
                <EventComments eventId={id} />
            </Tabs.Panel>

        </Tabs>
         : <EventDetail eventId={id} />
    }
    </>
  )
}

export default EventDetailPage