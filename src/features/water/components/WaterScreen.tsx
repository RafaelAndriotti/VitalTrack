import { Screen, Loading, ErrorBanner } from '@/components/ui';
import { useWater } from '@/features/water/hooks/useWater';
import { useWeekWater } from '@/features/water/hooks/useWeekWater';
import { WaterHero } from './WaterHero';
import { PresetGrid } from './PresetGrid';
import { AmountForm } from './AmountForm';
import { WeekBars } from './WeekBars';

export function WaterScreen() {
  const { loading, error, amount, goal, goalInput, setGoalInput, addWater, commitGoal } = useWater();
  const week = useWeekWater();

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
      <WeekBars days={week} todayAmount={amount} todayGoal={goal} />
      <AmountForm onSubmit={addWater} />
    </Screen>
  );
}
