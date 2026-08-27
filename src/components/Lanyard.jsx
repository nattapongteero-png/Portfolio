/* eslint-disable react/no-unknown-property */
// -----------------------------------------------------------------------------
// Lanyard.jsx
// React Bits' Lanyard — an ID card hanging from a strap, simulated with rapier
// and dragged with the pointer. Used as the hero section's portrait: the page
// is an introduction, and a staff pass says that faster than a photograph.
//
// Changes from upstream, all forced by where it runs:
//   * `paused` — the hero shares the page with Pawmely's own WebGL canvas and a
//     Flutter iframe. A physics world stepping 60 times a second while the
//     section is off screen is pure cost, so the canvas stops rendering and the
//     solver stops stepping once you scroll away.
//   * The wrapper fills its parent instead of 100vh (see Lanyard.css).
//   * `@react-three/rapier` is pinned to the v1 line: v2 requires R3F v9 and
//     this project runs v8 for the phone model.
// -----------------------------------------------------------------------------
'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, useTexture, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

import cardGLB from '../assets/lanyard/card.glb';
import lanyard from '../assets/lanyard/lanyard.png';

import * as THREE from 'three';
import useViewportSize from '../hooks/useViewportSize';
import { REVEAL_BEATS } from '../lib/reveal';
import './Lanyard.css';

extend({ MeshLineGeometry, MeshLineMaterial });

// A strap with real thickness. meshline draws a flat ribbon that turns to face
// the camera, which is why the strap read as a sticker: no side, no edge, and
// nothing for the light to catch when the card turned. This walks the same curve
// and extrudes a RECTANGULAR cross-section along it — a wide face, a thin one,
// and two edges — so the strap is a solid the renderer can shade and occlude.
//
// The frame is built from a fixed up-vector rather than from Frenet frames: a
// strap hanging nearly straight down is exactly the case where Frenet normals
// flip about, and the strap would twist on its own between frames.
function makeStrapGeometry(segments) {
  const geometry = new THREE.BufferGeometry();
  const rings = segments + 1;
  const position = new Float32Array(rings * 4 * 3);
  const normal = new Float32Array(rings * 4 * 3);
  const uv = new Float32Array(rings * 4 * 2);
  // Four corners per ring, so four running faces: wide front, edge, wide back,
  // edge. The wide faces take the whole texture; the edges take a sliver of it.
  const CORNER_V = [0, 1, 1, 0];
  const index = [];
  for (let i = 0; i < segments; i++) {
    const a = i * 4;
    const b = (i + 1) * 4;
    for (let c = 0; c < 4; c++) {
      const d = (c + 1) % 4;
      index.push(a + c, b + c, b + d, a + c, b + d, a + d);
    }
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(normal, 3));
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geometry.setIndex(index);

  const P = new THREE.Vector3();
  const T = new THREE.Vector3();
  const side = new THREE.Vector3();
  const face = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 0, 1);
  const ALT = new THREE.Vector3(0, 1, 0);
  const corner = new THREE.Vector3();
  const n = new THREE.Vector3();

  const update = (curve, width, thickness) => {
    const hw = width / 2;
    const ht = thickness / 2;
    for (let i = 0; i < rings; i++) {
      const t = i / segments;
      curve.getPoint(t, P);
      curve.getTangent(t, T).normalize();
      // The wide face is held toward the viewer: the side axis is whatever runs
      // across the strap in the screen plane. When the strap points at the
      // camera that cross product collapses, so a second axis stands in.
      side.crossVectors(T, UP);
      if (side.lengthSq() < 1e-6) side.crossVectors(T, ALT);
      side.normalize();
      face.crossVectors(side, T).normalize();
      for (let c = 0; c < 4; c++) {
        const sx = c === 0 || c === 3 ? -1 : 1;
        const fx = c < 2 ? 1 : -1;
        corner.copy(P).addScaledVector(side, sx * hw).addScaledVector(face, fx * ht);
        n.copy(face).multiplyScalar(fx).addScaledVector(side, sx * 0.25).normalize();
        const o = (i * 4 + c) * 3;
        position[o] = corner.x;
        position[o + 1] = corner.y;
        position[o + 2] = corner.z;
        normal[o] = n.x;
        normal[o + 1] = n.y;
        normal[o + 2] = n.z;
        const uo = (i * 4 + c) * 2;
        uv[uo] = t * STRAP_REPEAT;
        uv[uo + 1] = CORNER_V[c];
      }
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    geometry.attributes.uv.needsUpdate = true;
    geometry.computeBoundingSphere();
  };

  return { geometry, update };
}

