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

function leftCenter(r) {
  return { x: r.left, y: r.top + r.height / 2 }
}

function rightCenter(r) {
  return { x: r.left + r.width, y: r.top + r.height / 2 }
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
  const knockoutMatchRefs = useRef([])

  const [geometry, setGeometry] = useState({ w: 0, h: 0, paths: [] })

  const setKnockoutRef = useCallback((index) => (el) => {
    knockoutRefs.current[index] = el
  }, [])

  const setKnockoutMatchRef = useCallback((roundIndex, matchIndex) => (el) => {
    if (!knockoutMatchRefs.current[roundIndex]) {
      knockoutMatchRefs.current[roundIndex] = []
    }
    knockoutMatchRefs.current[roundIndex][matchIndex] = el
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

      const round2Matches = knockoutMatchRefs.current[0] || []
      const quarterfinalMatches = knockoutMatchRefs.current[1] || []
      const pairCount = Math.min(
        Math.floor(round2Matches.length / 2),
        quarterfinalMatches.length,
      )

      for (let i = 0; i < pairCount; i++) {
        const matchA = round2Matches[i * 2]
        const matchB = round2Matches[i * 2 + 1]
        const target = quarterfinalMatches[i]

        if (!matchA || !matchB || !target) continue

        const pA = rightCenter(relRect(matchA, shell))
        const pB = rightCenter(relRect(matchB, shell))
        const pTarget = leftCenter(relRect(target, shell))
        const maxSourceX = Math.max(pA.x, pB.x)
        const mergeX = Math.min(maxSourceX + 18, pTarget.x - 12)
        const mergeY = (pA.y + pB.y) / 2

        if (mergeX >= pTarget.x) continue

        paths.push(
          `M ${pA.x} ${pA.y} L ${mergeX} ${pA.y} ` +
            `M ${pB.x} ${pB.y} L ${mergeX} ${pB.y} ` +
            `M ${mergeX} ${pA.y} L ${mergeX} ${pB.y} ` +
            `M ${mergeX} ${mergeY} L ${pTarget.x} ${mergeY}`,
        )
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
    setKnockoutMatchRef,
    svgWidth: geometry.w,
    svgHeight: geometry.h,
    paths: geometry.paths,
  }
}
