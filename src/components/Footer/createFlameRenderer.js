import { fragmentShader, vertexShader } from './flameShader';

function getRenderScale(width, height) {
  const lowPower = navigator.hardwareConcurrency <= 4
    || navigator.deviceMemory <= 4
    || navigator.connection?.saveData;
  const pixelBudget = lowPower ? 900_000 : 1_800_000;
  const pixelRatioLimit = lowPower ? 1 : 1.5;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, pixelRatioLimit);
  const budgetScale = Math.sqrt(pixelBudget / Math.max(1, width * height));
  return Math.min(pixelRatio, budgetScale);
}

export function createFlameRenderer(gl, canvas) {
  const shaders = [];
  let program;
  let resolutionUniform;
  let timeUniform;

  function compileShader(type, source) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error('Unable to allocate a footer shader.');
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(shader) || 'Footer shader compilation failed.');
    }

    return shader;
  }

  function dispose() {
    if (program) gl.deleteProgram(program);
    shaders.forEach((shader) => gl.deleteShader(shader));
  }

  try {
    const vertex = compileShader(gl.VERTEX_SHADER, vertexShader);
    const fragment = compileShader(gl.FRAGMENT_SHADER, fragmentShader);
    program = gl.createProgram();
    if (!program) throw new Error('Unable to allocate the footer program.');
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'Footer shader linking failed.');
    }

    gl.useProgram(program);
    resolutionUniform = gl.getUniformLocation(program, 'uResolution');
    timeUniform = gl.getUniformLocation(program, 'uTime');
  } catch (error) {
    dispose();
    throw error;
  }

  function resize(width, height) {
    const scale = getRenderScale(width, height);
    const bufferWidth = Math.max(2, Math.floor(width * scale));
    const bufferHeight = Math.max(2, Math.floor(height * scale));
    if (canvas.width === bufferWidth && canvas.height === bufferHeight) return false;

    canvas.width = bufferWidth;
    canvas.height = bufferHeight;
    gl.viewport(0, 0, bufferWidth, bufferHeight);
    return true;
  }

  function draw(time) {
    gl.uniform2f(resolutionUniform, canvas.width, canvas.height);
    gl.uniform1f(timeUniform, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  return { resize, draw, dispose };
}
