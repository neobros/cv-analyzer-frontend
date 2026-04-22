import React from "react";
import PropTypes from "prop-types";
import * as THREE from "three";
import s from "./DottedSurface.module.scss";

function DottedSurface({ className = "" }) {
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x08111f, 1800, 6200);

    const camera = new THREE.PerspectiveCamera(58, 1, 1, 10000);
    camera.position.set(0, 360, 1280);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const separation = 118;
    const amountX = window.innerWidth < 768 ? 28 : 42;
    const amountY = window.innerWidth < 768 ? 42 : 58;
    const particleCount = amountX * amountY;

    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    let pointerX = 0;
    let pointerY = 0;
    let animationFrame = null;

    for (let ix = 0; ix < amountX; ix += 1) {
      for (let iy = 0; iy < amountY; iy += 1) {
        const index = ix * amountY + iy;
        const offset = index * 3;

        positions[offset] = ix * separation - ((amountX * separation) / 2);
        positions[offset + 1] = 0;
        positions[offset + 2] = iy * separation - ((amountY * separation) / 2);

        const mix = iy / amountY;
        colors[offset] = 0.35 + (0.45 * mix);
        colors[offset + 1] = 0.66 + (0.2 * mix);
        colors[offset + 2] = 0.95;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 7,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    const points = new THREE.Points(geometry, material);
    points.rotation.x = -0.42;
    points.position.y = -120;
    scene.add(points);

    const resize = () => {
      const { clientWidth, clientHeight } = container;
      const width = Math.max(clientWidth, 1);
      const height = Math.max(clientHeight, 1);

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    const handlePointerMove = (event) => {
      const rect = container.getBoundingClientRect();
      pointerX = ((event.clientX - rect.left) / rect.width) - 0.5;
      pointerY = ((event.clientY - rect.top) / rect.height) - 0.5;
    };

    const handlePointerLeave = () => {
      pointerX = 0;
      pointerY = 0;
    };

    let count = 0;

    const animate = () => {
      animationFrame = window.requestAnimationFrame(animate);

      const positionAttribute = geometry.attributes.position;
      const positionArray = positionAttribute.array;
      let i = 0;

      for (let ix = 0; ix < amountX; ix += 1) {
        for (let iy = 0; iy < amountY; iy += 1) {
          const index = i * 3;
          positionArray[index + 1] =
            (Math.sin((ix + count) * 0.26) * 42) +
            (Math.sin((iy + count) * 0.38) * 32) +
            (pointerX * ix * 1.8) +
            (pointerY * iy * 1.2);
          i += 1;
        }
      }

      positionAttribute.needsUpdate = true;
      camera.position.x += ((pointerX * 130) - camera.position.x) * 0.035;
      camera.position.y += ((355 + (pointerY * -90)) - camera.position.y) * 0.04;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
      count += 0.082;
    };

    resize();
    container.addEventListener("pointermove", handlePointerMove);
    container.addEventListener("pointerleave", handlePointerLeave);
    window.addEventListener("resize", resize);
    animate();

    return () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      container.removeEventListener("pointermove", handlePointerMove);
      container.removeEventListener("pointerleave", handlePointerLeave);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className={`${s.surface} ${className}`.trim()} />;
}

DottedSurface.propTypes = {
  className: PropTypes.string
};

export default DottedSurface;
