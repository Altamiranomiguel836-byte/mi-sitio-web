/* ——— Animated Shader Hero · WebGL2 ——— */
(function () {
  'use strict';

  var canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  var gl = canvas.getContext('webgl2');
  if (!gl) {
    /* Fallback: let the CSS gradient show */
    canvas.style.display = 'none';
    return;
  }

  var dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1) * 0.65, 1.4);
  var program = null;
  var buffer  = null;
  var uniforms = {};
  var startTime = null;
  var animId    = null;
  var resizeTimer;

  /* ——— Vertex Shader ——— */
  var VERT = [
    '#version 300 es',
    'precision highp float;',
    'in vec4 position;',
    'void main(){ gl_Position = position; }'
  ].join('\n');

  /* ——— Fragment Shader (nebula / cosmic cloud by Matthias Hurrle @atzedent) ——— */
  var FRAG = [
    '#version 300 es',
    'precision highp float;',
    'out vec4 O;',
    'uniform vec2  resolution;',
    'uniform float time;',
    '#define FC gl_FragCoord.xy',
    '#define T  time',
    '#define R  resolution',
    '#define MN min(R.x,R.y)',

    'float rnd(vec2 p){',
    '  p=fract(p*vec2(12.9898,78.233));',
    '  p+=dot(p,p+34.56);',
    '  return fract(p.x*p.y);',
    '}',

    'float noise(in vec2 p){',
    '  vec2 i=floor(p), f=fract(p), u=f*f*(3.-2.*f);',
    '  float a=rnd(i), b=rnd(i+vec2(1,0)),',
    '        c=rnd(i+vec2(0,1)), d=rnd(i+1.);',
    '  return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);',
    '}',

    'float fbm(vec2 p){',
    '  float t=.0, a=1.;',
    '  mat2 m=mat2(1.,-.5,.2,1.2);',
    '  for(int i=0;i<5;i++){t+=a*noise(p);p*=2.*m;a*=.5;}',
    '  return t;',
    '}',

    'float clouds(vec2 p){',
    '  float d=1., t=.0;',
    '  for(float i=.0;i<3.;i++){',
    '    float a=d*fbm(i*10.+p.x*.2+.2*(1.+i)*p.y+d+i*i+p);',
    '    t=mix(t,d,a); d=a; p*=2./(i+1.);',
    '  }',
    '  return t;',
    '}',

    'void main(void){',
    '  vec2 uv=(FC-.5*R)/MN, st=uv*vec2(2,1);',
    '  vec3 col=vec3(0);',
    '  float bg=clouds(vec2(st.x+T*.5,-st.y));',
    '  uv*=1.-.3*(sin(T*.2)*.5+.5);',
    '  for(float i=1.;i<12.;i++){',
    '    uv+=.1*cos(i*vec2(.1+.01*i,.8)+i*i+T*.5+.1*uv.x);',
    '    vec2 p=uv;',
    '    float d=length(p);',
    '    col+=.00125/d*(cos(sin(i)*vec3(1,2,3))+1.);',
    '    float b=noise(i+p+bg*1.731);',
    '    col+=.002*b/length(max(p,vec2(b*p.x*.02,p.y)));',
    '    col=mix(col,vec3(bg*.25,bg*.137,bg*.05),d);',
    '  }',
    '  O=vec4(col,1);',
    '}'
  ].join('\n');

  /* ——— Helpers ——— */
  function compileShader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('[shader]', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  }

  function setup() {
    var vert = compileShader(gl.VERTEX_SHADER,   VERT);
    var frag = compileShader(gl.FRAGMENT_SHADER, FRAG);
    if (!vert || !frag) return false;

    program = gl.createProgram();
    gl.attachShader(program, vert);
    gl.attachShader(program, frag);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('[program]', gl.getProgramInfoLog(program));
      return false;
    }

    var verts = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

    var posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    uniforms.resolution = gl.getUniformLocation(program, 'resolution');
    uniforms.time       = gl.getUniformLocation(program, 'time');

    return true;
  }

  function resize() {
    var w = canvas.offsetWidth  || window.innerWidth;
    var h = canvas.offsetHeight || window.innerHeight;
    canvas.width  = (w * dpr) | 0;
    canvas.height = (h * dpr) | 0;
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  function render(now) {
    if (!startTime) startTime = now;
    var t = (now - startTime) * 0.001;

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, t);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    animId = requestAnimationFrame(render);
  }

  /* ——— Pause when tab is hidden (battery/CPU savings) ——— */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      cancelAnimationFrame(animId);
      animId = null;
    } else if (program) {
      startTime = null; /* smooth resume */
      animId = requestAnimationFrame(render);
    }
  });

  /* ——— Init ——— */
  if (setup()) {
    resize();
    animId = requestAnimationFrame(render);
  }

  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 80);
  });
})();
