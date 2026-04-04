"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { PencilCanvas } from "./PencilCanvas";
import { CursorDot } from "./CursorDot";
import { DockCursor } from "./DockCursor";
import { ArtistBioAccordion } from "./ArtistBioAccordion";

/*
 * InteractiveDesk-style layout: 1440×900 scene, scale to fill, top-left origin.
 * Scale = max(w/viewport, h/viewport); updates on resize. Overflow clipped.
 */
const CANVAS_WIDTH = 1440;
const CANVAS_HEIGHT = 900;
const W = CANVAS_WIDTH;
const H = CANVAS_HEIGHT;
/* Tab area moved up 126px from original: top 587 → 461 */
const TAB_AREA_TOP = 461;
const TAB_AREA_HEIGHT = H - TAB_AREA_TOP;
/* Content y positions (713,777,840) are from original design; offset by 587 so first row stays 126px below container top */
const TAB_CONTENT_ORIGIN_Y = 587;

/* Tab order front to back: 1=contact, 2=cv+press, 3=photos, 4=film, 5=selected works, 6=graphic design, 7=interactive */
/* Render back to front: 7,6,5,4,3,2,1 */
/* Tab SVGs +4px from original (w: 1448, h: 908/408), centered */
const TAB_SHAPES = [
  { svg: "/7.svg", x: -2, y: 713, w: 1448, h: 908 },  /* interactive + installation */
  { svg: "/6.svg", x: -2, y: 713, w: 1448, h: 908 },  /* graphic design */
  { svg: "/5.svg", x: -2, y: 777, w: 1448, h: 908 },  /* selected works */
  { svg: "/4.svg", x: -2, y: 777, w: 1448, h: 908 },  /* film */
  { svg: "/3.svg", x: -2, y: 777, w: 1448, h: 908 },  /* photos */
  { svg: "/2.svg", x: -2, y: 840, w: 1448, h: 408 },  /* cv + press */
  { svg: "/1.svg", x: -2, y: 840, w: 1448, h: 408 },  /* contact */
];

/* Tab text: X, Y (px), pinned to shape via svg so text moves with tab */
const TAB_TEXTS = [
  { label: "graphic design", svg: "/6.svg", x: 59, y: 752, color: "#1b141b" },
  { label: "interactive + installation", svg: "/7.svg", x: 763, y: 752, color: "#1b141b" },
  { label: "photos", svg: "/3.svg", x: 60, y: 814, color: "#1b141b" },
  { label: "film", svg: "/4.svg", x: 555, y: 814, color: "#1b141b" },
  { label: "selected works", svg: "/5.svg", x: 1000, y: 814, color: "#1b141b" },
  { label: "cv + press", svg: "/2.svg", x: 59, y: 877, color: "#f4efea" },
  { label: "contact", svg: "/1.svg", x: 764, y: 877, color: "#f4efea" },
];

const GD_HOVER_IMAGES = ["/GD_OFF_WHITE.png", "/GD_HAND.png"] as const;
const II_HOVER_IMAGES = ["/II_OFF_WHITE.png", "/II_HAND.png"] as const;
const PHOTOS_HOVER_IMAGES = ["/PHOTOS_OFF_WHITE.png", "/PHOTOS_HAND.png"] as const;
const FILM_HOVER_IMAGES = ["/FILM_OFF_WHITE.png", "/FILM_HAND.png"] as const;
const SW_HOVER_IMAGES = ["/SW_OFF_WHITE.png", "/SW_HAND.png"] as const;
const C_P_HOVER_IMAGES = ["/C_P_OFF_WHITE.png", "/C_P_HAND.png"] as const;
const CONTACT_HOVER_IMAGES = ["/CONTACT_OFF_WHITE.png", "/CONTACT_HAND.png"] as const;
const TAB_HOVER_INTERVAL_MS = 1500;

