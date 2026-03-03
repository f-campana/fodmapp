import * as React from "react";

interface UseLocaleReturn {
  locale: string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (value: Date, options?: Intl.DateTimeFormatOptions) => string;
}

function useLocale(): UseLocaleReturn {
  const locale = "fr-FR";

  const formatNumber = React.useCallback(
    (value: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(locale, options).format(value);
    },
    [locale],
  );

  const formatDate = React.useCallback(
    (value: Date, options?: Intl.DateTimeFormatOptions) => {
      return new Intl.DateTimeFormat(locale, options).format(value);
    },
    [locale],
  );

  return {
    locale,
    formatNumber,
    formatDate,
  };
}

export { useLocale };
export type { UseLocaleReturn };
