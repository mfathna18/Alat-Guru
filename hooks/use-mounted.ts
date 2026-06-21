"use client";

import * as React from "react";

/** True setelah komponen ter-mount di browser — hindari hydration mismatch. */
export function useMounted() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
