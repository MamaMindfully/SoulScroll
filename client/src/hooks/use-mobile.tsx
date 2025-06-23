import * as React from "react"
import { // useHasMounted removed } from "@/utils/// useHasMounted removed"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const hasMounted = // useHasMounted removed()
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    if (!hasMounted) return;
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [hasMounted])

  return !!isMobile
}
