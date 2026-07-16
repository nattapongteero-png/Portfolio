// -----------------------------------------------------------------------------
// OfficeScene.jsx
// A professional isometric 3D simulator of a modern corporate office fused with
// a Herbal R&D / processing facility (React Three Fiber + Drei).
//
// Structure (each zone is its own component + entry in ZONES so clickable
// popups / character drag can be wired later):
//   • Platform          — floating architectural grid slab
//   • MainOfficeZone    — open-plan desks, ergonomic chairs, smiley computers, plants
//   • MeetingRoomZone   — glass-walled room, conference table, presentation board
//   • LabZone           — countertops w/ test tubes + herb pots, steel tanks, packaging line
//   • ServerZone        — minimal server racks with blinking lights
//   • Character         — draggable cylinder mascot (drop-bounce); near server → popup
//
// Materials: Matte (furniture), Glass (partitions, transmission), Steel (tanks).
// -----------------------------------------------------------------------------

import { memo, useRef, useState, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Environment,
  ContactShadows,
  Html,
  RoundedBox,
  SoftShadows,
  Float,
  OrbitControls,
  Grid,
} from '@react-three/drei'
import { EffectComposer, Bloom, N8AO, SMAA, Vignette } from '@react-three/postprocessing'
import * as THREE from 'three'

// --- refined palette --------------------------------------------------------
// MyAtlas health-app palette: mint green brand, soft mint surfaces, blue accents.
const P = {
  platform: '#e7f1ec',   // soft mint base (bgPrimary #F4F8F5 family)
  platformEdge: '#d2e4da',
  wall: '#dde5e0',
  concrete: '#d6e2db',   // light mint floor
  wood: '#d3ad7d',       // warm wood accent for office
  woodDark: '#bf9560',
  white: '#dde4e0',
  teal: '#1d8b6b',       // brandPrimary
  tealSoft: '#c3e8da',   // mint tint
  steel: '#c7cdd4',
  screen: '#7cd4fd',     // info blue screens
  leaf: '#4ab99c',       // primary400
  leafDark: '#1d8b6b',   // primary600
  herb: '#4ca30d',       // success green
  body: '#4ab99c',
  bodyDark: '#1d8b6b',
  head: '#ffe3d6',
  chair: '#37474a',      // deep teal-gray
  accent: '#34c759',
}

// Zone registry — center + copy for later clickable popups.
export const ZONES = [
  { id: 'office', label: 'Main Office & Admin', position: [-3.4, 0, 2.2], info: 'Open-plan corporate workspace — design, product & admin.' },
  { id: 'meeting', label: 'Glass Meeting Room', position: [-3.4, 0, -2.4], info: 'Stakeholder reviews & presentations.' },
  { id: 'lab', label: 'Product & QA Lab', position: [3.4, 0, 2.2], info: 'Device testing, product dashboards & dev benches.' },
  { id: 'server', label: 'Server & Tech', position: [4.6, 0, -2.6], info: 'Backend: Node.js + PostgreSQL, Docker, WebSocket realtime.' },
]

const SERVER_POS = ZONES[3].position
const NEAR_DIST = 1.6

// --- shared materials -------------------------------------------------------
function Matte({ color, ...p }) {
  return <meshStandardMaterial color={color} roughness={0.82} metalness={0.02} {...p} />
}
function Steel({ color = P.steel, ...p }) {
  return <meshStandardMaterial color={color} roughness={0.22} metalness={0.9} {...p} />
}
function Glass(p) {
  return (
    <meshPhysicalMaterial
      transmission={0.92}
      thickness={0.4}
      roughness={0.06}
      ior={1.45}
      transparent
      opacity={0.35}
      color="#dff3f2"
      {...p}
    />
  )
}

// --- reusable props ---------------------------------------------------------
function SolidWall({ position, size = [4, 0.9, 0.12], color = P.wall }) {
  return (
    <RoundedBox args={size} radius={0.03} smoothness={3} position={position} castShadow receiveShadow>
      <Matte color={color} />
    </RoundedBox>
  )
}

function GlassWall({ position, size = [4, 1.8, 0.06], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* frame */}
      <mesh position={[0, size[1] / 2, 0]}>
        <boxGeometry args={[size[0], 0.05, 0.09]} />
        <Steel color="#aeb6bf" />
      </mesh>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[size[0], 0.05, 0.09]} />
        <Steel color="#aeb6bf" />
      </mesh>
      {/* pane */}
      <mesh position={[0, size[1] / 2, 0]}>
        <boxGeometry args={size} />
        <Glass />
      </mesh>
    </group>
  )
}