// The strap in WORLD units now, not meshline's screen-space line width. Width is
// about a fifth of the card (the card is 1.6 across), and the thickness is what
// the edge shows when it turns.
const STRAP_WIDTH = 0.22;
const STRAP_THICKNESS = 0.028;
// The strap art tiles four times down its length, the way meshline's
// `repeat={[-4, 1]}` used to tile it. Baked into the UVs rather than set on the
// texture, because that texture object is shared with anything else drawing it.
const STRAP_REPEAT = 4;

// 1x1 transparent pixel — lets useTexture be called unconditionally when a
// front/back image isn't supplied.
const BLANK_PIXEL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// The card model's front face is UV-mapped to the LEFT half of the texture
// atlas and the back face to the RIGHT half (measured from card.glb). Each
// custom image is composited into its own half so the two faces render
// independently, aspect-preserving (no stretching).
// The strap's thickness is `lineWidth` divided by `resolution` and multiplied by
// the canvas width, so a FIXED resolution makes the strap's pixel width track the
// canvas width — while the card's size tracks the canvas HEIGHT (vertical fov).
// The two then drift apart on every reshape, which is what read as the strap
// stretching. Feeding resolution as `[width * REF/height, REF]` cancels the width
// term, leaving the strap proportional to height, exactly like the card. REF is
// the desktop height the current look was tuned at, so nothing changes there.
const STRAP_REF_H = 900;

// The pass is the cord on a blind: you pull it DOWN and the thing opens. And it is
// pulled the way a cord actually is — twice. Each tug is timed to a beat of the
// page transition, so the card and the screen move together instead of taking
// turns: a short tug with the first beat, a longer haul with the second.
//
// A single impulse was not a pull at all — it was a flick, over inside two frames.
// Each tug is a force applied every frame for its whole window.
// Tuned against the render, not by feel. At 40 / 85 the first tug threw the card
// clean off the bottom of the scene inside 70ms — the whole card left the screen
// before the first beat of the transition had opened. These land it about 60px
// down on the first tug and about 180 on the second.
const TUGS = [
  { at: 0, ms: 170, force: 6 },
  { at: REVEAL_BEATS.secondAt, ms: 300, force: 16 },
];
// What the card does when it is LET GO on the other side — the recoil that carries
// it back up the strap as the next page arrives.
// Gentle. At 16 the card was FIRED back up the strap and whipped about for a
// second afterwards, which reads as a snapped elastic rather than as a hand
// letting go.
const REBOUND_IMPULSE = 3;
// Sideways and a touch of spin, so the release reads as a hand letting go rather
// than as a spring firing straight up the strap.
const REBOUND_SWING = 1.1;
const REBOUND_SPIN = 0.35;

const FRONT_UV_RECT = { x: 0, y: 0, w: 0.5, h: 0.755 };
const BACK_UV_RECT = { x: 0.5, y: 0, w: 0.5, h: 0.757 };

