'use client'
import { useEffect } from 'react'

export default function DisableZoom() {
  useEffect(() => {
    const handler = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault()        // pinch
    }
    const dblTap = (e: TouchEvent) => e.preventDefault()  // double tap

    document.addEventListener('touchmove', handler, { passive: false })
    document.addEventListener('dblclick', e => e.preventDefault())
    document.addEventListener('touchend', dblTap, { passive: false })

    return () => {
      document.removeEventListener('touchmove', handler)
      document.removeEventListener('dblclick', e => e.preventDefault())
      document.removeEventListener('touchend', dblTap)
    }
  }, [])

  return null
}
