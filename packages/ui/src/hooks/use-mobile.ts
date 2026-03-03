import { useMediaQuery } from "./use-media-query";

function useMobile(): boolean {
  return useMediaQuery("(max-width: 768px)");
}

export { useMobile };
