// -----------------------------------------------------------------------------
// useGLRecover.js
// A browser gives one page only a handful of live WebGL contexts. Past that it
// does not refuse the new one — it silently kills the OLDEST, and three.js
// prints "THREE.WebGLRenderer: Context Lost." to a console nobody is reading.
// The canvas keeps its size and its place in the layout; it just stops drawing.
// That is how a device could vanish from a page it had been sitting on: opening
// a project's detail mounted the report reel's own canvases, and the section
// underneath lost its context to make room.
//
// Fewer contexts is the real fix (sections out of range mount no canvas at all),
// but a page can still be pushed over the limit, so this is the backstop: when a
// canvas loses its context, remount the whole <Canvas> under a fresh key. The
// scene is declarative, so it rebuilds exactly as it was.
//
//   const { canvasKey, onCreated } = useGLRecover()
//   <Canvas key={canvasKey} onCreated={onCreated} …>
// -----------------------------------------------------------------------------

import { useCallback, useState } from 'react'
import { invalidate } from '@react-three/fiber'

export default function useGLRecover() {
  const [canvasKey, setCanvasKey] = useState(0)

  const onCreated = useCallback(({ gl }) => {
    const el = gl.domElement
    // These canvases run `frameloop="demand"`: they paint when something asks
    // them to, and a fresh canvas asks exactly once, at mount. A canvas
    // remounted after a context loss can take that one frame before the model
    // is back in the scene graph, and then never paint again — a live, blank
    // canvas, which is what the missing laptop actually was. A short burst of
    // frames covers the reload without putting the page on a render loop.
    let n = 0
    const tick = () => {
      invalidate()
      if (++n < 30) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)

    if (!el || el.dataset.glRecoverWired) return
    el.dataset.glRecoverWired = '1'
    el.addEventListener(
      'webglcontextlost',
      (e) => {
        // Without preventDefault the context can never come back at all — the
        // browser treats the loss as final and no 'webglcontextrestored' is
        // ever fired.
        e.preventDefault()
        setCanvasKey((n) => n + 1)
      },
      false
    )
  }, [])

  return { canvasKey, onCreated }
}
