import React from 'react'
import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div style={{ position: 'fixed', inset: 0, backgroundColor: '#1C1410', zIndex: 0 }} />;
    }
    return this.props.children;
  }
}

export default function ShaderBackground({ theme = 'dark' }) {
  const light = theme === 'light'

  const palette = light
    ? { color1: '#FAF6F1', color2: '#E0A175', color3: '#F5EDE4', brightness: 1.0, envPreset: 'dawn', grain: 'off' }
    : { color1: '#1C1410', color2: '#8A5A3C', color3: '#1C1410', brightness: 1.2, envPreset: 'city', grain: 'off' }

  return (
    <ErrorBoundary>
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
          cameraZoom={1}
          color1={palette.color1}
          color2={palette.color2}
          color3={palette.color3}
          envPreset={palette.envPreset}
          grain={palette.grain}
          lightType="3d"
          positionX={0}
          positionY={0}
          positionZ={0}
          rotationX={0}
          rotationY={0}
          rotationZ={0}
          type="waterPlane"
          wireframe={false}
          cAzimuthAngle={180}
          cPolarAngle={90}
          cDistance={2.8}
        />
      </ShaderGradientCanvas>
    </ErrorBoundary>
  )
}