function SmileyComputer({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* rounded monitor */}
      <RoundedBox args={[0.62, 0.44, 0.08]} radius={0.09} smoothness={5} position={[0, 0.42, 0]} castShadow>
        <Matte color={P.white} />
      </RoundedBox>
      {/* smiley screen (glows) */}
      <mesh position={[0, 0.42, 0.05]}>
        <planeGeometry args={[0.5, 0.32]} />
        <meshStandardMaterial color={P.screen} emissive={P.screen} emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
      {[-0.1, 0.1].map((x) => (
        <mesh key={x} position={[x, 0.47, 0.061]}>
          <circleGeometry args={[0.022, 16]} />
          <meshBasicMaterial color="#25506b" />
        </mesh>
      ))}
      <mesh position={[0, 0.4, 0.061]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.06, 0.012, 8, 24, Math.PI]} />
        <meshBasicMaterial color="#25506b" />
      </mesh>
      {/* stand */}
      <mesh position={[0, 0.16, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.2, 12]} />
        <Matte color={P.concrete} />
      </mesh>
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.04, 20]} />
        <Matte color={P.concrete} />
      </mesh>
    </group>
  )
}

function OfficeChair({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0.42, 0]} castShadow>
        <cylinderGeometry args={[0.19, 0.19, 0.07, 24]} />
        <Matte color={P.chair} />
      </mesh>
      <RoundedBox args={[0.36, 0.34, 0.07]} radius={0.06} smoothness={4} position={[0, 0.64, -0.16]} rotation={[0.12, 0, 0]} castShadow>
        <Matte color={P.chair} />
      </RoundedBox>
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.03, 0.28, 12]} />
        <Steel color="#8b929b" />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.16, 0.06, Math.sin(a) * 0.16]} castShadow>
            <boxGeometry args={[0.16, 0.05, 0.05]} />
            <Matte color={P.chair} />
          </mesh>
        )
      })}
    </group>
  )
}

function Desk({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[1.5, 0.07, 0.8]} radius={0.03} smoothness={4} position={[0, 0.72, 0]} castShadow receiveShadow>
        <Matte color={P.white} />
      </RoundedBox>
      {[[-0.68, 0.32], [0.68, 0.32], [-0.68, -0.32], [0.68, -0.32]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} castShadow>
          <boxGeometry args={[0.05, 0.72, 0.05]} />
          <Steel color="#9aa1aa" />
        </mesh>
      ))}
    </group>
  )
}

function Plant({ position = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.1, 0.28, 20]} />
        <Matte color={P.woodDark} />
      </mesh>
      {[[0, 0.4, 0.16], [0.12, 0.36, 0.14], [-0.12, 0.36, 0.13]].map((pt, i) => (
        <mesh key={i} position={pt} castShadow>
          <sphereGeometry args={[0.16, 20, 20]} />
          <Matte color={i % 2 ? P.leafDark : P.leaf} />
        </mesh>
      ))}
    </group>
  )
}

// --- realistic desk / tech accessories --------------------------------------
function Keyboard({ position = [0, 0, 0] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.44, 0.03, 0.16]} radius={0.015} smoothness={3} castShadow>
        <Matte color="#2c333a" />
      </RoundedBox>
      <mesh position={[0, 0.018, 0]}>
        <planeGeometry args={[0.4, 0.12]} />
        <meshStandardMaterial color="#3c4650" roughness={0.9} />
      </mesh>
    </group>
  )
}
function Mouse({ position = [0, 0, 0] }) {
  return (
    <mesh position={position} castShadow>
      <sphereGeometry args={[0.05, 16, 12]} />
      <Matte color="#2c333a" />
    </mesh>
  )
}
function Mug({ position = [0, 0, 0], color = P.accent }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.06, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.04, 0.12, 18]} />
        <Matte color={color} />
      </mesh>
      <mesh position={[0.06, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.03, 0.01, 8, 16, Math.PI]} />
        <Matte color={color} />
      </mesh>
    </group>
  )
}
function Laptop({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.44, 0.02, 0.3]} radius={0.01} smoothness={3} castShadow>
        <Steel color="#b9c0c8" />
      </RoundedBox>
      <group position={[0, 0.14, -0.14]} rotation={[-0.35, 0, 0]}>
        <RoundedBox args={[0.44, 0.28, 0.02]} radius={0.01} smoothness={3} castShadow>
          <Steel color="#b9c0c8" />
        </RoundedBox>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.4, 0.24]} />
          <meshStandardMaterial color={P.screen} emissive={P.screen} emissiveIntensity={0.4} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
