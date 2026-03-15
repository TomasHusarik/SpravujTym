import UserDetail from "@/components/user/UserDetail"
import UserPayments from "@/components/user/UserPayments";
import { Tabs } from '@mantine/core';
import { useParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const UserPage = () => {
    const { id } = useParams<{ id?: string }>();
    const { user } = useAuth();
    const userId = id ?? user?._id;

    if (!userId) {
        return null;
    }

    return (
        user.new ? (
            <UserDetail userId={userId} />
        ) : (
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
                    <UserDetail userId={userId} />
                </Tabs.Panel>
                <Tabs.Panel value="payments" pt="md">
                    <UserPayments userId={userId} />
                </Tabs.Panel>
            </Tabs>
        )
    );
}

export default UserPage