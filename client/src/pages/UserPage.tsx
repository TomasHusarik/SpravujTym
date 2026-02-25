import UserDetail from "@/components/user/UserDetail"
import UserPayments from "@/components/user/UserPayments";
import { Tabs } from '@mantine/core';
import { useParams } from "react-router-dom";

const UserPage = () => {
    const { id } = useParams<{ id: string }>();

    if (!id) {
        return null;
    }

    return (
        <Tabs defaultValue="detail">
            <Tabs.List>
                <Tabs.Tab value="detail">
                    Detail
                </Tabs.Tab>
                <Tabs.Tab value="payments">
                    Platby
                </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="detail" pt="md">
                <UserDetail userId={id} />
            </Tabs.Panel>
            <Tabs.Panel value="payments" pt="md">
                <UserPayments userId={id} />
            </Tabs.Panel>

        </Tabs>
    )
}

export default UserPage