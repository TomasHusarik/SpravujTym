import type { ParticipationStatus } from "@/types/EventParticipation";
import { ActionIcon, Badge, Button, Group, MultiSelect, Select, Table } from "@mantine/core";

export const ParticipantsTable = ({ initialParticipants, allUsers, onSave }: ParticipantsTableProps) => {
    const [participants, setParticipants] =
        useState<ParticipantUI[]>(initialParticipants);

    const [selectedToAdd, setSelectedToAdd] = useState<string[]>([]);

    const handleAddParticipants = () => {
        const newOnes = selectedToAdd
            .filter(id => !participants.find(p => p.userId === id))
            .map(id => {
                const user = allUsers.find(u => u.value === id);
                return {
                    userId: id,
                    name: user?.label || "",
                    status: "pending" as ParticipationStatus
                };
            });

        setParticipants([...participants, ...newOnes]);
        setSelectedToAdd([]);
    };

    const handleRemove = (userId: string) => {
        setParticipants(participants.filter(p => p.userId !== userId));
    };

    const handleStatusChange = (
        userId: string,
        status: ParticipationStatus
    ) => {
        setParticipants(
            participants.map(p =>
                p.userId === userId ? { ...p, status } : p
            )
        );
    };

    const getStatusColor = (status: ParticipationStatus) => {
        if (status === "confirmed") return "green";
        if (status === "declined") return "red";
        return "yellow";
    };

    return (
        <>
            {/* Add participants */}
            <Group mb="md">
                <MultiSelect
                    data={allUsers}
                    value={selectedToAdd}
                    onChange={setSelectedToAdd}
                    placeholder="Add participants"
                    searchable
                />
                <Button onClick={handleAddParticipants}>
                    Add
                </Button>
            </Group>

            {/* Table */}
            <Table striped highlightOnHover>
                <Table.Thead>
                    <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Status</Table.Th>
                        <Table.Th />
                    </Table.Tr>
                </Table.Thead>

                <Table.Tbody>
                    {participants.map(p => (
                        <Table.Tr key={p.userId}>
                            <Table.Td>{p.name}</Table.Td>

                            <Table.Td>
                                <Group gap="xs">
                                    <Badge color={getStatusColor(p.status)}>
                                        {p.status}
                                    </Badge>

                                    <Select
                                        size="xs"
                                        value={p.status}
                                        onChange={(value) =>
                                            handleStatusChange(
                                                p.userId,
                                                value as ParticipationStatus
                                            )
                                        }
                                        data={[
                                            { value: "pending", label: "Pending" },
                                            { value: "confirmed", label: "Confirmed" },
                                            { value: "declined", label: "Declined" }
                                        ]}
                                    />
                                </Group>
                            </Table.Td>

                            <Table.Td>
                                <ActionIcon
                                    color="red"
                                    variant="subtle"
                                    onClick={() => handleRemove(p.userId)}
                                >
                                    <IconTrash size={16} />
                                </ActionIcon>
                            </Table.Td>
                        </Table.Tr>
                    ))}
                </Table.Tbody>
            </Table>

            <Group justify="flex-end" mt="md">
                <Button onClick={() => onSave(participants)}>
                    Save Changes
                </Button>
            </Group>
        </>
    );
};