// A phone on a small stand showing the app UI (QA / device testing).
function PhoneStand({ position = [0, 0, 0], hue = P.leaf }) {
  return (
    <group position={position}>
      {/* stand */}
      <mesh position={[0, 0.04, 0.04]} castShadow>
        <boxGeometry args={[0.1, 0.08, 0.06]} />
        <Matte color="#8b929b" />
      </mesh>
      {/* phone */}
      <group position={[0, 0.22, 0]} rotation={[-0.12, 0, 0]}>
        <RoundedBox args={[0.16, 0.32, 0.02]} radius={0.02} smoothness={4} castShadow>
          <Matte color="#2c333a" />
        </RoundedBox>
        <mesh position={[0, 0, 0.012]}>
          <planeGeometry args={[0.13, 0.28]} />
          <meshStandardMaterial color={hue} emissive={hue} emissiveIntensity={0.35} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}
// Large wall-mounted dashboard screen.
function WallScreen({ position = [0, 0, 0], rotation = [0, 0, 0], size = [2, 1.1] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[size[0] + 0.1, size[1] + 0.1, 0.05]} radius={0.03} smoothness={3} castShadow>
        <Matte color="#2c333a" />
      </RoundedBox>
      <mesh position={[0, 0, 0.031]}>
        <planeGeometry args={size} />
        <meshStandardMaterial color={P.teal} emissive={P.teal} emissiveIntensity={0.3} toneMapped={false} />
      </mesh>
      {/* dashboard bars */}
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <mesh key={x} position={[x, -0.15 + (i % 2) * 0.1, 0.033]}>
          <planeGeometry args={[0.22, 0.4 + (i % 3) * 0.15]} />
          <meshStandardMaterial color={P.tealSoft} emissive={P.tealSoft} emissiveIntensity={0.25} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

// --- open-plan building blocks ---------------------------------------------
// Two desks back-to-back with computers + chairs — the core workstation unit.
function DeskPod({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {[1, -1].map((s) => (
        <group key={s} position={[0, 0, 0.42 * s]} rotation={[0, s > 0 ? 0 : Math.PI, 0]}>
          <Desk />
          <SmileyComputer position={[0, 0.72, -0.15]} />
          <Keyboard position={[0, 0.77, 0.12]} />
          <Mouse position={[0.28, 0.775, 0.12]} />
          <OfficeChair position={[0, 0, 0.5]} rotation={[0, Math.PI, 0]} />
        </group>
      ))}
    </group>
  )
}

// A cafe/round meeting table with a few chairs (fills open breakout areas).
function RoundTableSet({ position = [0, 0, 0], chairs = 3, color = P.wood }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.06, 32]} />
        <Matte color={color} />
      </mesh>
      <mesh position={[0, 0.28, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.55, 12]} />
        <Steel color="#8b929b" />
      </mesh>
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.22, 0.22, 0.04, 20]} />
        <Steel color="#8b929b" />
      </mesh>
      {Array.from({ length: chairs }).map((_, i) => {
        const a = (i / chairs) * Math.PI * 2
        return <OfficeChair key={i} position={[Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85]} rotation={[0, -a + Math.PI / 2, 0]} />
      })}
    </group>
  )
}

