import { useCallback, useLayoutEffect, useRef, useState } from 'react'

function relRect(el, shell) {
  const s = shell.getBoundingClientRect()
  const e = el.getBoundingClientRect()
  return {
    left: e.left - s.left,
    top: e.top - s.top,
    width: e.width,
    height: e.height,
  }
}

function bottomCenter(r) {
  return { x: r.left + r.width / 2, y: r.top + r.height }
}

function topCenter(r) {
  return { x: r.left + r.width / 2, y: r.top }
}

function orthogonalPathDown(x1, y1, x2, y2) {
  const midY = (y1 + y2) / 2
  return `M ${x1} ${y1} L ${x1} ${midY} L ${x2} ${midY} L ${x2} ${y2}`
}

/**
 * Computes SVG path strings for connector lines between opening columns, hub, and stacked knockout rounds.
 */
export function useBracketConnectors({ opening, hub, knockout }) {
  const shellRef = useRef(null)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const hubRef = useRef(null)
  const knockoutRefs = useRef([])

  const [geometry, setGeometry] = useState({ w: 0, h: 0, paths: [] })

  const setKnockoutRef = useCallback((index) => (el) => {
    knockoutRefs.current[index] = el
  }, [])

  useLayoutEffect(() => {
    const measure = () => {
      const shell = shellRef.current
      if (!shell) return

      const w = shell.clientWidth
      const h = shell.clientHeight
      const left = leftRef.current
      const right = rightRef.current
      const hubEl = hubRef.current
      const kos = knockoutRefs.current.filter(Boolean)

      if (!left || !right || !hubEl) {
        setGeometry({ w, h, paths: [] })
        return
      }

      const rl = relRect(left, shell)
      const rr = relRect(right, shell)
      const rh = relRect(hubEl, shell)

      const pLeft = bottomCenter(rl)
      const pRight = bottomCenter(rr)
      const pHubTop = topCenter(rh)
      const pHubBottom = bottomCenter(rh)

      const paths = []

      paths.push(orthogonalPathDown(pLeft.x, pLeft.y, pHubTop.x, pHubTop.y))
      paths.push(orthogonalPathDown(pRight.x, pRight.y, pHubTop.x, pHubTop.y))

      if (kos[0]) {
        const r0 = relRect(kos[0], shell)
        const pK0Top = topCenter(r0)
        paths.push(
          orthogonalPathDown(pHubBottom.x, pHubBottom.y, pK0Top.x, pK0Top.y),
        )
      }

      for (let i = 0; i < kos.length - 1; i++) {
        const ra = relRect(kos[i], shell)
        const rb = relRect(kos[i + 1], shell)
        const pa = bottomCenter(ra)
        const pb = topCenter(rb)
        paths.push(orthogonalPathDown(pa.x, pa.y, pb.x, pb.y))
      }

      setGeometry({ w, h, paths })
    }

    measure()

    const shell = shellRef.current
    if (!shell) return undefined

    const ro = new ResizeObserver(measure)
    ro.observe(shell)

    const onResize = () => measure()
    window.addEventListener('resize', onResize)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [opening, hub, knockout])

  return {
    shellRef,
    leftRef,
    rightRef,
    hubRef,
    setKnockoutRef,
    svgWidth: geometry.w,
    svgHeight: geometry.h,
    paths: geometry.paths,
  }
}
