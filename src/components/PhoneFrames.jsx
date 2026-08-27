// -----------------------------------------------------------------------------
// PhoneFrames.jsx
// A grid of screens wearing the REAL device — the same iPhone GLB the feed parks
// on the home screen, not a CSS rectangle drawn to look like one.
//
// How it holds together:
//   • Each cell lays out a plain DOM box with the BODY's aspect, and inside it a
//     screen box placed by the model's own measurements (screen size and centre
//     against the body's bounding box). The screenshot / wireframe is ordinary
//     HTML in that box — selectable, lazy-loaded, cheap.
//   • ONE canvas is laid over the whole grid and draws a phone per cell, scaled
//     so its screen is exactly the screen box. PhoneModel's holdout trick makes
//     the display a genuine hole, so the DOM underneath shows through it with the
//     bezel, rim and island drawn over the edges.
//   • Each cell gets its own CLONE of the GLB scene: a three object has one
//     parent, and handing the same scene to four <primitive>s mounts only the
//     last one — measured, three of the four cells came out bare.
//
// The body's box is MEASURED from the loaded GLB (Box3), not typed in, so the
// bezel widths can never drift from the model that draws them.
// -----------------------------------------------------------------------------

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import { GLTFLoader } from 'three-stdlib'
import * as THREE from 'three'
import { SCREEN_MESH, PERSPECTIVE } from './PhoneModel'

const GLB = `${import.meta.env.BASE_URL}iphone_17_pro_max_silver.glb`
const SCREEN_MATERIAL = '17ProMax_Screen'
const GLASS_MATERIAL = '17ProMax_glass'

// The body's bounding box in model space, filled in once the GLB is read. Module
// scope: every grid on the page is framing the same device.
let BODY = null
function readBody(scene) {
  if (BODY) return BODY
  const box = new THREE.Box3().setFromObject(scene)
  BODY = {
    w: box.max.x - box.min.x,
    h: box.max.y - box.min.y,
    cx: (box.min.x + box.max.x) / 2,
    cy: (box.min.y + box.max.y) / 2,
  }
  return BODY
}

// One phone, from its own clone of the scene. The holdout materials are applied
// to the clone's meshes — clone(true) shares materials, so they are cloned per
// mesh here exactly as PhoneModel does for the hero device.
function PhoneInstance({ screenW }) {
  const { scene } = useGLTF(GLB)
  const inst = useMemo(() => {
    const c = scene.clone(true)
    c.traverse(o => {
      if (!o.isMesh) return
      if (o.material?.name === SCREEN_MATERIAL) {
        o.material = o.material.clone()
        o.material.colorWrite = false
        o.material.transparent = false
        o.material.depthWrite = true
        o.renderOrder = -1
      }
      if (o.material?.name === GLASS_MATERIAL) {
        o.material = o.material.clone()
        o.material.colorWrite = false
        o.material.depthWrite = false
      }
    })
    return c
  }, [scene])
  const s = screenW / SCREEN_MESH.w
  return (
    <group rotation={[0, Math.PI, 0]}>
      <primitive
        object={inst}
        scale={[s, s, s]}
        position={[-SCREEN_MESH.cx * s, -SCREEN_MESH.cy * s, -SCREEN_MESH.cz * s]}
      />
    </group>
  )
}

export default function PhoneFrames({ items, renderScreen, className = '' }) {
  const gridRef = useRef(null)
  const screenRefs = useRef([])
  const [layout, setLayout] = useState(null)
  const [body, setBody] = useState(BODY)

  // The GLB is loaded once more here (the browser cache makes it one fetch)
  // purely to measure the body, so the DOM can be laid out from the same numbers
  // the renderer draws with. useGLTF cannot be asked outside a render, and the
  // canvas that would ask it only mounts once this answer is known.
  useEffect(() => {
    if (body) return undefined
    let on = true
    new GLTFLoader().load(GLB, gltf => {
      if (on) setBody(readBody(gltf.scene))
    })
    return () => {
      on = false
    }
  }, [body])

  const measure = useCallback(() => {
    const grid = gridRef.current
    if (!grid) return
    const box = grid.getBoundingClientRect()
    const screens = screenRefs.current.filter(Boolean).map(el => {
      const r = el.getBoundingClientRect()
      return { cx: r.left - box.left + r.width / 2, cy: r.top - box.top + r.height / 2, w: r.width }
    })
    if (!screens.length || box.width <= 0) return
    setLayout({ vw: box.width, vh: box.height, screens })
  }, [])

  useEffect(() => {
    measure()
    const ro = new ResizeObserver(measure)
    if (gridRef.current) ro.observe(gridRef.current)
    screenRefs.current.filter(Boolean).forEach(el => ro.observe(el))
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure, items.length, body])

  // Where the screen sits inside the body, as fractions of the body's box.
  // Until the GLB has answered, lay out with the screen filling the cell — the
  // canvas is not up yet either, so nothing is misaligned, just frameless.
  const inset = body
    ? {
        left: ((SCREEN_MESH.cx - SCREEN_MESH.w / 2 - (body.cx - body.w / 2)) / body.w) * 100,
        top: ((body.cy + body.h / 2 - (SCREEN_MESH.cy + SCREEN_MESH.h / 2)) / body.h) * 100,
      }
    : null

  const fov = layout ? (2 * Math.atan(layout.vh / 2 / PERSPECTIVE) * 180) / Math.PI : 40

  return (
    <div ref={gridRef} className={`relative ${className}`}>
      {items.map((item, i) => (
        <div key={item.key ?? i}>
          <div
            className="relative mx-auto w-full"
            style={{ aspectRatio: body ? `${body.w} / ${body.h}` : `${SCREEN_MESH.w} / ${SCREEN_MESH.h}` }}
          >
            <div
              ref={el => {
                screenRefs.current[i] = el
              }}
              className="absolute overflow-hidden bg-white"
              style={
                inset
                  ? {
                      left: `${inset.left}%`,
                      right: `${inset.left}%`,
                      top: `${inset.top}%`,
                      bottom: `${inset.top}%`,
                      // The model's own corner radius, as a fraction of each axis.
                      borderRadius: `${SCREEN_MESH.radius * 100}% / ${(SCREEN_MESH.radius / SCREEN_MESH.aspect) * 100}%`,
                    }
                  : { inset: 0, borderRadius: '18px' }
              }
            >
              {renderScreen(item)}
            </div>
          </div>
          {item.caption}
        </div>
      ))}

      {/* The bodies, over the top. Nothing here takes a pointer. */}
      {layout && body && (
        <div className="pointer-events-none absolute inset-0 z-10">
          <Canvas
            frameloop="demand"
            gl={{ antialias: true, alpha: true }}
            dpr={[1, 2]}
            resize={{ scroll: false, offsetSize: true }}
            camera={{ position: [0, 0, PERSPECTIVE], fov, near: 1, far: PERSPECTIVE * 4 }}
            style={{ background: 'transparent', pointerEvents: 'none' }}
          >
            <Suspense fallback={null}>
              {layout.screens.map((s, i) => (
                <group key={i} position={[s.cx - layout.vw / 2, -(s.cy - layout.vh / 2), 0]}>
                  <PhoneInstance screenW={s.w} />
                </group>
              ))}
              <ambientLight intensity={0.55} />
              <directionalLight position={[400, 600, 900]} intensity={1.3} />
              <directionalLight position={[-600, 200, 400]} intensity={0.5} />
              <Environment preset="city" environmentIntensity={0.5} />
            </Suspense>
          </Canvas>
        </div>
      )}
    </div>
  )
}

useGLTF.preload(GLB)