// Free-standing bookshelf / storage unit (no walls — just furniture).
const BOOK_COLORS = ['#1d8b6b', '#4ab99c', '#7cd4fd', '#34c759', '#d9b483', '#c49a63']
function Bookshelf({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[1.4, 1.5, 0.4]} radius={0.03} smoothness={3} position={[0, 0.75, 0]} castShadow receiveShadow>
        <Matte color={P.white} />
      </RoundedBox>
      {[0.35, 0.75, 1.15].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0.05]}>
            <boxGeometry args={[1.3, 0.03, 0.34]} />
            <Matte color={P.concrete} />
          </mesh>
          {[-0.5, -0.3, -0.1, 0.1, 0.3, 0.5].map((x, i) => (
            <mesh key={x} position={[x, y + 0.13, 0.08]} castShadow>
              <boxGeometry args={[0.08, 0.24, 0.28]} />
              <Matte color={BOOK_COLORS[(i + Math.round(y * 10)) % BOOK_COLORS.length]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// --- ZONE 1: Main Office ----------------------------------------------------
function MainOfficeZone() {
  const desks = [
    { p: [-4.8, 0, 1.2], r: 0 },
    { p: [-2.6, 0, 1.2], r: 0 },
    { p: [-4.8, 0, 3.2], r: Math.PI },
    { p: [-2.6, 0, 3.2], r: Math.PI },
    { p: [-4.8, 0, -0.9], r: 0 },
    { p: [-2.6, 0, -0.9], r: 0 },
  ]
  return (
    <group name="zone-office">
      {desks.map((d, i) => (
        <group key={i} position={d.p} rotation={[0, d.r, 0]}>
          <Desk />
          <SmileyComputer position={[0, 0.72, -0.15]} />
          <Keyboard position={[0, 0.77, 0.12]} />
          <Mouse position={[0.28, 0.775, 0.12]} />
          {i % 2 === 0 ? (
            <Mug position={[-0.5, 0.76, 0.05]} color={i % 4 === 0 ? P.accent : P.teal} />
          ) : (
            <Laptop position={[-0.42, 0.76, 0.1]} rotation={[0, 0.4, 0]} />
          )}
          <OfficeChair position={[0, 0, 0.55]} rotation={[0, Math.PI, 0]} />
        </group>
      ))}
      {/* team dashboard on the office wall */}
      <WallScreen position={[-3.7, 1.5, -1.55]} size={[2.2, 1.2]} />
      <Plant position={[-5.6, 0, 4]} scale={1.1} />
      <Plant position={[-1.4, 0, 4]} scale={0.9} />
    </group>
  )
}

// --- ZONE 2: Glass Meeting Room ---------------------------------------------
function MeetingRoomZone() {
  return (
    <group name="zone-meeting" position={[-3.4, 0, -2.4]}>
      {/* conference table */}
      <RoundedBox args={[2.4, 0.08, 0.9]} radius={0.06} smoothness={4} position={[0, 0.72, 0]} castShadow receiveShadow>
        <Matte color={P.wood} />
      </RoundedBox>
      <mesh position={[0, 0.36, 0]} castShadow>
        <boxGeometry args={[1.6, 0.7, 0.2]} />
        <Matte color={P.woodDark} />
      </mesh>
      {[-0.8, 0, 0.8].map((x) => (
        <group key={x}>
          <OfficeChair position={[x, 0, 0.75]} rotation={[0, Math.PI, 0]} />
          <OfficeChair position={[x, 0, -0.75]} rotation={[0, 0, 0]} />
        </group>
      ))}
      {/* presentation board on the back wall */}
      <group position={[0, 1.2, -1.7]}>
        <RoundedBox args={[1.8, 1, 0.06]} radius={0.03} smoothness={3} castShadow>
          <Matte color={P.white} />
        </RoundedBox>
        <mesh position={[0, 0, 0.04]}>
          <planeGeometry args={[1.6, 0.82]} />
          <meshStandardMaterial color={P.tealSoft} emissive={P.teal} emissiveIntensity={0.25} toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

// --- ZONE 3: Product & QA Lab (device testing, not a factory) ---------------
function StandingDesk({ position = [0, 0, 0], rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[1.3, 0.06, 0.6]} radius={0.03} smoothness={3} position={[0, 0.95, 0]} castShadow receiveShadow>
        <Matte color={P.wood} />
      </RoundedBox>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.47, 0]} castShadow>
          <boxGeometry args={[0.06, 0.9, 0.06]} />
          <Steel color="#8b929b" />
        </mesh>
      ))}
      <Laptop position={[0.1, 0.98, 0]} rotation={[0, -0.2, 0]} />
    </group>
  )
}

