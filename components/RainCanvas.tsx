import React, { useRef, useEffect, useState } from 'react';
import { RainParams } from '../types';
import { vertexShader, fragmentShader } from '../shaders/heartfelt';

interface RainCanvasProps {
  params: RainParams;
  mediaSource: HTMLVideoElement | HTMLImageElement | null;
  isVideo: boolean;
}

const RainCanvas: React.FC<RainCanvasProps> = ({ params, mediaSource, isVideo }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  
  // Initialize WebGL
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      console.error("WebGL2 not supported");
      return;
    }
    glRef.current = gl;

    // Create Shaders
    const createShader = (type: number, source: string) => {
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compile error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = createShader(gl.VERTEX_SHADER, vertexShader);
    const fs = createShader(gl.FRAGMENT_SHADER, fragmentShader);
    
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    
    programRef.current = program;

    // Setup Fullscreen Quad
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    
    const positionAttributeLocation = gl.getAttribLocation(program, "position");
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.vertexAttribPointer(positionAttributeLocation, 2, gl.FLOAT, false, 0, 0);

    // Create Texture Container
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    
    // Set parameters that allow rendering of any size image, but enable mipmaps for blur
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    
    // Initialize with a 1x1 black pixel to prevent incomplete texture warnings before load
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));

    textureRef.current = texture;

    // Cleanup
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteTexture(texture);
      gl.deleteVertexArray(vao);
    };
  }, []);

  // Render Loop
  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    
    if (!gl || !program) return;

    let startTime = performance.now();

    const render = (time: number) => {
      // Resize handling
      const canvas = canvasRef.current;
      if (canvas) {
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
          canvas.width = displayWidth;
          canvas.height = displayHeight;
          gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        }
      }

      gl.useProgram(program);

      // Uniforms
      const uTime = (time - startTime) * 0.001;
      
      const locTime = gl.getUniformLocation(program, "uTime");
      const locRes = gl.getUniformLocation(program, "uResolution");
      const locRain = gl.getUniformLocation(program, "uRainAmount");
      const locSpeed = gl.getUniformLocation(program, "uSpeed");
      const locBright = gl.getUniformLocation(program, "uBrightness");
      const locNorm = gl.getUniformLocation(program, "uNormalStrength");
      const locZoom = gl.getUniformLocation(program, "uZoom");
      const locHasTex = gl.getUniformLocation(program, "uHasTexture");
      const locTex = gl.getUniformLocation(program, "uTexture");

      gl.uniform1f(locTime, uTime);
      gl.uniform2f(locRes, gl.canvas.width, gl.canvas.height);
      gl.uniform1f(locRain, params.rainAmount);
      gl.uniform1f(locSpeed, params.speed);
      gl.uniform1f(locBright, params.brightness);
      gl.uniform1f(locNorm, params.refraction);
      gl.uniform1f(locZoom, params.zoom);
      
      // Texture Logic
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textureRef.current);

      if (mediaSource) {
         gl.uniform1i(locHasTex, 1);
         
         // Update texture data
         try {
             gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, mediaSource);
             // Always generate mipmaps for high quality blur in the shader
             gl.generateMipmap(gl.TEXTURE_2D);
         } catch (e) {
             // Suppress errors (e.g. video not ready)
         }
      } else {
         gl.uniform1i(locHasTex, 0);
      }
      gl.uniform1i(locTex, 0);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(requestRef.current);
    };
  }, [params, mediaSource, isVideo]);

  return (
    <canvas 
      ref={canvasRef} 
      className="absolute top-0 left-0 w-full h-full block z-0"
    />
  );
};

export default RainCanvas;