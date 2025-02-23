import { publicationId, usePublication } from '@lens-protocol/react-web';

import { ErrorMessage } from '../components/error/ErrorMessage';
import { Loading } from '../components/loading/Loading';
import { PublicationCard } from './components/PublicationCard';

export function UsePublication() {
  const {
    data: publication,
    error,
    loading,
  } = usePublication({ forId: publicationId('0x98-0x16') });

  if (loading) return <Loading />;

  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      <h1>
        <code>usePublication</code>
      </h1>
      <PublicationCard publication={publication} />
    </div>
  );
}