export default function Lanyard({
  position = [0, 0, 30],
  gravity = [0, -40, 0],
  fov = 20,
  transparent = true,
  frontImage = null,
  frontLinks = null,
  backImage = null,
  backLinks = null,
  onFlip = null,
  flipTo = null,
  // Whether a tap HAULS the pass down before it turns. That pull was written for
  // a tap that changed page — it carried the eye out of the screen. When the
  // answer happens on this same screen the haul is drama with nowhere to go, and
  // the turn is the whole gesture.
  tug = true,
  // Swing the card open a little way ONCE, shortly after it arrives, and let the
  // face spring pull it back. Nothing on the front says the pass has a back; the
  // card telling you with its own movement — like a real pass caught by a
  // draught — is the hint that costs no ink and no extra furniture.
  tease = false,
  reboundKey = 0,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1,
  paused = false
}) {
  // Through the app's shared, rAF-coalesced viewport hook instead of an own
  // `resize` listener, so a drag resize does not re-render the physics tree once
  // per compositor frame.
  const isMobile = useViewportSize().width < 768;

  return (
    <div className="lanyard-wrapper">
      <Canvas
        camera={{ position: position, fov: fov }}
        dpr={[1, isMobile ? 1.5 : 2]}
        gl={{ alpha: transparent }}
        // No tone mapping. R3F's default is ACES filmic, a film curve that pulls
        // pure white down to about 0.8 — on a card whose face IS white paper that
        // curve is applied to the whole badge, and #ffffff was measured leaving
        // the renderer at 232. There is no highlight here to roll off, so the
        // curve was only costing the card its paper.
        flat
        // Stops rendering entirely while parked. `never` would also freeze the
        // very first frame, so the card is drawn once on demand instead.
        frameloop={paused ? 'never' : 'always'}
        onCreated={({ gl }) => gl.setClearColor(new THREE.Color(0x000000), transparent ? 0 : 1)}
      >
        {/* Ambient is the FLOOR, not the light. It used to carry the whole card at
            1.1, which lights every square of the face by the same amount — a flat
            fill has no direction in it, so the badge read as a printed rectangle
            pasted on the page rather than a card hanging in a room. Dropped to a
            fill that only keeps the shaded side off black, with the directional
            below doing the actual lighting. */}
        <ambientLight intensity={0.42} />
        {/* One key light, above and to the left, matching where the page's own
            type is heaviest. This is what puts a gradient across the face and
            makes the clip and the strap read as solid. */}
        <directionalLight position={[-3, 4, 5]} intensity={0.72} />
        <Physics gravity={gravity} timeStep={isMobile ? 1 / 30 : 1 / 60} paused={paused}>
          <Band
            isMobile={isMobile}
            frontImage={frontImage}
            frontLinks={frontLinks}
            backImage={backImage}
            backLinks={backLinks}
            onFlip={onFlip}
            flipTo={flipTo}
            tug={tug}
            tease={tease}
            reboundKey={reboundKey}
            imageFit={imageFit}
            lanyardImage={lanyardImage}
            lanyardWidth={lanyardWidth}
          />
        </Physics>
        <Environment blur={0.75}>
          <Lightformer
            intensity={2}
            color="white"
            position={[0, -1, 5]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[-1, -1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={3}
            color="white"
            position={[1, 1, 1]}
            rotation={[0, 0, Math.PI / 3]}
            scale={[100, 0.1, 1]}
          />
          <Lightformer
            intensity={10}
            color="white"
            position={[-10, 0, 14]}
            rotation={[0, Math.PI / 2, Math.PI / 3]}
            scale={[100, 10, 1]}
          />
        </Environment>
      </Canvas>
    </div>
  );
}
function Band({
  maxSpeed = 50,
  minSpeed = 0,
  isMobile = false,
  frontLinks = null,
  frontImage = null,
  backImage = null,
  backLinks = null,
  onFlip = null,
  flipTo = null,
  tug = true,
  tease = false,
  reboundKey = 0,
  imageFit = 'cover',
  lanyardImage = null,
  lanyardWidth = 1
}) {
  const band = useRef(),
    fixed = useRef(),
    j1 = useRef(),
    j2 = useRef(),
    j3 = useRef(),
    card = useRef();
  // Which face is toward you. A tap toggles it; the frame loop below aims the
  // card's spin at whichever face this names, so the flip happens THROUGH the
  // physics rather than against it.
  const [flipped, setFlipped] = useState(false);
  // The tug windows currently in flight; see useFrame.
  const tugs = useRef([]);

  // Let go from outside. The card that ARRIVES springs back up the strap, whether
  // it is the contact page's card arriving after the pull or the home screen's card
  // arriving after the pull back — the two trips are the same move, so both ends
  // of it get the same release.
  const firstRebound = useRef(true);
  useEffect(() => {
    if (firstRebound.current) {
      firstRebound.current = false;
      return;
    }
    // Off-centre, and with a little spin. Straight up the strap the card went up
    // and came down the same line — a bounce, not a release. The contact page's
    // card reads better because it is ALSO given a turn as it arrives, so it
    // swings; this gives the home screen's card the same.
    card.current?.applyImpulse({ x: REBOUND_SWING, y: REBOUND_IMPULSE, z: 0 }, true);
    card.current?.applyTorqueImpulse({ x: 0, y: 0, z: -REBOUND_SPIN }, true);
  }, [reboundKey]);

  // Turned from outside — closing the contact page turns the pass back to its
  // front, so the page and the card can never disagree about which face is up.
  // The same nudge a tap gives it, so it starts the turn instead of easing out of
  // stillness.
  // The hover tilt is DISARMED by a flip and re-armed only when the pointer
  // leaves the card. The pointer is still sitting on the card when it is tapped,
  // so `flipped` changes while the card is physically mid-air — and the hold,
  // engaging on that stale hover, grabbed the card mid-turn: measured once as a
  // stutter-then-crawl, and once (with a time window instead of this) as the
  // card settling on the wrong face entirely, because the hold's target exists
  // on both sides of the midpoint and momentum handed it the front one. Armed
  // only from a fresh entry, the hold always starts from a card at rest on the
  // face the hover found it on.
  const hoverArmed = useRef(true);
  // The flip itself, for the no-tug card: a constant angular velocity, the same
  // number in both directions, held until the card is nearly at the target face
  // — then the face spring catches it. Torque impulses could not be made
  // symmetric: the same kick that landed cleanly on the back (where the
  // quaternion flattens and soaks up the arrival) blew straight through the
  // front, and every per-direction patch just moved the mismatch around.
  // +1 turns to the back, -1 to the front, 0 is not in transit.
  const transit = useRef(0);
  const transitUntil = useRef(0);
  useEffect(() => {
    if (flipTo == null || flipTo === flipped) return;
    hoverArmed.current = false;
    if (!tug) {
      transit.current = flipTo ? 1 : -1;
      // A hard stop in case the capture threshold is never read (a dropped
      // frame at the boundary) — the spring owns it after this regardless.
      transitUntil.current = performance.now() + 900;
      card.current?.wakeUp();
    }
    setFlipped(flipTo);
    // Stronger than the tap's own nudge. This turn happens while the card is
    // still swinging from the tug that opened the page, and at 0.6 it did not
    // always carry past the midpoint — the spring then settled it back to the face
    // it started on, so the contact page arrived showing the front.
    // Without the tug there is no swing to carry past, and 1.1 spun the card
    // several times over for a move that is only ever half a turn.
    // 0.35 left the card near-still for half a second before the spring
    // gathered it up — measured, the turn only reached edge-on at 800ms. 0.8
    // starts the turn on the tap itself; the far face is a rest point of the
    // same spring, so the extra carry is absorbed there, not spun through.
    if (tug) {
      card.current?.applyTorqueImpulse({ x: 0, y: flipTo ? 1.1 : -1.1, z: 0 }, true);
      // Released: the strap that was just pulled down carries the card back up
      // as this page arrives, so the two pages are one continuous movement.
      card.current?.applyImpulse({ x: 0, y: REBOUND_IMPULSE, z: 0 }, true);
    }
  }, [flipTo, flipped, tug]);

  // The tease: one part-turn, then the face spring (see useFrame) hauls it back.
  // Late enough that the card has landed from its own entrance and the page has
  // gone quiet — movement on a screen that is still moving says nothing. Torque
  // only, no target change: `flipped` stays false, so the spring treats the swing
  // as a disturbance and settles it back to the front on its own.
  // Driven through the SAME spring target the hover uses, not an impulse of its
  // own: an impulse hands the card momentum and the spring then overshoots with
  // it, so even a small kick turned further than the hover pose. Holding the
  // hover's exact bias for a moment IS the hover, played once by itself — the
  // card shows precisely the pose the pointer will get.
  const teaseBias = useRef(0);
  const teased = useRef(false);
  useEffect(() => {
    if (!tease || teased.current) return undefined;
    const on = window.setTimeout(() => {
      teased.current = true;
      card.current?.wakeUp();
      teaseBias.current = 0.2;
    }, 1200);
    const off = window.setTimeout(() => {
      teaseBias.current = 0;
    }, 2400);
    return () => {
      window.clearTimeout(on);
      window.clearTimeout(off);
    };
  }, [tease]);

  // A press on the card is either a drag or a tap, and both begin the same way,
  // so the tap is decided on release: short, and the pointer barely moved.
  const press = useRef(null);
  const vec = new THREE.Vector3(),
    ang = new THREE.Vector3(),
    rot = new THREE.Vector3(),
    dir = new THREE.Vector3();
  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 };
  const { nodes, materials } = useGLTF(cardGLB);
  const texture = useTexture(lanyardImage || lanyard);
  // useTexture must be called unconditionally; use a blank pixel when an image
  // isn't supplied for a given face, then skip compositing it below.
  const frontTex = useTexture(frontImage || BLANK_PIXEL);
  const backTex = useTexture(backImage || BLANK_PIXEL);

  // Composite the front/back images into the card's texture atlas (front = left
  // half, back = right half). Each image is drawn aspect-preserving (no stretch).
  // Also returns WHERE the front image landed in the atlas, in atlas pixels. The
  // card has to answer taps on marks drawn inside that image, and the only place
  // that knows how the image was fitted is the code that fitted it.
  const { cardMap, frontPlacement, backPlacement } = useMemo(() => {
    const baseMap = materials.base.map;
    if (!frontImage && !backImage) return { cardMap: baseMap, frontPlacement: null, backPlacement: null };

    const baseImg = baseMap.image;
    const W = baseImg.width;
    const H = baseImg.height;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    if (!ctx) return { cardMap: baseMap, frontPlacement: null, backPlacement: null };
    // Keep the original baked atlas for the card edges and any untouched face.
    ctx.drawImage(baseImg, 0, 0, W, H);

    let placement = null;
    const drawFitted = (img, rect) => {
      const rx = rect.x * W;
      const ry = rect.y * H;
      const rw = rect.w * W;
      const rh = rect.h * H;
      const pick = imageFit === 'contain' ? Math.min : Math.max;
      const scale = pick(rw / img.width, rh / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;
      const dx = rx + (rw - dw) / 2;
      const dy = ry + (rh - dh) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(rx, ry, rw, rh);
      ctx.clip();
      // Clear the face first. The atlas is drawn in whole underneath, so a
      // `contain` fit left the baked artwork showing in the margins around the
      // supplied image — two pictures on one face.
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(rx, ry, rw, rh);
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
      // Where the picture itself went, not where its slot is: at `cover` the
      // picture is larger than the slot and centred, so a fraction of the picture
      // maps to an atlas pixel only through these numbers.
      placement = { dx, dy, dw, dh, clip: { x: rx, y: ry, w: rw, h: rh }, W, H };
    };

    if (frontImage && frontTex.image) drawFitted(frontTex.image, FRONT_UV_RECT);
    const front = placement;
    placement = null;
    if (backImage && backTex.image) drawFitted(backTex.image, BACK_UV_RECT);
    const back = placement;

    const composite = new THREE.CanvasTexture(canvas);
    composite.colorSpace = THREE.SRGBColorSpace;
    composite.flipY = baseMap.flipY;
    composite.anisotropy = 16;
    composite.needsUpdate = true;
    return {
      cardMap: composite,
      frontPlacement: front && { ...front, flipY: composite.flipY },
      backPlacement: back && { ...back, flipY: composite.flipY },
    };
  }, [frontImage, backImage, imageFit, frontTex, backTex, materials.base.map]);
  const [curve] = useState(
    () =>
      new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()])
  );
  // Built once and rewritten in place each frame — the curve moves every frame,
  // and allocating a geometry per frame for a physics rig is how you turn a
  // strap into a garbage-collection problem.
  const strap = useMemo(() => makeStrapGeometry(isMobile ? 16 : 32), [isMobile]);
  useEffect(() => () => strap.geometry.dispose(), [strap]);
  // Which link a point on the card's face falls on, if any. `uv` is the atlas
  // coordinate the raycaster hands back; the placement above turns that into a
  // fraction of the badge, which is the space the link rects were recorded in.
  const linkAt = (uv, showingBack) => {
    const placement = showingBack ? backPlacement : frontPlacement;
    const links = showingBack ? backLinks : frontLinks;
    if (!uv || !placement || !links?.length) return null;
    const { dx, dy, dw, dh, W, H, flipY } = placement;
    const ax = uv.x * W;
    // A texture with flipY reads its image bottom-up, so v runs opposite to the
    // canvas rows the badge was painted into.
    const ay = (flipY ? 1 - uv.y : uv.y) * H;
    const bx = (ax - dx) / dw;
    const by = (ay - dy) / dh;
    if (bx < 0 || bx > 1 || by < 0 || by > 1) return null;
    return links.find(l => bx >= l.x && bx <= l.x + l.w && by >= l.y && by <= l.y + l.h) ?? null;
  };

  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);
  // meshline converts `lineWidth` to screen space through `resolution`, so it
  // has to BE the canvas size. Upstream hardcodes [1000,1000] (and [1000,2000]
  // under 768px), which means the strap's thickness relative to the card drifted
  // with every viewport and jumped at the breakpoint — the strap looked stretched
  // or shrunk while the card stayed put.
  const size = useThree((state) => state.size);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, 1.5, 0]
  ]);

  useEffect(() => {
    if (!hovered) {
      // The pointer has left: the next hover is a fresh gesture, not the tail of
      // the tap that flipped the card. And the body is woken for the return —
      // the hold may have let it fall asleep at the tilt.
      hoverArmed.current = true;
      card.current?.wakeUp();
      return;
    }
    if (hovered) {
      // The body has usually gone to SLEEP by the time a pointer reaches it, and
      // the face spring writes its angvel without waking anything — measured, the
      // hover turn simply never happened after the card settled. One wake when
      // the hover starts and the spring takes it from there.
      card.current?.wakeUp();
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useFrame((state, rawDelta) => {
    // A resize (or a tab coming back) hands the first frame a huge delta. The
    // band lerp below multiplies delta by up to `maxSpeed`, so anything past
    // ~1/30s drives the factor over 1 and the strap overshoots — the whip/bounce
    // you see the moment the window changes size. Clamped, the worst case is one
    // slightly slow frame.
    const delta = Math.min(rawDelta, 1 / 30);

    // The tugs. While one is live the card is hauled down the strap every frame,
    // which is what makes it read as a cord being pulled rather than as a card
    // that twitched.
    if (tugs.current.length) {
      const now = performance.now();
      let live = false;
      tugs.current.forEach(t => {
        if (now >= t.s && now < t.e) {
          card.current?.applyImpulse({ x: 0, y: -t.f * delta, z: 0 }, true);
        }
        if (now < t.e) live = true;
      });
      if (!live) tugs.current = [];
    }
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach(ref => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }
    if (fixed.current) {
      [j1, j2].forEach(ref => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(
          ref.current.translation(),
          delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed))
        );
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      strap.update(curve, STRAP_WIDTH * lanyardWidth, STRAP_THICKNESS);
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      // `rot` copies rapier's QUATERNION, so rot.y is sin(theta/2): 0 with the
      // front toward you, 1 at a half turn. Both are rest points, which is what
      // lets the same one-line spring hold either face — it used to be written
      // against 0 only, so the card always swung back to the front.
      // The pointer resting on the card turns it a few degrees off its face —
      // held there for as long as the hover lasts, so the card visibly answers
      // the cursor and says its back exists. 0.2 in quaternion-y is about 23° —
      // 8° measured as a couple of px and read as nothing at all, and 15° still
      // had to be looked for; the key light is what makes the turn legible, and
      // it needs this much angle to move across the face.
      // Not while dragged (the drag owns the card). BOTH faces answer the
      // pointer — the back turns the same few degrees toward the front, saying
      // the card flips back the same way it flipped here. Only the tease is
      // front-only; it is an introduction, and the back needs none.
      // rot.y is sin(theta/2), which is NOT linear in the angle: 0.2 above the
      // front is 23°, but 0.2 short of the back is 74° — measured, the same bias
      // subtracted from 1 swung the back nearly half-open. 0.94 = sin(140°/2),
      // about 40° off the back — deeper than the front's 23°, because the back
      // is a flat white sheet with no portrait or edge detail to catch the key
      // light, and at 25° the turn measured clearly but read as nothing.
      const hoverBias = hovered && !dragged && hoverArmed.current;
      const faceY = flipped ? 1 : Math.max(hoverBias ? 0.2 : 0, !dragged ? teaseBias.current : 0);
      if (transit.current !== 0) {
        const dir = transit.current;
        // Nearly there: hand over to the spring, which owns the last few
        // degrees on either face. The thresholds LOOK asymmetric because the
        // quaternion is: y is sin(θ/2), compressed near the back — 0.86 was
        // 118°, a hand-over 62° early, and the spring (flat in exactly that
        // zone) crawled the rest, so the turn to the back dragged its tail
        // while the turn home snapped shut. 0.93 is the same few degrees short
        // of the back's measured rest (0.9399) that 0.22 is short of the
        // front's — now both faces are driven almost all the way in and land
        // with the same snap.
        const arrived = dir > 0 ? rot.y > 0.93 : rot.y < 0.22;
        if (arrived || performance.now() > transitUntil.current) {
          transit.current = 0;
          // The momentum dies WITH the drive. Handed over still carrying
          // 5.5 rad/s, the card sailed on past the face — soaked up slowly on
          // the back's flat zone, caught by the brake on the front — which is
          // why the two directions never matched: one coasted, one stopped.
          // Both stop dead now, and the spring only dresses the last degrees.
          card.current.setAngvel({ x: ang.x, y: ang.y * 0.1, z: ang.z }, true);
        } else {
          // The x/z bleed keeps the turn on its axis — the tap that started it
          // also set the card swinging, and a swing mid-turn reads as tumbling.
          card.current.setAngvel({ x: ang.x * 0.9, y: dir * 5.5, z: ang.z * 0.9 }, true);
          return;
        }
      }
      if (flipped && hoverBias) {
        // The face spring below ADDS to the velocity each frame — an undamped
        // integrator, which is what gives the free swings their life. It cannot
        // hold a pose near the back: at the tuned gain the turn crawled, and
        // raising the gain pumped energy until the card tumbled clean over to
        // the front — observed at both 0.55 and 1.2. A held pose wants a
        // first-order controller: velocity SET from the error, so it decays into
        // the target and cannot oscillate.
        // The target is EMPIRICAL, not sin(θ/2) of a chosen angle: hanging on
        // its rope the card's quaternion mixes in x/z, and its measured rest on
        // the back is y = 0.9399, not 1 — a target computed from pure-Y algebra
        // (0.94 for "40°") landed exactly on the rest pose and held the card
        // perfectly still.
        // wakeUp=true: the hold reaches its target, the velocities go to ~0 and
        // rapier puts the body to SLEEP mid-hover — after which neither this nor
        // the return spring (both write angvel without waking) moves it ever
        // again. Measured: a long hover left the card frozen at the tilt.
        card.current.setAngvel({ x: ang.x, y: (0.9 - rot.y) * 5, z: ang.z }, true);
      } else {
        let vy = ang.y - (rot.y - faceY) * 0.25;
        // The arrival brake, the SAME on both faces: any fast spin close to
        // the face it is meant to rest on is bled off instead of being allowed
        // to carry through it. Hover and tease velocities live far below the
        // gate and keep their feel.
        if (Math.abs(vy) > 0.8 && (flipped ? rot.y > 0.88 : Math.abs(rot.y) < 0.5)) vy *= 0.72;
        card.current.setAngvel({ x: ang.x, y: vy, z: ang.z });
      }
    }
  });

  curve.curveType = 'chordal';
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

  return (
    <>
      <group position={[0, 4, 0]}>
        {/* Everything starts AT REST: each segment at the point the rope holds it
            once gravity has had its way — straight down the anchor, with the card
            a joint's reach (1.5) below the last segment. They used to be laid out
            sideways and dropped, so every page opened with the pass swinging in;
            the page is not about the throw, and the card that is simply THERE
            reads as furniture rather than an event. The tease below is now the
            only movement the card makes on its own. */}
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0, -1, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0, -2, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0, -3, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[0, -4.5, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={e => {
              e.target.releasePointerCapture(e.pointerId);
              drag(false);
              const p = press.current;
              press.current = null;
              if (!p) return;
              const moved = Math.hypot(e.clientX - p.x, e.clientY - p.y);
              // 8px and 350ms: past either it was a drag of the card, and a drag
              // that ended in a flip would make the strap unusable.
              if (moved > 8 || performance.now() - p.t > 350) return;
              // A tap on a contact row goes where that row points instead of
              // turning the card. Only the face that is SHOWING is tested — the
              // ray hits the near side, and testing both would let the back's
              // links fire through the front.
              const link = linkAt(e.uv, flipped);
              if (link) {
                window.open(link.href, '_blank', 'noopener,noreferrer');
                return;
              }
              // Pulled DOWN first. A tap on the pass yanks it the way a blind is
              // pulled: the strap stretches, the card drops, and the page change
              // comes out of that movement instead of arriving on top of a card
              // that never moved. The page waits for it — see the delay on the
              // other end of `onFlip`.
              if (tug) {
                const t0 = performance.now();
                tugs.current = TUGS.map(t => ({ s: t0 + t.at, e: t0 + t.at + t.ms, f: t.force }));
              }
              // Reported up: the back of this pass is the contact face, so pulling
              // the card is how someone asks for contact — the page answers that,
              // not the card.
              //
              // When a page owns this card it is NOT turned here. The turn belongs
              // to the far side of the move: pulled and turned at the same instant,
              // the card went edge-on immediately and the haul — the whole point of
              // the gesture — could not be seen. The page sets `flipTo` on the card
              // that arrives, and this one just gets pulled.
              hoverArmed.current = false; // the tap's own hover must not become the hold
              if (onFlip) onFlip(!flipped);
              else setFlipped(f => !f);
              // A nudge in the direction it is about to travel, so the turn
              // starts on the tap instead of easing out of stillness.
              if (tug) card.current?.applyTorqueImpulse({ x: 0, y: flipped ? -0.6 : 0.6, z: 0 }, true);
            }}
            onPointerDown={e => {
              e.target.setPointerCapture(e.pointerId);
              press.current = { x: e.clientX, y: e.clientY, t: performance.now() };
              drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation())));
            }}
          >
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial
                map={cardMap}
                map-anisotropy={16}
                // No clearcoat. A clearcoat is a mirror coat, and with the whole
                // light rig standing in FRONT of the card, a face held flat to the
                // camera reflected that rig back as a white veil over the artwork
                // — pale at rest, normal the moment the card was dragged and the
                // reflection slid off. Measured on the back face: darkest 5% of
                // the artwork went 68 → 26 and its median 145 → 113 with this off.
                clearcoat={0}
                // Matte, but not dead matte. At 0.9 the surface returned the room
                // as an even wash, which is the other half of why the face read
                // flat — a card has a slight sheen and that sheen is what shows
                // the light has a direction.
                roughness={0.68}
                // A printed card, not a metal one. At 0.8 the face behaved like a
                // mirror: held flat toward the camera it caught the whole front
                // rig at once and washed the artwork out — the pale back everyone
                // reads as "the colour went grey", which came back the moment the
                // card was dragged and the highlight slid off. The clearcoat
                // still gives it the laminate sheen.
                //
                // Zero, not 0.15. A metal surface has no diffuse term at all, so
                // any metalness on a printed card takes that fraction straight out
                // of the paper and hands it to a reflection — the card's white was
                // being dimmed 15% before tone mapping ever touched it, which is
                // read as the face being dull rather than as it being metal.
                metalness={0}
                // The rig is four bright lightformers standing in front of the
                // card, and a face held flat toward the camera takes all of them
                // at once. Halving how much of that environment the surface
                // returns is what stops the darker artwork being lifted to pale
                // grey at rest; the clearcoat above still carries the sheen.
                envMapIntensity={0.45}
              />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      {/* Two-sided: the strap turns over on itself as the card swings, and a
          single-sided solid disappears wherever it does. */}
      <mesh ref={band} geometry={strap.geometry}>
        <meshStandardMaterial
          map={texture}
          side={THREE.DoubleSide}
          roughness={0.75}
          metalness={0}
        />
      </mesh>
    </>
  );
}