const DOCK_OVERLAP_PX = 2; /* dock extends 2px past viewport left and right */
const DOCK_EXTRA_SCALE_PX = 3.5; /* extra scale each side to cover white edge (2px + 1.5px for monitor) */
const DOCK_OFFSET_FROM_BOTTOM_PX = -135; /* dock raised 5px from -140 */
const SPACE_BELOW_CONTACT_BUTTON_PX = 20; /* 20px below contact/cv button row */
const TAB_DESIGN_WIDTH = 1448;

/* Polaroid ref: 499×555 at scale 0.684×0.8 ≈ 273px wide. Patches ~32%, stickers ~55% */
const POLAROID_REF_WIDTH = 273;
const PATCH_SIZE = Math.round(POLAROID_REF_WIDTH * 0.32 * 1.3 * 1.2); /* 30% + 20% larger than base */
const STICKER_SIZE = Math.round(POLAROID_REF_WIDTH * 0.55); /* larger end */
const PATCHES = [
  { id: "leo", src: "/leo-patch.png", width: 1196, height: 1895, rotation: -4, stackedRotation: -6 },
  { id: "toronto", src: "/toronto-patch-1.png", width: 2037, height: 2025, rotation: 3, stackedRotation: 5 },
  { id: "lagos", src: "/Lagos-enamel-pin.png", width: 2811, height: 911, rotation: -6, sizeScale: 1.3, stackedRotation: -4 },
] as const;

const PATCH_INITIAL_POSITIONS: Record<string, { x: number; y: number }> = {
  leo: { x: 1074, y: 61 },
  toronto: { x: 1271, y: 220 },
  lagos: { x: 1241, y: 122 },
};

const DRAG_CENTER = { x: 720, y: 450 }; /* center of 1440×900 canvas for intro animation */

const STICKERS = [
  { id: "stussy", src: "/stussy-sticker.png", width: 1821, height: 2268, rotation: -4, sizeScale: 1.15 },
  { id: "mamiwata2", src: "/mamiwata-sticker-mock-2.png", width: 3468, height: 2280, rotation: 5, sizeScale: 1.95 },
] as const;

const STICKER_INITIAL_POSITIONS: Record<string, { x: number; y: number }> = {
  stussy: { x: 680, y: 335 },
  mamiwata2: { x: 1090, y: 515 },
};

