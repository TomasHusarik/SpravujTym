import EventComments from '@/components/team-events/EventComments';
import EventDetail from '@/components/team-events/EventDetail';
import { Button, Tabs } from '@mantine/core';
import { IconArrowLeft, IconInfoCircle, IconMessageCircle } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router'

const EventDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <>
      <Button
        variant="subtle"
        size="compact-sm"
        leftSection={<IconArrowLeft size={14} />}
        mb="sm"
        onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/overview'))}
      >
        Zpět
      </Button>

      {id ? (
        <Tabs defaultValue="detail" keepMounted={false}>
          <Tabs.List mb="md">
            <Tabs.Tab value="detail" leftSection={<IconInfoCircle size={16} />}>
              Událost
            </Tabs.Tab>
            <Tabs.Tab value="comments" leftSection={<IconMessageCircle size={16} />}>
              Komentáře
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="detail">
            <EventDetail eventId={id} />
          </Tabs.Panel>
          <Tabs.Panel value="comments">
            <EventComments eventId={id} />
          </Tabs.Panel>
        </Tabs>
      ) : (
        <EventDetail eventId={id} />
      )}
    </>
  )
}

export default EventDetailPage
