import { IconBrandFacebook, IconBrandInstagram, IconSoccerField } from '@tabler/icons-react';
import { ActionIcon, Group, Text } from '@mantine/core';
import classes from './Footer.module.css';
import { config } from '@/config/config';
import packageJson from '@root/package.json';


const Footer = () => {
    return (
        <div className={classes.footer}>
            <div className={classes.inner}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <Text fw={700} fz="xl" className={classes.logoText}>
                        {config.appName}
                    </Text>
                </div>
                <Text fw={600} fz="xs" c="dimmed" className={classes.version}>
                    v{packageJson.version}
                </Text>
                <Group gap={20} className={classes.links} justify="flex-end" wrap="nowrap">
                    <ActionIcon component="a" href={config.teamFacebookUrl} target="_blank" rel="noopener noreferrer" size="lg" variant="subtle" color="gray" aria-label="Facebook">
                        <IconBrandFacebook size={25} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon component="a" href={config.teamInstagramUrl} target="_blank" rel="noopener noreferrer" size="lg" variant="subtle" color="gray" aria-label="Instagram">
                        <IconBrandInstagram size={25} stroke={1.5} />
                    </ActionIcon>
                    <ActionIcon component="a" href={config.teamCeskyFlorbalUrl} target="_blank" rel="noopener noreferrer" size="lg" variant="subtle" color="gray" aria-label="Český florbal">
                        <IconSoccerField size={25} stroke={1.5} />
                    </ActionIcon>
                </Group>
            </div>
        </div>
    );
}

export default Footer