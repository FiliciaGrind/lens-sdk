import { profileId, useLazyPublications } from '@lens-protocol/react-web';
import toast from 'react-hot-toast';

import { ErrorMessage } from '../components/error/ErrorMessage';
import { PublicationCard } from './components/PublicationCard';

export function UseLazyPublications() {
  const { called, data: publications, error, loading, execute } = useLazyPublications();

  const handleClick = async (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();

    const result = await execute({
      where: {
        from: [profileId('0x1b')],
      },
    });

    if (result.isFailure()) {
      toast.error(result.error.message);
    }
  };

  return (
    <div>
      <div>
        <button disabled={loading || called} type="button" onClick={handleClick}>
          {loading ? 'Loading...' : called ? 'Publications loaded' : 'Load publications'}
        </button>
      </div>

      {publications?.map((publication) => (
        <PublicationCard key={publication.id} publication={publication} />
      ))}

      {error && <ErrorMessage error={error} />}
    </div>
  );
}
