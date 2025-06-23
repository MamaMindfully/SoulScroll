import React, { useState, useEffect } from 'react';

export function useHasMounted() {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  return mounted;
}