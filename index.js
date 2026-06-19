(function(){
  "use strict";

  /* ---------------- nav active link + scroll ---------------- */
  var navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
  var sections = document.querySelectorAll('section, .hero');
  function onScroll(){
    var pos = window.scrollY + window.innerHeight * 0.35;
    var current = '';
    sections.forEach(function(s){
      if(pos >= s.offsetTop) current = s.id;
    });
    navLinks.forEach(function(a){
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------- mobile menu ---------------- */
  var burger = document.getElementById('burgerBtn');
  var menu = document.getElementById('mobileMenu');
  if(burger){
    burger.addEventListener('click', function(){ menu.classList.toggle('open'); });
    menu.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){ menu.classList.remove('open'); });
    });
  }

  /* ---------------- scroll reveal ---------------- */
  var revealEls = document.querySelectorAll('.reveal');
  if('IntersectionObserver' in window){
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('is-visible'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function(el){ io.observe(el); });
  } else {
    revealEls.forEach(function(el){ el.classList.add('is-visible'); });
  }

  /* ---------------- 3D tilt for cards ---------------- */
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion){
    document.querySelectorAll('[data-tilt]').forEach(function(card){
      var rect;
      function onMove(e){
        rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rx = (py - 0.5) * -10;
        var ry = (px - 0.5) * 10;
        card.style.transform = 'perspective(700px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateY(-4px)';
      }
      function onLeave(){
        card.style.transform = 'perspective(700px) rotateX(0) rotateY(0) translateY(0)';
      }
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }

  /* ---------------- contact form (mailto fallback) ---------------- */
  var form = document.getElementById('contactForm');
  if(form){
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var name = document.getElementById('cf-name').value;
      var email = document.getElementById('cf-email').value;
      var msg = document.getElementById('cf-msg').value;
      var subject = encodeURIComponent('Portfolio contact from ' + name);
      var body = encodeURIComponent(msg + '\n\n— ' + name + ' (' + email + ')');
      window.location.href = 'mailto:yuinakada180@gmail.com?subject=' + subject + '&body=' + body;
    });
  }

  /* ================= 3D HERO: Quantum Bloom ================= */
  var canvas = document.getElementById('hero-canvas');
  var heroEl = document.getElementById('home');
  if(!canvas || typeof THREE === 'undefined') return;

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 7.2);

  var ambient = new THREE.AmbientLight(0xfff3f7, 0.9);
  scene.add(ambient);
  var lightPink = new THREE.PointLight(0xff8fae, 2.2, 20);
  lightPink.position.set(4, 3, 4);
  scene.add(lightPink);
  var lightLav = new THREE.PointLight(0x9580ff, 1.8, 20);
  lightLav.position.set(-4, -2, 3);
  scene.add(lightLav);

  var bloom = new THREE.Group();
  scene.add(bloom);

  // core
  var coreGeo = new THREE.IcosahedronGeometry(0.95, 1);
  var coreMat = new THREE.MeshPhongMaterial({ color: 0xff8fae, shininess: 90, specular: 0xffffff, flatShading: true });
  var core = new THREE.Mesh(coreGeo, coreMat);
  bloom.add(core);

  // petals (flattened spheres arranged like a flower)
  var petalColors = [0xffb6c8, 0xb8a8ff, 0x7dd8c6, 0xffd66b, 0xff8fae, 0x9580ff];
  var petalCount = 6;
  var petals = [];
  for(var i=0;i<petalCount;i++){
    var pg = new THREE.SphereGeometry(0.62, 16, 16);
    pg.scale(1, 0.42, 0.65);
    var pm = new THREE.MeshPhongMaterial({ color: petalColors[i % petalColors.length], shininess: 60, transparent:true, opacity:0.92 });
    var petal = new THREE.Mesh(pg, pm);
    var angle = (i / petalCount) * Math.PI * 2;
    petal.userData = { angle: angle, radius: 2.05, speed: 0.18 + (i%3)*0.03, yOff: i*0.6 };
    bloom.add(petal);
    petals.push(petal);
  }

  // orbit rings + electrons
  var electrons = [];
  var ringCount = 3;
  for(var r=0; r<ringCount; r++){
    var ringGeo = new THREE.TorusGeometry(2.6 + r*0.45, 0.012, 8, 64);
    var ringMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent:true, opacity:0.35 });
    var ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI/2 + (r*0.5);
    ring.rotation.y = r * 0.7;
    bloom.add(ring);

    var eGeo = new THREE.SphereGeometry(0.07, 12, 12);
    var eMat = new THREE.MeshBasicMaterial({ color: petalColors[(r*2)%petalColors.length] });
    var electron = new THREE.Mesh(eGeo, eMat);
    electron.userData = { ring: ring, radius: 2.6 + r*0.45, speed: 0.5 + r*0.25, offset: r*2 };
    bloom.add(electron);
    electrons.push(electron);
  }

  // ambient particles
  var starCount = 220;
  var starGeo = new THREE.BufferGeometry();
  var starPos = new Float32Array(starCount*3);
  for(var s=0; s<starCount; s++){
    var radius = 4 + Math.random()*5;
    var theta = Math.random()*Math.PI*2;
    var phi = Math.acos((Math.random()*2)-1);
    starPos[s*3] = radius * Math.sin(phi) * Math.cos(theta);
    starPos[s*3+1] = radius * Math.sin(phi) * Math.sin(theta);
    starPos[s*3+2] = radius * Math.cos(phi);
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  var starMat = new THREE.PointsMaterial({ color: 0xffd6e3, size: 0.045, transparent:true, opacity:0.7, sizeAttenuation:true });
  var stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  function resize(){
    var w = heroEl.clientWidth, h = heroEl.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w/h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  /* drag-to-rotate */
  var dragging = false;
  var lastX = 0, lastY = 0;
  var targetRotX = 0, targetRotY = 0;
  var currentRotX = 0, currentRotY = 0;
  var autoRotate = true;
  var mouseNX = 0, mouseNY = 0;

  function pointerDown(x, y){ dragging = true; autoRotate = false; lastX = x; lastY = y; }
  function pointerMove(x, y){
    if(!dragging){
      var rect = canvas.getBoundingClientRect();
      mouseNX = ((x - rect.left) / rect.width) - 0.5;
      mouseNY = ((y - rect.top) / rect.height) - 0.5;
      return;
    }
    var dx = x - lastX, dy = y - lastY;
    targetRotY += dx * 0.006;
    targetRotX += dy * 0.006;
    targetRotX = Math.max(-0.9, Math.min(0.9, targetRotX));
    lastX = x; lastY = y;
  }
  function pointerUp(){ dragging = false; }

  canvas.addEventListener('mousedown', function(e){ pointerDown(e.clientX, e.clientY); });
  window.addEventListener('mousemove', function(e){ pointerMove(e.clientX, e.clientY); });
  window.addEventListener('mouseup', pointerUp);
  canvas.addEventListener('touchstart', function(e){ var t=e.touches[0]; pointerDown(t.clientX, t.clientY); }, { passive:true });
  canvas.addEventListener('touchmove', function(e){ var t=e.touches[0]; pointerMove(t.clientX, t.clientY); }, { passive:true });
  canvas.addEventListener('touchend', pointerUp);

  var clock = new THREE.Clock();

  function animate(){
    requestAnimationFrame(animate);
    var t = clock.getElapsedTime();

    if(autoRotate && !dragging){ targetRotY += 0.0022; }

    currentRotX += (targetRotX - currentRotX) * 0.08;
    currentRotY += (targetRotY - currentRotY) * 0.08;

    var parallaxX = reduceMotion ? 0 : mouseNY * 0.25;
    var parallaxY = reduceMotion ? 0 : mouseNX * 0.25;

    bloom.rotation.x = currentRotX + parallaxX;
    bloom.rotation.y = currentRotY + parallaxY;

    core.rotation.y = t * 0.15;
    core.scale.setScalar(1 + Math.sin(t*1.2)*0.03);

    petals.forEach(function(p){
      var d = p.userData;
      var a = d.angle + t * d.speed;
      p.position.set(Math.cos(a)*d.radius, Math.sin(t*0.6 + d.yOff)*0.35, Math.sin(a)*d.radius);
      p.rotation.y = a;
      p.rotation.z = t*0.3 + d.yOff;
    });

    electrons.forEach(function(e){
      var d = e.userData;
      var a = t * d.speed + d.offset;
      var ringRotX = d.ring.rotation.x, ringRotY = d.ring.rotation.y;
      var x = Math.cos(a) * d.radius;
      var y = Math.sin(a) * d.radius;
      // rotate point by ring's rotation so electron travels along the ring
      var pos = new THREE.Vector3(x, y, 0);
      pos.applyEuler(new THREE.Euler(ringRotX, ringRotY, 0));
      e.position.copy(pos);
    });

    stars.rotation.y = t * 0.01;

    renderer.render(scene, camera);
  }
  animate();
})();