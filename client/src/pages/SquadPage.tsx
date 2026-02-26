import SquadDetail from '@/components/squad/SquadDetail';
import { useParams } from 'react-router-dom';

const SquadPage = () => {
    const { id } = useParams<{ id: string }>();



    return (
        <SquadDetail squadId={id} />
    )

};

export default SquadPage;
