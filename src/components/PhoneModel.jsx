// -----------------------------------------------------------------------------
// PhoneModel.jsx
// The iPhone 17 Pro GLB, rendered in its own transparent canvas underneath the
// office canvas.
//
// The whole trick is that this canvas reproduces CSS's projection EXACTLY, so a
// mesh here and a CSS-transformed element over there land on the same pixels:
//
//   • CSS `perspective: Npx` == a camera N px in front of the z=0 plane. Give
//     three a PerspectiveCamera at z=N with fov = 2·atan((vh/2)/N) and the z=0
//     plane maps 1:1 to the viewport — 1 world unit = 1 CSS px, origin centred.
//   • CSS y points down, three's points up  -> negate y.
//   • rotateY carries the same sign in both (verified against the render, not
//     reasoned from handedness — CSS's y-down basis makes that argument a trap).
//
// So the model's screen quad sits exactly under the office canvas's clip window
// at every angle, with no cross-fade and nothing to keep in sync by hand.
// -----------------------------------------------------------------------------

import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'

const GLB = `${import.meta.env.BASE_URL}iphone_17_pro_max_silver.glb`
const SCREEN_MATERIAL = '17ProMax_Screen'
const GLASS_MATERIAL = '17ProMax_glass' // black sheet at 25% alpha over the face

// Measured from the GLB's screen mesh (world space, before our scaling):
//   w 0.0730  h 0.1580  centre (0, 0.0816, -0.0048)   corner radius 0.0095.
export const SCREEN_MESH = {
  w: 0.073,
  h: 0.158,
  aspect: 0.158 / 0.073, // 2.164 — screen height per unit of screen width
  radius: 0.0095 / 0.073, // 0.130 of the screen width
  cx: 0,
  cy: 0.0816, // screen centre in model space
  cz: -0.0048,
}

export const PERSPECTIVE = 1400 // must match the CSS `perspective` on the rig

function Phone({ screenW, swingY }) {
  const { scene } = useGLTF(GLB)
  // Turn the screen plane into a depth-only holdout: it writes depth but no
  // colour, and renders first. The phone's back and innards then fail the depth
  // test and never draw, leaving a genuinely transparent hole in the exact shape
  // of the display (rounded corners included) for the office canvas underneath to
  // show through. The rim and Dynamic Island sit in FRONT of the screen plane
  // (z 0.1287 > 0.1253), so they still draw over it — a real bezel, for free.
  // Just hiding the mesh doesn't work: the phone is a closed solid, so you'd see
  // its back panel from the inside instead of the office.
  useMemo(() => {
    scene.traverse((o) => {
      if (!o.isMesh) return
      if (o.material?.name === SCREEN_MATERIAL) {
        o.material = o.material.clone()
        o.material.colorWrite = false
        o.material.transparent = false
        o.material.depthWrite = true
        o.renderOrder = -1
      }
      // The front glass is one black sheet at 25% alpha covering the whole face,
      // screen included. With live app content showing through the hole below it
      // that tint just reads as a dimmed screen, so keep the glass's depth (it
      // still occludes correctly) but stop it shading anything.
      if (o.material?.name === GLASS_MATERIAL) {
        o.material = o.material.clone()
        o.material.colorWrite = false
        o.material.depthWrite = false
      }
    })
  }, [scene])
  // Scale so the model's screen is exactly screenW px wide.
  const s = screenW / SCREEN_MESH.w
  return (
    // Group origin == the screen centre, so rotation pivots there — same as the
    // CSS rig's `transform-origin: cx cy`.
    <group rotation={[0, (swingY * Math.PI) / 180, 0]}>
      {/* This model authors the phone with its BACK toward the camera; spin it
          round in its own group so the swing above stays in CSS's terms. */}
      <group rotation={[0, Math.PI, 0]}>
        <primitive
          object={scene}
          scale={[s, s, s]}
          position={[-SCREEN_MESH.cx * s, -SCREEN_MESH.cy * s, -SCREEN_MESH.cz * s]}
        />
      </group>
    </group>
  )
}

export default function PhoneModel({ cx, cy, screenW, swingY, opacity = 1, vw, vh }) {
  const fov = (2 * Math.atan(vh / 2 / PERSPECTIVE) * 180) / Math.PI
  return (
    <div
      className="pointer-events-none absolute inset-0 z-20"
      style={{ opacity, visibility: opacity <= 0 ? 'hidden' : 'visible' }}
    >
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        resize={{ scroll: false, offsetSize: true }}
        camera={{ position: [0, 0, PERSPECTIVE], fov, near: 1, far: PERSPECTIVE * 4 }}
        // R3F sets pointer-events on the canvas itself, which overrides the
        // wrapper's `pointer-events-none` — without this the phone body swallows
        // every click meant for the app playing under its screen.
        style={{ background: 'transparent', pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          {/* Place the phone by its screen centre, converting CSS px -> world. */}
          <group position={[cx - vw / 2, -(cy - vh / 2), 0]}>
            <Phone screenW={screenW} swingY={swingY} />
          </group>
          <ambientLight intensity={0.5} />
          <directionalLight position={[400, 600, 900]} intensity={1.4} />
          <directionalLight position={[-600, 200, 400]} intensity={0.5} />
          <Environment preset="city" environmentIntensity={0.5} />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload(GLB)
