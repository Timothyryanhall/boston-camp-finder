import FinderLayout from '../features/finder/components/FinderLayout';
import { useFinderState } from '../features/finder/hooks/useFinderState';

export default function FinderPage() {
  const finder = useFinderState();

  return <FinderLayout {...finder} />;
}