function LabZone() {
  return (
    <group name="zone-lab" position={[3.4, 0, 2.2]}>
      {/* QA test bench — a row of phones on stands showing the app */}
      <RoundedBox args={[3.4, 0.08, 0.7]} radius={0.03} smoothness={3} position={[0, 0.82, 1.4]} castShadow receiveShadow>
        <Matte color={P.white} />
      </RoundedBox>
      <mesh position={[0, 0.4, 1.4]} castShadow>
        <boxGeometry args={[3.3, 0.8, 0.6]} />
        <Matte color={P.concrete} />
      </mesh>
      {[-1.3, -0.85, -0.4, 0.05, 0.5, 0.95, 1.4].map((x, i) => (
        <PhoneStand key={x} position={[x, 0.86, 1.4]} hue={i % 3 === 0 ? P.teal : i % 3 === 1 ? P.leaf : P.screen} />
      ))}
      {/* a couple of herb pots — nod to the health/herbal product */}
      <Plant position={[-1.6, 0.86, 1.4]} scale={0.5} />
      <Plant position={[1.7, 0.86, 1.4]} scale={0.5} />

      {/* standing dev desks */}
      <StandingDesk position={[-0.9, 0, -0.4]} rotation={[0, 0.2, 0]} />
      <StandingDesk position={[0.7, 0, -0.4]} rotation={[0, -0.2, 0]} />

      {/* big product dashboard on the wall */}
      <WallScreen position={[0, 1.55, -1.4]} size={[2.4, 1.3]} />
    </group>
  )
}

