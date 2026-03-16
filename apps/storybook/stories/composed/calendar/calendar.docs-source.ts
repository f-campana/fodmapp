export const calendarRecommendedUsageCode = `import { useState } from "react";

import { Calendar } from "@fodmapp/ui";

export function Example() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  return (
    <Calendar
      defaultMonth={new Date(2026, 2, 1)}
      mode="single"
      onSelect={setSelectedDate}
      selected={selectedDate}
    />
  );
}
`;
