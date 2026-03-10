import { Button, Group, Paper, SimpleGrid, Text, Textarea, TextInput } from '@mantine/core';
import { useState } from 'react';
import bg from '@/assets/ContactBG.png';
import classes from './GetInTouch.module.css';
import { showErrorNotification, showSuccessNotification } from '@/utils/helpers';
import { ContactIconsList } from './ContactIcons';
import { sendEmail } from '@/utils/api';

export function GetInTouch() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      await sendEmail(formData);
      setFormData({
        name: '',
        email: '',
        message: '',
      });
      showSuccessNotification('Message sent successfully!');
    } catch (err) {
      console.error('Failed to send message:', err);
      showErrorNotification('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper shadow="md" radius="lg">
      <div className={classes.wrapper}>
        <div className={classes.contacts} style={{ backgroundImage: `url(${bg})` }}>
          <Text fz="lg" fw={700} className={classes.title} c="#fff" style={{marginBottom: '30px'}}>
            Chceš hrát florbal? Přidej se k nám!
          </Text>

          <ContactIconsList />
        </div>

        <form className={classes.form} onSubmit={handleSubmit}>
          <Text fz="lg" fw={700} className={classes.title} style={{marginBottom: '30px'}}>
            Kontaktuj nás ohledně tréninků, zápasů nebo čehokoliv dalšího!
          </Text>

          <div className={classes.fields}>
            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <TextInput
                label="Jméno"
                placeholder="Jméno"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <TextInput
                label="email"
                placeholder="nabor@bluehorses.com"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </SimpleGrid>

            <Textarea
              mt="md"
              label="Vaše zpráva"
              placeholder="Napište nám zprávu..."
              name="message"
              value={formData.message}
              onChange={handleChange}
              minRows={3}
              required
            />

            <Group justify="flex-end" mt="md">
              <Button type="submit" className={classes.control} loading={loading}>
                Poslat
              </Button>
            </Group>
          </div>
        </form>
      </div>
    </Paper>
  );
}