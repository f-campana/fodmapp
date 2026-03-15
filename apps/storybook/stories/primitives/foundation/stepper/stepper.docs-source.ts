export const stepperRecommendedUsageCode = `import {
  Stepper,
  StepperDescription,
  StepperLabel,
  StepperSeparator,
  StepperStep,
} from "@fodmap/ui";

export function ReviewStatusStepper() {
  return (
    <Stepper orientation="horizontal">
      <StepperStep status="completed" step="1">
        <StepperLabel>Batch generated</StepperLabel>
        <StepperDescription>Draft materialization and scoring finished</StepperDescription>
      </StepperStep>
      <StepperSeparator orientation="horizontal" />
      <StepperStep status="current" step="2">
        <StepperLabel>Human review</StepperLabel>
        <StepperDescription>CSV decisions are in progress</StepperDescription>
      </StepperStep>
    </Stepper>
  );
}`;