// --- ZONE 4: Server & Tech --------------------------------------------------
function ServerRack({ position = [0, 0, 0], active }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.7, 1.7, 0.6]} radius={0.06} smoothness={4} position={[0, 0.85, 0]} castShadow receiveShadow>
        <Matte color={P.chair} />
      </RoundedBox>
      {[0.5, 0.8, 1.1, 1.4].map((y, i) => (
        <mesh key={i} position={[0.18, y, 0.31]}>
          <boxGeometry args={[0.24, 0.05, 0.02]} />
          <meshStandardMaterial
            color={P.teal}
            emissive={P.teal}
            emissiveIntensity={active ? 2.2 : 0.6 + (i % 2) * 0.6}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

function ServerZone({ active }) {
  return (
    <group name="zone-server" position={[11, 0, -6]} rotation={[0, -Math.PI / 4, 0]}>
      <ServerRack position={[-0.5, 0, 0]} active={active} />
      <ServerRack position={[0.35, 0, 0]} active={active} />
      <ServerRack position={[1.2, 0, 0]} active={active} />
    </group>
  )
}

// --- floating architectural platform ---------------------------------------
function Platform() {
  return (
    <group>
      <RoundedBox args={[90, 0.5, 70]} radius={0.15} smoothness={4} position={[0, -0.25, 0]} receiveShadow castShadow>
        <Matte color={P.platform} />
      </RoundedBox>
      {/* floor surface — light concrete so it reads as a floor, not blank white */}
      <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[89, 69]} />
        <Matte color={P.concrete} />
      </mesh>
      <Grid
        position={[0, 0.001, 0]}
        args={[89, 69]}
        cellSize={1.5}
        cellThickness={0.5}
        cellColor="#c9ddd3"
        sectionSize={1.5}
        sectionThickness={0.5}
        sectionColor="#c9ddd3"
        fadeDistance={400}
        fadeStrength={0}
        followCamera={false}
        infiniteGrid={false}
      />
    </group>
  )
}

// --- interior walls + glass partitions --------------------------------------
function Partitions() {
  return (
    <group>
      {/* central corridor divider (solid low walls) */}
      <SolidWall position={[0, 0.45, 2.6]} size={[0.12, 0.9, 4]} />
      {/* glass wall enclosing meeting room (front + side) */}
      <GlassWall position={[-3.4, 0, -0.4]} size={[4.4, 1.9, 0.06]} />
      <GlassWall position={[-1.2, 0, -2.4]} size={[4, 1.9, 0.06]} rotation={[0, Math.PI / 2, 0]} />
      {/* glass partition fronting the lab */}
      <GlassWall position={[3.4, 0, -0.4]} size={[5, 1.9, 0.06]} />
      {/* low divider between lab and server corner */}
      <SolidWall position={[2, 0.35, -2.6]} size={[0.12, 0.7, 3.4]} color={P.concrete} />
    </group>
  )
}

// --- draggable mascot (drop-bounce) + server popup --------------------------
function Character({ onNearChange }) {
  const group = useRef()
  const { camera, gl, raycaster, mouse } = useThree()
  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState(() => new THREE.Vector3(0, 0, 3.6))
  const bounce = useRef(0)
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), [])
  const hit = useMemo(() => new THREE.Vector3(), [])
  const near = useRef(false)

  const setPointer = (e) => {
    const r = gl.domElement.getBoundingClientRect()
    mouse.x = ((e.clientX - r.left) / r.width) * 2 - 1
    mouse.y = -((e.clientY - r.top) / r.height) * 2 + 1
  }
  const onDown = (e) => {
    e.stopPropagation()
    setDragging(true)
    gl.domElement.setPointerCapture?.(e.pointerId)
  }
  const onMove = (e) => {
    if (!dragging) return
    setPointer(e)
    raycaster.setFromCamera(mouse, camera)
    if (raycaster.ray.intersectPlane(plane, hit)) {
      hit.x = THREE.MathUtils.clamp(hit.x, -6, 6)
      hit.z = THREE.MathUtils.clamp(hit.z, -4, 4)
      setPos((p) => p.clone().set(hit.x, 0, hit.z))
    }
  }
  const onUp = (e) => {
    if (!dragging) return
    setDragging(false)
    bounce.current = 1
    gl.domElement.releasePointerCapture?.(e.pointerId)
  }

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const k = Math.min(1, dt * 14)
    g.position.x += (pos.x - g.position.x) * k
    g.position.z += (pos.z - g.position.z) * k
    let squash = 1
    if (dragging) {
      g.position.y += (0.35 - g.position.y) * k
    } else {
      g.position.y += (0 - g.position.y) * k
      if (bounce.current > 0.001) {
        bounce.current *= Math.pow(0.001, dt)
        squash = 1 + Math.sin(bounce.current * 18) * bounce.current * 0.35
      }
    }
    g.scale.set(2 - squash, squash, 2 - squash)
    const d = Math.hypot(g.position.x - SERVER_POS[0], g.position.z - SERVER_POS[2])
    const isNear = d < NEAR_DIST
    if (isNear !== near.current) {
      near.current = isNear
      onNearChange(isNear)
    }
  })

  return (
    <group
      ref={group}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerOver={() => (gl.domElement.style.cursor = 'grab')}
      onPointerOut={() => (gl.domElement.style.cursor = 'auto')}
    >
      <mesh position={[0, 0.4, 0]} castShadow>
        <cylinderGeometry args={[0.32, 0.36, 0.8, 48]} />
        <Matte color={P.body} />
      </mesh>
      {[-0.15, 0.15].map((x) => (
        <mesh key={x} position={[x, 0.05, 0.12]} castShadow>
          <sphereGeometry args={[0.11, 24, 24]} />
          <Matte color={P.bodyDark} />
        </mesh>
      ))}
      <mesh position={[0, 1.0, 0]} castShadow>
        <sphereGeometry args={[0.34, 48, 48]} />
        <Matte color={P.head} />
      </mesh>
      {[-0.2, 0.2].map((x) => (
        <mesh key={x} position={[x, 0.97, 0.26]}>
          <circleGeometry args={[0.06, 20]} />
          <meshStandardMaterial color="#ff9d9d" transparent opacity={0.6} />
        </mesh>
      ))}
      {[-0.12, 0.12].map((x) => (
        <mesh key={x} position={[x, 1.04, 0.31]}>
          <sphereGeometry args={[0.05, 20, 20]} />
          <meshStandardMaterial color="#2b2b2b" roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}

// --- Lounge / reception + edge greenery (fills the wider platform) ----------
function Sofa({ position = [0, 0, 0], rotation = [0, 0, 0], color = P.tealSoft }) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[1.5, 0.3, 0.6]} radius={0.1} smoothness={4} position={[0, 0.28, 0]} castShadow receiveShadow>
        <Matte color={color} />
      </RoundedBox>
      <RoundedBox args={[1.5, 0.4, 0.18]} radius={0.09} smoothness={4} position={[0, 0.5, -0.24]} castShadow>
        <Matte color={color} />
      </RoundedBox>
      {[-0.66, 0.66].map((x) => (
        <RoundedBox key={x} args={[0.18, 0.34, 0.6]} radius={0.08} smoothness={4} position={[x, 0.44, 0]} castShadow>
          <Matte color={color} />
        </RoundedBox>
      ))}
    </group>
  )
}

