// -----------------------------------------------------------------------------
// MacModel.jsx
// The MacBook Pro 16" GLB, rendered the same way PhoneModel renders the iPhone:
// its own transparent canvas whose projection reproduces CSS exactly, and the
// display turned into a depth-only holdout so a live <iframe> underneath shows
// through the glass with the bezel drawn over its edges.
//
// Metaherb is a WEB app, so it is shown on the device it is actually used on.
// Everything here is measured off the GLB rather than typed in:
//   • the display is the one mesh with a white emissive — 34.385 wide, and
//     22.25 tall once the lid's tilt is taken out (its world box is 20.915
//     tall / 7.603 deep, and hypot(20.915, 7.603) = 22.25 — the real panel).
//   • that tilt is 19.98° off vertical, so the model is rotated forward by
//     exactly that to bring the screen parallel to the viewport. A tilted screen
//     would need the iframe drawn on a matching 3D plane; square-on, it is an
//     ordinary rectangle, exactly as it is for the phone.
// -----------------------------------------------------------------------------

import { Suspense, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'

const GLB = `${import.meta.env.BASE_URL}macbook_pro_m3_16.glb`
// Sketchfab names every material with a random string; this is the one the
// display carries (the only mesh in the lid with a white emissive).
const SCREEN_MATERIAL = 'sfCQkHOWyrsLmor'

export const MAC_SCREEN = {
  w: 34.385,
  h: 22.25,
  aspect: 22.25 / 34.385, // 0.647 — screen height per unit of width
  // Centre of the display in model space, and the lid's lean off vertical.
  cx: 0,
  cy: 11.75,
  cz: -16.96,
  tiltDeg: 19.98,
}

// Far beyond the phone's 1400, and this model is the one place that can differ:
// the mac never rotates, so nothing here has to line up with a CSS 3D transform
// — only the z = 0 plane has to map 1:1, which the fov below guarantees at any
// distance. The keyboard deck juts toward the camera, and the closer the camera
// the more of its top surface is seen: at 1400 it filled the bottom half of the
// screen, at 4200 it still read as the dominant half of the machine. This far
// out the projection is nearly flat and the deck folds up to a slim base under
// the screen — the device reads as mostly display.
export const PERSPECTIVE = 9000

export function Mac({ screenW, swingY = 0 }) {
  const { scene } = useGLTF(GLB)
  // Same holdout as the phone: the display writes depth but no colour and draws
  // first, so everything behind it inside the shell fails the depth test and the
  // hole is genuinely transparent — while the bezel, which sits in front of the
  // panel, still draws over its edges.
  useMemo(() => {
    scene.traverse((o) => {
      if (!o.isMesh || o.material?.name !== SCREEN_MATERIAL) return
      o.material = o.material.clone()
      o.material.colorWrite = false
      o.material.transparent = false
      o.material.depthWrite = true
      o.renderOrder = -1
    })
  }, [scene])
  const s = screenW / MAC_SCREEN.w
  // POSITIVE: the panel's normal leans up-and-forward, (0, 0.342, 0.940), so it
  // takes a +19.98° turn about X to bring it to (0, 0, 1). Negative tips the lid
  // the other way and the screen is seen edge-on.
  const t = (MAC_SCREEN.tiltDeg * Math.PI) / 180
  return (
    // Outer group carries the park swing in CSS's terms — same contract as the
    // phone — and the inner one holds the lid-tilt correction; both pivot on the
    // screen's centre, so the screen stays put as the device turns.
    <group rotation={[0, (swingY * Math.PI) / 180, 0]}>
      <group rotation={[t, 0, 0]}>
        <primitive
          object={scene}
          scale={[s, s, s]}
          position={[-MAC_SCREEN.cx * s, -MAC_SCREEN.cy * s, -MAC_SCREEN.cz * s]}
        />
      </group>
    </group>
  )
}

// The camera, kept in step with a PERSPECTIVE that now MOVES: parked the device
// wants real depth (a turned lid with no perspective cues reads as a skewed
// rectangle, not a turned object), focused it wants a nearly flat projection so
// the keyboard deck folds to a slim base. The distance is animated with the
// open/close scrub, and at every distance the fov is chosen so the z = 0 plane
// still maps 1:1 to CSS pixels — the one invariant everything else rests on.
function CameraRig({ persp, vh }) {
  const camera = useThree((st) => st.camera)
  camera.position.z = persp
  camera.fov = (2 * Math.atan(vh / 2 / persp) * 180) / Math.PI
  // The depth range hugs the model instead of running from 1 to 4x the camera
  // distance. This model is several near-identical shells a fraction of a unit
  // apart, and a 1..36000 range leaves the depth buffer no precision to order
  // them at z≈9000 — the body came out striped with z-fighting. The device
  // never leaves ±2000 of the z = 0 plane it is projected onto.
  camera.near = Math.max(1, persp - 2000)
  camera.far = persp + 2000
  camera.updateProjectionMatrix()
  return null
}

export default function MacModel({ cx, cy, screenW, swingY = 0, vw, vh, opacity = 1, persp = PERSPECTIVE }) {
  const fov = (2 * Math.atan(vh / 2 / persp) * 180) / Math.PI
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      style={{ opacity, visibility: opacity <= 0 ? 'hidden' : 'visible' }}
    >
      <Canvas
        frameloop="demand"
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        resize={{ scroll: false, offsetSize: true }}
        camera={{ position: [0, 0, persp], fov, near: Math.max(1, persp - 2000), far: persp + 2000 }}
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <CameraRig persp={persp} vh={vh} />
          <group position={[cx - vw / 2, -(cy - vh / 2), 0]}>
            <Mac screenW={screenW} swingY={swingY} />
          </group>
          <ambientLight intensity={0.55} />
          <directionalLight position={[400, 600, 900]} intensity={1.3} />
          <directionalLight position={[-600, 200, 400]} intensity={0.5} />
          <Environment preset="city" environmentIntensity={0.55} />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload(GLB)
