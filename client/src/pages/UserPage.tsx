import UserDetail from "@/components/user/UserDetail"
import UserPayments from "@/components/user/UserPayments";
import PageHeader from "@/components/ui/PageHeader";
import { Tabs } from '@mantine/core';
import { IconReceipt2, IconUser } from '@tabler/icons-react';
import { useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useAdminPermissions } from "@/utils/helpers";

const UserPage = () => {
    const { id } = useParams<{ id?: string }>();
    const { user } = useAuth();
    // ?tab=payments opens the payments directly (links from notifications and the user menu)
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') === 'payments' ? 'payments' : 'detail';
    const isAdmin = useAdminPermissions();
    const userId = id ?? user?._id;
    const isOwnProfile = userId === user?._id;
    // Payments are visible only to the member and admins
    const canSeePayments = isOwnProfile || isAdmin;

    if (!userId) {
        return null;
    }

    if (user.new) {
        return (
            <>
                <PageHeader title="Vítejte v SpravujTym!" description="Než začnete, doplňte prosím své údaje." />
                <UserDetail userId={userId} />
            </>
        );
    }

    if (!canSeePayments) {
        return (
            <>
                <PageHeader title="Profil člena" />
                <UserDetail userId={userId} />
            </>
        );
    }

    return (
        <>
            <PageHeader
                title={isOwnProfile ? 'Můj profil' : 'Profil člena'}
                description={isOwnProfile ? 'Osobní údaje, nastavení a platby.' : undefined}
            />
            <Tabs
                value={activeTab}
                onChange={(tab) => setSearchParams(tab === 'payments' ? { tab } : {}, { replace: true })}
                keepMounted={false}
            >
                <Tabs.List>
                    <Tabs.Tab value="detail" leftSection={<IconUser size={16} />}>
                        Údaje
                    </Tabs.Tab>
                    <Tabs.Tab value="payments" leftSection={<IconReceipt2 size={16} />}>
                        Platby
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="detail" pt="lg">
                    <UserDetail userId={userId} />
                </Tabs.Panel>
                <Tabs.Panel value="payments" pt="lg">
                    <UserPayments userId={userId} />
                </Tabs.Panel>
            </Tabs>
        </>
    );
}

export default UserPage