export function PortfolioPage() {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [viewport, setViewport] = useState({ w: CANVAS_WIDTH, h: CANVAS_HEIGHT });
  const [dockVisible, setDockVisible] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [gdImageIndex, setGdImageIndex] = useState(0);
  const [iiImageIndex, setIiImageIndex] = useState(0);
  const [photosImageIndex, setPhotosImageIndex] = useState(0);
  const [filmImageIndex, setFilmImageIndex] = useState(0);
  const [swImageIndex, setSwImageIndex] = useState(0);
  const [cpImageIndex, setCpImageIndex] = useState(0);
  const [contactImageIndex, setContactImageIndex] = useState(0);
  const [letterPos, setLetterPos] = useState({ x: 120, y: 80 });
  const [isDraggingLetter, setIsDraggingLetter] = useState(false);
  const [hoveredLetter, setHoveredLetter] = useState(false);
  const [patchPositions, setPatchPositions] = useState(PATCH_INITIAL_POSITIONS);
  const [draggingPatchId, setDraggingPatchId] = useState<string | null>(null);
  const [hoveredPatchId, setHoveredPatchId] = useState<string | null>(null);
  const [introComplete, setIntroComplete] = useState(false);
  const dragStartRef = useRef<{ clientX: number; clientY: number; x: number; y: number } | null>(null);
  const patchDragStartRef = useRef<{ clientX: number; clientY: number; x: number; y: number } | null>(null);
  const scaleRef = useRef(scale);
  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    const id = setTimeout(() => {
      const scaleX = window.innerWidth / CANVAS_WIDTH;
      const scaleY = window.innerHeight / CANVAS_HEIGHT;
      setScale(Math.max(scaleX, scaleY));
    }, 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  /* After images load, animate draggables from center to their positions */
  useEffect(() => {
    const id = setTimeout(() => setIntroComplete(true), 2500);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    const id = setTimeout(update, 0);
    window.addEventListener("resize", update);
    return () => {
      clearTimeout(id);
      window.removeEventListener("resize", update);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const inBottomHalf = e.clientY >= window.innerHeight / 2;
    setDockVisible(inBottomHalf);
  };

  /* When hovering a dock button, hide system cursor so the circular shadow is the cursor */
  const dockCursorActive = dockVisible && hoveredTab !== null;
  useEffect(() => {
    document.body.style.cursor = dockCursorActive ? "none" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [dockCursorActive]);

  /* Letter drag: document listeners so drag continues when cursor leaves the letter */
  useEffect(() => {
    if (!isDraggingLetter) return;
    const onMove = (e: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const dx = (e.clientX - start.clientX) / scaleRef.current;
      const dy = (e.clientY - start.clientY) / scaleRef.current;
      setLetterPos({ x: start.x + dx, y: start.y + dy });
    };
    const onUp = () => {
      setIsDraggingLetter(false);
      dragStartRef.current = null;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isDraggingLetter]);

  /* Patch drag: document listeners so drag continues when cursor leaves the patch */
  useEffect(() => {
    if (!draggingPatchId) return;
    const onMove = (e: MouseEvent) => {
      const start = patchDragStartRef.current;
      if (!start) return;
      const dx = (e.clientX - start.clientX) / scaleRef.current;
      const dy = (e.clientY - start.clientY) / scaleRef.current;
      setPatchPositions((prev) => ({
        ...prev,
        [draggingPatchId]: { x: start.x + dx, y: start.y + dy },
      }));
    };
    const onUp = () => {
      setDraggingPatchId(null);
      patchDragStartRef.current = null;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [draggingPatchId]);

  /* Scale dock uniformly to page width (overlap + extra 2px each side to cover white edge); height follows. */
  const dockScale = (viewport.w + DOCK_OVERLAP_PX * 2 + DOCK_EXTRA_SCALE_PX * 2) / TAB_DESIGN_WIDTH;
  const dockContentHeight = Math.ceil(TAB_AREA_HEIGHT * dockScale);
  const dockHeight = dockContentHeight + SPACE_BELOW_CONTACT_BUTTON_PX;

  useEffect(() => {
    if (hoveredTab !== "/6.svg") {
      const id = setTimeout(() => setGdImageIndex(0), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => {
      setGdImageIndex((i) => (i + 1) % GD_HOVER_IMAGES.length);
    }, TAB_HOVER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hoveredTab]);

  useEffect(() => {
    if (hoveredTab !== "/7.svg") {
      const id = setTimeout(() => setIiImageIndex(0), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => {
      setIiImageIndex((i) => (i + 1) % II_HOVER_IMAGES.length);
    }, TAB_HOVER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hoveredTab]);

  useEffect(() => {
    if (hoveredTab !== "/3.svg") {
      const id = setTimeout(() => setPhotosImageIndex(0), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => {
      setPhotosImageIndex((i) => (i + 1) % PHOTOS_HOVER_IMAGES.length);
    }, TAB_HOVER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hoveredTab]);

  useEffect(() => {
    if (hoveredTab !== "/4.svg") {
      const id = setTimeout(() => setFilmImageIndex(0), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => {
      setFilmImageIndex((i) => (i + 1) % FILM_HOVER_IMAGES.length);
    }, TAB_HOVER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hoveredTab]);

  useEffect(() => {
    if (hoveredTab !== "/5.svg") {
      const id = setTimeout(() => setSwImageIndex(0), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => {
      setSwImageIndex((i) => (i + 1) % SW_HOVER_IMAGES.length);
    }, TAB_HOVER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hoveredTab]);

  useEffect(() => {
    if (hoveredTab !== "/2.svg") {
      const id = setTimeout(() => setCpImageIndex(0), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => {
      setCpImageIndex((i) => (i + 1) % C_P_HOVER_IMAGES.length);
    }, TAB_HOVER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hoveredTab]);

  useEffect(() => {
    if (hoveredTab !== "/1.svg") {
      const id = setTimeout(() => setContactImageIndex(0), 0);
      return () => clearTimeout(id);
    }
    const id = setInterval(() => {
      setContactImageIndex((i) => (i + 1) % CONTACT_HOVER_IMAGES.length);
    }, TAB_HOVER_INTERVAL_MS);
    return () => clearInterval(id);
  }, [hoveredTab]);

  return (
    <>
      <div
        onMouseMove={handleMouseMove}
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          backgroundColor: "#eeece4",
        }}
      >
        <CursorDot />
        {/* Scene: absolute top-left, fixed 1440×900, scale from top-left; overflow visible so accordion fold shadow can show */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: CANVAS_WIDTH,
            height: CANVAS_HEIGHT,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            overflow: "visible",
            backgroundColor: "#eeece4",
          }}
        >
        {/* Symbol 068 behind logo, colored #F9D908, heat wave animation */}
        <div
          className="absolute"
          style={{
            left: `${((33 - 15) / W) * 100}%`,
            top: `${((1 + 25) / H) * 100}%`,
            width: `${(183 / W) * 100}%`,
            transform: "scale(0.674)",
            transformOrigin: "top left",
            zIndex: 0,
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "183 / 77",
              backgroundColor: "#F9D908",
              WebkitMaskImage: "url(/symbols/068.png)",
              maskImage: "url(/symbols/068.png)",
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              animation: "heatWave 3s ease-in-out infinite",
            }}
          />
        </div>

        {/* Logo: X=33 Y=1 (8px left of original 41), 183×77 */}
        <div
          className="absolute"
          style={{
            left: `${(33 / W) * 100}%`,
            top: `${(1 / H) * 100}%`,
            width: `${(183 / W) * 100}%`,
            transform: "scale(0.49)",
            transformOrigin: "top left",
            zIndex: 1,
          }}
        >
          <Link href="/">
            <Image src="/muna-muna-logo.png" alt="Muna" width={183} height={77} className="w-full h-auto" />
          </Link>
        </div>

        {/* Symbol 027 beside logo, colored #FF7BB5 (mask + background) */}
        <div
          className="absolute"
          style={{
            left: `${((33 + 183 * 0.49 + 8) / W) * 100}%`,
            top: `${((1 + 15) / H) * 100}%`,
            width: `${(50 / W) * 100}%`,
            aspectRatio: "1",
            backgroundColor: "#FF7BB5",
            WebkitMaskImage: "url(/symbols/027.png)",
            maskImage: "url(/symbols/027.png)",
            maskSize: "contain",
            maskRepeat: "no-repeat",
            maskPosition: "center",
            WebkitMaskSize: "contain",
            WebkitMaskRepeat: "no-repeat",
            WebkitMaskPosition: "center",
            zIndex: 1,
          }}
        />

        {/* Polaroid + tape grouped and scaled down 20% */}
        <div
          className="absolute"
          style={{
            left: 662,
            top: 95,
            transform: "scale(0.684)",
            transformOrigin: "top left",
            zIndex: 1,
          }}
        >
          {/* Polaroid: 80% size, 105.58°, drop shadow */}
          <div
            className="absolute"
            style={{
              left: 0,
              top: -60,
              width: 499,
              transform: "scale(0.684) rotate(12.5deg)",
              transformOrigin: "center center",
              boxShadow: "3px -1px 8px 0 rgba(0,0,0,0.32)",
            }}
          >
            <Image src="/muna-polaroid.png" alt="Muna" width={499} height={555} className="w-full h-auto" />
          </div>
          {/* Tape: 80% size, 13.40° */}
          <div
            className="absolute"
            style={{
              left: 162,
              top: 0,
              width: 312,
              transform: "scale(0.85) rotate(13.40deg)",
              transformOrigin: "center center",
            }}
          >
            <Image src="/textured-white-tape.png" alt="" width={312} height={151} className="w-full h-auto" />
          </div>
        </div>

        {/* "Hi! Welcome to my Portfolio!" – 60% size, 3 lines, faux bold */}
        <div
          className="absolute font-handwritten"
          style={{
            left: 963,
            top: 292,
            color: "#1b141b",
            fontSize: "86.7px",
            lineHeight: 1.2,
            transform: "scale(0.6)",
            transformOrigin: "top left",
            display: "flex",
            flexDirection: "column",
            flexWrap: "nowrap",
            gap: 0,
            alignItems: "flex-start",
            textShadow: "0.5px 0 0 #1b141b, -0.5px 0 0 #1b141b, 0 0.5px 0 #1b141b, 0 -0.5px 0 #1b141b",
            zIndex: 1,
          }}
        >
          <span style={{ display: "block", whiteSpace: "nowrap" }}>Hi!</span>
          <span style={{ display: "block", whiteSpace: "nowrap" }}>Welcome to</span>
          <span style={{ display: "block", whiteSpace: "nowrap" }}>my Portfolio!</span>
        </div>

        </div>

        {/* Pencil canvas: full viewport, fixed so mouse coords match; above static content, below letter */}
        <PencilCanvas />

        {/* Letter: fixed in viewport coords so it stacks above pencil; position = letterPos * scale to match scene */}
        <div
          data-no-draw
          style={{
            position: "fixed",
            left: (introComplete ? letterPos.x : DRAG_CENTER.x) * scale,
            top: (introComplete ? letterPos.y : DRAG_CENTER.y) * scale,
            transform: introComplete ? "translate(0, 0)" : "translate(-50%, -50%)",
            cursor: introComplete ? (isDraggingLetter ? "grabbing" : "grab") : "default",
            zIndex: 150,
            transition: isDraggingLetter ? "none" : "left 0.7s ease-out, top 0.7s ease-out, transform 0.7s ease-out",
          }}
          onMouseDown={(e) => {
            if (!introComplete || e.button !== 0) return;
            setIsDraggingLetter(true);
            dragStartRef.current = {
              clientX: e.clientX,
              clientY: e.clientY,
              x: letterPos.x,
              y: letterPos.y,
            };
          }}
          onMouseEnter={() => introComplete && setHoveredLetter(true)}
          onMouseLeave={() => setHoveredLetter(false)}
        >
          <div
            style={{
              transform: `scale(${scale}) rotate(${introComplete ? -3 : -4}deg) translateZ(0)`,
              transformOrigin: introComplete ? "top left" : "center center",
              willChange: "transform",
              transition: "transform 0.7s ease-out",
            }}
          >
            <div
              style={{
                animation: hoveredLetter && !isDraggingLetter ? "wiggle 0.5s ease-in-out 1" : "none",
              }}
            >
              <ArtistBioAccordion />
            </div>
          </div>
        </div>

        {/* Stickers */}
        {STICKERS.map((sticker) => {
          const pos = STICKER_INITIAL_POSITIONS[sticker.id];
          if (!pos) return null;
          return (
            <div
              key={sticker.id}
              data-no-draw
              style={{
                position: "fixed",
                left: pos.x * scale,
                top: pos.y * scale,
                width: "sizeScale" in sticker ? Math.round(STICKER_SIZE * sticker.sizeScale) : STICKER_SIZE,
                transform: `scale(${scale}) rotate(${sticker.rotation}deg) translateZ(0)`,
                transformOrigin: "top left",
                zIndex: 125,
              }}
            >
              <Image src={sticker.src} alt="" width={sticker.width} height={sticker.height} className="w-full h-auto object-contain" />
            </div>
          );
        })}

        {/* Draggable patches: top-right, smaller than polaroid */}
        {PATCHES.map((patch) => {
          const pos = patchPositions[patch.id];
          if (!pos) return null;
          const displayPos = introComplete ? pos : DRAG_CENTER;
          const hasShadow = patch.id === "leo" || patch.id === "toronto";
          const isHovered = hoveredPatchId === patch.id;
          const isDragging = draggingPatchId === patch.id;
          return (
            <div
              key={patch.id}
              data-no-draw
              style={{
                position: "fixed",
                left: displayPos.x * scale,
                top: displayPos.y * scale,
                transform: introComplete ? "translate(0, 0)" : "translate(-50%, -50%)",
                transition: isDragging ? "none" : "left 0.7s ease-out, top 0.7s ease-out, transform 0.7s ease-out",
                width: "sizeScale" in patch ? Math.round(PATCH_SIZE * patch.sizeScale) : PATCH_SIZE,
                cursor: introComplete ? (isDragging ? "grabbing" : "grab") : "default",
                zIndex: 155,
                ...(hasShadow && { filter: "drop-shadow(2px -1px 1.5px rgba(0,0,0,0.5))" }),
              }}
              onMouseDown={(e) => {
                if (!introComplete || e.button !== 0) return;
                setDraggingPatchId(patch.id);
                patchDragStartRef.current = {
                  clientX: e.clientX,
                  clientY: e.clientY,
                  x: pos.x,
                  y: pos.y,
                };
              }}
              onMouseEnter={() => introComplete && setHoveredPatchId(patch.id)}
              onMouseLeave={() => setHoveredPatchId(null)}
            >
              <div
                style={{
                  transform: `scale(${scale}) rotate(${introComplete ? patch.rotation : ("stackedRotation" in patch ? patch.stackedRotation : 0)}deg) translateZ(0)`,
                  transformOrigin: introComplete ? "top left" : "center center",
                  transition: "transform 0.7s ease-out",
                }}
              >
                <div
                  style={{
                    animation: isHovered && !isDragging ? "wiggle 0.5s ease-in-out 1" : "none",
                  }}
                >
                  <Image src={patch.src} alt="" width={patch.width} height={patch.height} className="w-full h-auto" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Floating dock: rendered in portal after mount to avoid hydration mismatch (server has no document.body) */}
        {mounted &&
          createPortal(
            <>
            <div
              data-no-draw
              style={{
                position: "fixed",
                bottom: DOCK_OFFSET_FROM_BOTTOM_PX,
                left: -(DOCK_OVERLAP_PX + DOCK_EXTRA_SCALE_PX),
                width: `calc(100vw + ${(DOCK_OVERLAP_PX + DOCK_EXTRA_SCALE_PX) * 2}px)`,
                height: dockHeight,
                overflow: "hidden",
                pointerEvents: dockVisible ? "auto" : "none",
                opacity: dockVisible ? 1 : 0,
                transform: dockVisible ? "translateY(0)" : "translateY(100%)",
                transition: "opacity 0.25s ease, transform 0.25s ease",
                zIndex: 100,
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "center",
              }}
            >
          <div
            style={{
              height: dockContentHeight,
              width: "100%",
              overflow: "hidden",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: TAB_DESIGN_WIDTH,
                height: TAB_AREA_HEIGHT,
                flexShrink: 0,
                transform: `scale(${dockScale})`,
                transformOrigin: "bottom center",
              }}
            >
            {TAB_SHAPES.map((tab, i) => {
              const labelsForShape = TAB_TEXTS.filter((t) => t.svg === tab.svg);
              const isHovered = hoveredTab === tab.svg;
              return (
                <div
                  key={tab.svg}
                  className="absolute"
                  style={{
                    left: 0,
                    top: `${((tab.y - TAB_CONTENT_ORIGIN_Y) / TAB_AREA_HEIGHT) * 100}%`,
                    width: "100%",
                    height: `${(tab.h / TAB_AREA_HEIGHT) * 100}%`,
                    zIndex: i + 1,
                    transform: isHovered ? "translateY(-20px)" : undefined,
                    filter: isHovered ? "drop-shadow(0 8px 20px rgba(0,0,0,0.32))" : "none",
                    transition: "transform 0.2s ease, filter 0.2s ease",
                  }}
                  onMouseEnter={() => setHoveredTab(tab.svg)}
                  onMouseLeave={() => setHoveredTab(null)}
                >
                  <Image
                    src={tab.svg}
                    alt=""
                    width={1444}
                    height={908}
                    className="w-full h-full object-cover object-top"
                  />
                  {labelsForShape.map((t) => {
                    const isGraphicDesignHovered = t.label === "graphic design" && isHovered;
                    const isInteractiveInstallationHovered = t.label === "interactive + installation" && isHovered;
                    const isPhotosHovered = t.label === "photos" && isHovered;
                    const isFilmHovered = t.label === "film" && isHovered;
                    const isSelectedWorksHovered = t.label === "selected works" && isHovered;
                    const isCvPressHovered = t.label === "cv + press" && isHovered;
                    const isContactHovered = t.label === "contact" && isHovered;
                    const showHoverImage = isGraphicDesignHovered || isInteractiveInstallationHovered || isPhotosHovered || isFilmHovered || isSelectedWorksHovered || isCvPressHovered || isContactHovered;
                    return (
                      <div
                        key={t.label}
                        className="absolute text-left"
                        style={{
                          left: `${((t.x + 2) / 1448) * 100}%`,
                          top: `${((t.y - tab.y) / tab.h) * 100}%`,
                          transform: "translateY(-50%)",
                          fontSize: showHoverImage ? 0 : "39.8px",
                          fontFamily: '"Arial MT Std", Arial, Helvetica, sans-serif',
                          letterSpacing: "-0.04em",
                          color: t.color,
                          zIndex: 20,
                        }}
                      >
                        {isGraphicDesignHovered ? (
                          <img src={GD_HOVER_IMAGES[gdImageIndex]} alt="graphic design" width={220} height={52} className="h-[52px] w-auto object-contain" style={{ display: "block" }} />
                        ) : isInteractiveInstallationHovered ? (
                          <img src={II_HOVER_IMAGES[iiImageIndex]} alt="interactive + installation" width={380} height={52} className="h-[52px] w-auto object-contain" style={{ display: "block" }} />
                        ) : isPhotosHovered ? (
                          <img src={PHOTOS_HOVER_IMAGES[photosImageIndex]} alt="photos" width={220} height={52} className="h-[52px] w-auto object-contain" style={{ display: "block" }} />
                        ) : isFilmHovered ? (
                          <img src={FILM_HOVER_IMAGES[filmImageIndex]} alt="film" width={220} height={52} className="h-[52px] w-auto object-contain" style={{ display: "block" }} />
                        ) : isSelectedWorksHovered ? (
                          <img src={SW_HOVER_IMAGES[swImageIndex]} alt="selected works" width={280} height={52} className="h-[52px] w-auto object-contain" style={{ display: "block" }} />
                        ) : isCvPressHovered ? (
                          <img src={C_P_HOVER_IMAGES[cpImageIndex]} alt="cv + press" width={240} height={52} className="h-[52px] w-auto object-contain" style={{ display: "block" }} />
                        ) : isContactHovered ? (
                          <img src={CONTACT_HOVER_IMAGES[contactImageIndex]} alt="contact" width={220} height={52} className="h-[52px] w-auto object-contain" style={{ display: "block" }} />
                        ) : (
                          t.label
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
            {TAB_TEXTS.map((t) => (
              <button
                key={t.label}
                type="button"
                aria-label={t.label}
                className="absolute"
                style={{
                  left: `${((t.x + 2) / 1448) * 100}%`,
                  top: `${((t.y - TAB_CONTENT_ORIGIN_Y) / TAB_AREA_HEIGHT) * 100}%`,
                  transform: "translate(-50%, -50%)",
                  width: "12%",
                  minWidth: 100,
                  height: "18%",
                  minHeight: 32,
                  zIndex: 50,
                  cursor: "pointer",
                  padding: 0,
                  margin: 0,
                  border: "none",
                  background: "transparent",
                  font: "inherit",
                }}
                onMouseEnter={() => setHoveredTab(t.svg)}
                onMouseLeave={() => setHoveredTab(null)}
                onClick={() => {}}
              />
            ))}
            </div>
          </div>
        </div>
            <DockCursor visible={dockCursorActive} />
            </>,
            document.body
          )}
      </div>
    </>
  );
}