function LoungeZone() {
  return (
    <group name="zone-lounge" position={[0, 0, 4.4]}>
      {/* rug */}
      <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.8, 1.8]} />
        <meshStandardMaterial color={P.tealSoft} roughness={1} />
      </mesh>
      <Sofa position={[0, 0, -0.55]} />
      <Sofa position={[-1.4, 0, 0.3]} rotation={[0, Math.PI / 2, 0]} color={P.wood} />
      {/* round coffee table */}
      <mesh position={[0, 0.24, 0.3]} castShadow>
        <cylinderGeometry args={[0.34, 0.34, 0.08, 28]} />
        <Matte color={P.woodDark} />
      </mesh>
      <mesh position={[0, 0.12, 0.3]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.24, 12]} />
        <Steel color="#9aa1aa" />
      </mesh>
      <Plant position={[1.2, 0, -0.4]} scale={1.2} />
    </group>
  )
}

function EdgeGreenery() {
  const spots = [
    [-20, 0, -13], [20, 0, -13], [-20, 0, 13], [20, 0, 13],
    [-20, 0, 0], [20, 0, 0], [0, 0, -14], [0, 0, 14],
    [-11, 0, -14], [11, 0, -14], [-11, 0, 14], [11, 0, 14],
    [-20, 0, -7], [20, 0, -7], [-20, 0, 7], [20, 0, 7],
  ]
  return (
    <group name="greenery">
      {spots.map((p, i) => (
        <Plant key={i} position={p} scale={i % 2 ? 2.4 : 1.9} />
      ))}
    </group>
  )
}

function ZonePopup({ zone }) {
  return (
    <Html position={[zone.position[0], 2.2, zone.position[2]]} center distanceFactor={9}>
      <div
        style={{
          width: 210,
          padding: '11px 13px',
          borderRadius: 14,
          background: 'rgba(20,24,30,0.92)',
          color: '#fff',
          font: '500 12px/1.5 system-ui, sans-serif',
          boxShadow: '0 12px 34px rgba(0,0,0,0.28)',
          pointerEvents: 'none',
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 3, color: P.teal }}>{zone.label}</div>
        {zone.info}
      </div>
    </Html>
  )
}

// --- dense open-plan layout (no dividing walls) -----------------------------
function OpenOffice() {
  // Desk-pod clusters laid out in rows across the floor.
  const podRows = []
  for (let cx = -9; cx <= 9; cx += 6) {
    for (let cz = -5.5; cz <= 5.5; cz += 3.4) {
      podRows.push([cx, 0, cz])
    }
  }
  // Round breakout tables in the open gaps.
  const tables = [
    [-6, 0, 0], [0, 0, -1], [6, 0, 1.2], [3, 0, 5.5], [-3, 0, -5.5], [0, 0, 4.5],
  ]
  const shelves = [
    { p: [-12.5, 0, -3], r: Math.PI / 2 },
    { p: [-12.5, 0, 3], r: Math.PI / 2 },
    { p: [12.5, 0, -3], r: -Math.PI / 2 },
    { p: [12.5, 0, 3], r: -Math.PI / 2 },
    { p: [-4, 0, -8], r: 0 },
    { p: [4, 0, -8], r: 0 },
  ]
  const plants = [
    [-10, 0, -6], [10, 0, -6], [-10, 0, 6], [10, 0, 6], [-6.5, 0, 3.4], [6.5, 0, -3.4],
    [1.5, 0, 2], [-1.5, 0, -2], [8, 0, 4], [-8, 0, -4],
  ]

  return (
    <group name="open-office">
      {podRows.map((p, i) => (
        <DeskPod key={i} position={p} rotation={[0, i % 2 ? Math.PI / 2 : 0, 0]} />
      ))}
      {tables.map((p, i) => (
        <RoundTableSet key={i} position={p} chairs={i % 2 ? 4 : 3} color={i % 3 === 0 ? P.tealSoft : P.wood} />
      ))}
      {shelves.map((s, i) => (
        <Bookshelf key={i} position={s.p} rotation={[0, s.r, 0]} />
      ))}
      {plants.map((p, i) => (
        <Plant key={i} position={p} scale={i % 2 ? 1.15 : 0.9} />
      ))}

      {/* lounge cluster */}
      <group position={[7, 0, 5.5]}>
        <Sofa position={[0, 0, -0.6]} />
        <Sofa position={[-1.3, 0, 0.3]} rotation={[0, Math.PI / 2, 0]} color={P.tealSoft} />
        <RoundTableSet position={[0.2, 0, 0.4]} chairs={0} color={P.woodDark} />
      </group>

      {/* product / QA phone-testing bench */}
      <group position={[-8.5, 0, 6]}>
        <RoundedBox args={[3, 0.08, 0.6]} radius={0.03} smoothness={3} position={[0, 0.82, 0]} castShadow receiveShadow>
          <Matte color={P.white} />
        </RoundedBox>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[2.9, 0.8, 0.5]} />
          <Matte color={P.concrete} />
        </mesh>
        {[-1.1, -0.7, -0.3, 0.1, 0.5, 0.9, 1.3].map((x, i) => (
          <PhoneStand key={x} position={[x, 0.86, 0]} hue={i % 3 === 0 ? P.teal : i % 3 === 1 ? P.leaf : P.screen} />
        ))}
      </group>

      {/* dashboards on free-standing panels */}
      <WallScreen position={[-2, 1.3, -8]} size={[2, 1.1]} />
      <WallScreen position={[10.5, 1.3, 0]} rotation={[0, -Math.PI / 2, 0]} size={[2, 1.1]} />
    </group>
  )
}

