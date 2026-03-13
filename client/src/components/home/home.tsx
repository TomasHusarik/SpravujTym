import {
    Badge,
    Box,
    Button,
    Center,
    Container,
    Divider,
    Group,
    Overlay,
    Paper,
    SimpleGrid,
    Stack,
    Text,
    Title,
    TypographyStylesProvider
} from "@mantine/core";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import img from "@/assets/BluehorsesBG.jpg";
import type { Announcement } from "@/types/Announcement";
import { getAnnouncements } from "@/utils/api";
import { getFullName } from "@/utils/helpers";
import { GetInTouch } from "./GetInTouch";

const Home = () => {
    const visibleBatchSize = 6;
    const [isLoading, setIsLoading] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [visibleCount, setVisibleCount] = useState(visibleBatchSize);
    const navigate = useNavigate();

    const displayedAnnouncements = announcements.slice(0, visibleCount);


    const loadData = async () => {
        try {
            setIsLoading(true);
            const announcementsData = await getAnnouncements();
            setAnnouncements(announcementsData);
        } catch (error) {
            console.error("Error fetching announcements:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShowMore = () => {
        setVisibleCount((currentValue) => Math.min(currentValue + visibleBatchSize, announcements.length));
    };

    useEffect(() => {
        loadData();
    }, []);

    return (
        <Stack gap={0} pb="xl">
            <Box component="section">
                <Paper
                    radius="32px"
                    shadow="xl"
                    pos="relative"
                    style={{
                        backgroundImage: `url(${img})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        borderRadius: 0
                    }}
                >
                    <Overlay
                        gradient="linear-gradient(135deg, rgba(6, 33, 61, 0.2) 0%, rgba(6, 33, 61, 0.86) 65%, rgba(6, 33, 61, 0.96) 100%)"
                        opacity={1}
                        zIndex={0}
                    />

                    <Container size="lg" pos="relative" py={{ base: 40, md: 40 }}>
                        <Stack gap="xl">
                            <Group justify="flex-end" align="flex-start" wrap="wrap">
                                <Button
                                    radius="xl"
                                    size="md"
                                    variant="white"
                                    color="dark"
                                    onClick={() => navigate("/login")}
                                >
                                    Přihlásit se
                                </Button>
                            </Group>

                            <Stack gap="lg" maw={680}>
                                <Title order={1} c="white" fz={{ base: 40, md: 62 }} lh={1.02}>
                                    Blue Horses Stochov
                                </Title>
                                <Text c="gray.1" size="xl" maw={560}>
                                    Amatérský florbalový tým ze Stochova
                                </Text>
                                <Group gap="sm" wrap="wrap">
                                    <Badge size="lg" radius="sm" variant="white">Florbal</Badge>
                                    <Badge size="lg" radius="sm" variant="white">Komunita</Badge>
                                    <Badge size="lg" radius="sm" variant="white">Stochov</Badge>
                                </Group>
                            </Stack>

                            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                                <Paper radius="xl" p="lg" bg="rgba(0,0,0,0.2)">
                                    <Stack gap={6}>
                                        <Text size="xs" c="gray.3" tt="uppercase" fw={700}>Tým</Text>
                                        <Text c="white" fw={700} size="lg">Společný rytmus na hřišti i mimo něj</Text>
                                    </Stack>
                                </Paper>
                                <Paper radius="xl" p="lg" bg="rgba(0,0,0,0.2)">
                                    <Stack gap={6}>
                                        <Text size="xs" c="gray.3" tt="uppercase" fw={700}>Zápasy</Text>
                                        <Text c="white" fw={700} size="lg">Aktuální dění, termíny a novinky na jednom místě</Text>
                                    </Stack>
                                </Paper>
                                <Paper radius="xl" p="lg" bg="rgba(0,0,0,0.2)">
                                    <Stack gap={6}>
                                        <Text size="xs" c="gray.3" tt="uppercase" fw={700}>Nábor</Text>
                                        <Text c="white" fw={700} size="lg">Chceš se přidat? Ozvi se a přijď si zahrát</Text>
                                    </Stack>
                                </Paper>
                            </SimpleGrid>
                        </Stack>
                    </Container>
                </Paper>
            </Box>

            <Container size="lg" py={{ base: "xl", md: "3rem" }}>
                <Stack gap="xl">
                    <Group justify="space-between" align="flex-end" wrap="wrap">
                        <Stack gap={4}>
                            <Badge size="lg" variant="dot" color="blue">Novinky klubu</Badge>
                            <Title order={2}>Co je nového</Title>
                            <Text c="dimmed" maw={620}>
                                Přehled nejdůležitějších oznámení, změn a informací pro hráče i fanoušky.
                            </Text>
                        </Stack>

                        {!isLoading && announcements.length > 0 && (
                            <Text size="sm" c="dimmed" fw={500}>
                                Zobrazeno {displayedAnnouncements.length} z {announcements.length} novinek
                            </Text>
                        )}
                    </Group>

                    {!isLoading && announcements.length === 0 && (
                        <Paper withBorder radius="xl" p={{ base: "xl", md: "3rem" }}>
                            <Center>
                                <Stack align="center" gap="sm">
                                    <Badge size="lg" variant="light" color="gray">Novinky</Badge>
                                    <Title order={3} ta="center">Zatím nejsou vytvořená žádná oznámení</Title>
                                    <Text c="dimmed" ta="center" maw={420}>
                                        Jakmile správci přidají nové informace, objeví se tady v přehledných kartách.
                                    </Text>
                                </Stack>
                            </Center>
                        </Paper>
                    )}

                    {!isLoading && announcements.length > 0 && (
                        <SimpleGrid cols={{ base: 1, md: 2, xl: 3 }} spacing="lg" verticalSpacing="lg">
                            {displayedAnnouncements.map((announcement) => (
                                <Paper
                                    withBorder
                                    radius="xl"
                                    p="xl"
                                    key={announcement._id}
                                    shadow="sm"
                                    style={{
                                        height: "100%",
                                        borderColor: announcement.pinned ? "var(--mantine-color-yellow-4)" : undefined
                                    }}
                                >
                                    <Stack gap="lg" justify="space-between" style={{ minHeight: "100%" }}>
                                        <Stack gap="md">
                                            <Stack gap="xs">
                                                <Group gap="xs" wrap="wrap">
                                                    {announcement.pinned && (
                                                        <Badge color="yellow" variant="filled">Připnuté</Badge>
                                                    )}
                                                </Group>
                                                <Title order={4} lh={1.2}>{announcement.title}</Title>
                                            </Stack>

                                            <TypographyStylesProvider>
                                                <Box
                                                    style={{ lineHeight: 1.7 }}
                                                    dangerouslySetInnerHTML={{ __html: announcement.content }}
                                                />
                                            </TypographyStylesProvider>
                                        </Stack>

                                        <Stack gap="sm">
                                            <Divider />
                                            <Group justify="space-between" align="center" wrap="wrap">
                                                <Text size="sm" fw={600}>
                                                    {getFullName(announcement.author)}
                                                </Text>
                                                {announcement.createdAt && (
                                                    <Badge color="blue" variant="light">
                                                        {new Date(announcement.createdAt).toLocaleDateString("cs-CZ")}
                                                    </Badge>
                                                )}
                                            </Group>
                                        </Stack>
                                    </Stack>
                                </Paper>
                            ))}
                        </SimpleGrid>
                    )}

                    {!isLoading && displayedAnnouncements.length < announcements.length && (
                        <Center>
                            <Stack align="center" gap="sm">
                                <Button size="md" radius="xl" onClick={handleShowMore}>
                                    Zobrazit více
                                </Button>
                                <Text size="sm" c="dimmed">
                                    Načte se dalších {Math.min(visibleBatchSize, announcements.length - displayedAnnouncements.length)} novinek.
                                </Text>
                            </Stack>
                        </Center>
                    )}
                </Stack>
            </Container>

            <Divider mx="xl" my="xl" />

            <Container size="lg" py="xl">
                <GetInTouch />
            </Container>
        </Stack>
    );
};

export default Home;