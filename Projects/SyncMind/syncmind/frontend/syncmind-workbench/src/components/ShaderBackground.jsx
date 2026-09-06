// src/components/ShaderBackground.jsx
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

export default function ShaderBackground({ theme = 'dark' }) {
  const light = theme === 'light'

  // Option A "Warm Porcelain" - the light twin of the bronze dark mode.
  // Same structure (matching outer colours + one saturated glow core),
  // inverted in luminance. Brightness is pulled back because light base
  // colours clip to flat white above ~1.15.
  const palette = light
    ? { color1: '#FAF6F1', color2: '#E0A175', color3: '#F5EDE4', brightness: 1.0, envPreset: 'dawn', grain: 'off' }
    : { color1: '#1C1410', color2: '#8A5A3C', color3: '#1C1410', brightness: 1.2, envPreset: 'city', grain: 'on' }

  return (
    <ShaderGradientCanvas
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    >
      <ShaderGradient
        animate="on"
        axesHelper="off"
        brightness={palette.brightness}
        cAzimuthAngle={-719}
        cDistance={1.79}
        cPolarAngle={100}
        cameraZoom={1}
        color1={palette.color1}
        color2={palette.color2}
        color3={palette.color3}
        destination="onCanvas"
        embedMode="off"
        envPreset={palette.envPreset}
        format="gif"
        fov={45}
        frameRate={10}
        gizmoHelper="hide"
        grain={palette.grain}
        lightType="3d"
        pixelDensity={1}
        positionX={-2.8}
        positionY={0}
        positionZ={0}
        range="disabled"
        rangeEnd={15.4}
        rangeStart={7.2}
        reflection={0.1}
        rotationX={0}
        rotationY={10}
        rotationZ={50}
        shader="defaults"
        type="waterPlane"
        uAmplitude={7}
        uDensity={1.3}
        uFrequency={5.5}
        uSpeed={0.15}
        uStrength={3.5}
        uTime={7.2}
        wireframe={false}
        zoomOut={false}
      />
    </ShaderGradientCanvas>
  )
}