// How far the view may pan from centre before it's clamped (keeps the office
// on-screen so you can't drag off into empty floor).
const PAN_X = 7
const PAN_Z = 4

function OfficeScene() {
  const controls = useRef()
  const clampPan = () => {
    const c = controls.current
    if (!c) return
    const t = c.target
    const nx = THREE.MathUtils.clamp(t.x, -PAN_X, PAN_X)
    const nz = THREE.MathUtils.clamp(t.z, -PAN_Z, PAN_Z)
    const dx = nx - t.x
    const dz = nz - t.z
    if (dx || dz) {
      t.x = nx
      t.z = nz
      c.object.position.x += dx // move camera by the same delta to keep the angle
      c.object.position.z += dz
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', background: '#f4f8f5' }}>
      <Canvas
        shadows
        orthographic
        dpr={[1, 2]}
        camera={{ position: [14, 13, 14], zoom: 54, near: 0.1, far: 200 }}
        gl={{ antialias: true, toneMappingExposure: 0.58 }}
      >
        <color attach="background" args={['#f4f8f5']} />
        <SoftShadows size={30} samples={16} focus={0.75} />

        <ambientLight intensity={0.24} />
        <hemisphereLight args={['#f2fbf6', '#d5e2da', 0.22]} />
        <directionalLight
          position={[9, 14, 7]}
          intensity={0.58}
          color="#fbfaf3"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-camera-left={-24}
          shadow-camera-right={24}
          shadow-camera-top={24}
          shadow-camera-bottom={-24}
        />
        <directionalLight position={[-8, 6, -6]} intensity={0.22} color="#bcd4ff" />
        <Environment preset="apartment" environmentIntensity={0.16} />

        <group position={[0, 0.25, 0]}>
          <Platform />
          {/* dense open-plan interior — no dividing walls */}
          <group scale={1.5}>
            <OpenOffice />
            <ServerZone active={false} />
          </group>
        </group>

        <ContactShadows position={[0, 0.005, 0]} opacity={0.4} scale={48} blur={2.8} far={8} />

        <OrbitControls
          ref={controls}
          onChange={clampPan}
          makeDefault
          enableRotate={false}
          enableZoom={false}
          enablePan
          screenSpacePanning={false}
          enableDamping
          dampingFactor={0.1}
          panSpeed={0.9}
          mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN }}
          touches={{ ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.PAN }}
          target={[0, 0.6, 0]}
        />

        <EffectComposer multisampling={0} enableNormalPass>
          <N8AO aoRadius={0.5} intensity={1.1} distanceFalloff={0.6} />
          <Bloom mipmapBlur intensity={0.28} luminanceThreshold={0.95} luminanceSmoothing={0.4} />
          <Vignette eskil={false} offset={0.3} darkness={0.45} />
          <SMAA />
        </EffectComposer>
      </Canvas>
    </div>
  )
}

// No props → render once; keeps the heavy 3D scene from re-reconciling every
// frame while the feed's scroll position updates (which was flickering the menu).
export default memo(OfficeScene)
