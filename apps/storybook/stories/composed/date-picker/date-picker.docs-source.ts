export const datePickerRecommendedUsageCode = `import { useState } from "react";

import { DatePicker } from "@fodmap/ui/date-picker";

export function Example() {
  const [value, setValue] = useState<Date | undefined>();

  return (
    <DatePicker
      onValueChange={setValue}
      placeholder="Choisir une date"
      triggerAriaLabel="Date de rendez-vous"
    />
  );
}
`;
