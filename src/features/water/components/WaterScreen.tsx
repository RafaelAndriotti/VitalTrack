import { Screen, Loading, ErrorBanner } from '@/components/ui';
import { useWater } from '@/features/water/hooks/useWater';
import { WaterHero } from './WaterHero';
import { PresetGrid } from './PresetGrid';
import { AmountForm } from './AmountForm';

export function WaterScreen() {
  const { loading, error, amount, goal, goalInput, setGoalInput, addWater, commitGoal } = useWater();

  if (loading) return <Loading />;

  return (
    <Screen>
      <ErrorBanner message={error} />
      <WaterHero
        amount={amount}
        goal={goal}
        goalInput={goalInput}
        onGoalChange={setGoalInput}
        onGoalCommit={commitGoal}
      />
      <PresetGrid amount={amount} goal={goal} onAdd={addWater} />
      <AmountForm title="Outra quantidade" buttonLabel="Adicionar" onSubmit={(ml) => addWater(ml)} />
      <AmountForm title="Remover quantidade" buttonLabel="Remover" subtract onSubmit={(ml) => addWater(-ml)} />
    </Screen>
  );
}
