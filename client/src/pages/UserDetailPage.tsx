import UserDetail from "@/components/user/UserDetail"
import { useParams } from "react-router-dom";

const UserDetailPage = () => {
    const { id } = useParams<{ id: string }>();

    return (
        <UserDetail userId={id}/>
    )
}

export default UserDetailPage