const WebGLRenderer = window.THREE.WebGLRenderer;
const Color = window.THREE.Color;
const TextureLoader = window.THREE.TextureLoader;
const PerspectiveCamera = window.THREE.PerspectiveCamera;
const ShaderMaterial = window.THREE.ShaderMaterial;
const MeshBasicMaterial = window.THREE.MeshBasicMaterial;
const Scene = window.THREE.Scene;
const SphereGeometry = window.THREE.SphereGeometry;
const Mesh = window.THREE.Mesh;
const BoxGeometry = window.THREE.BoxGeometry;
const Geometry = window.THREE.Geometry;
const Matrix4 = window.THREE.Matrix4;
const UniformsUtils = window.THREE.UniformsUtils;
const BackSide = window.THREE.BackSide;
const FaceColors = window.THREE.FaceColors;
const AdditiveBlending = window.THREE.AdditiveBlending;

window.Globe = function(container) {
    let colorFn = function(x) {
        let c = new Color();
        c.setHSL( ( 0.6 - ( x * 0.5 ) ), 1.0, 0.5 );
        return c;
    };

    let shader = {uniforms: {'texture': { type: 't', value: null }}, vertexShader: [
            'varying vec3 vNormal;',
            'varying vec2 vUv;',
            'void main() {',
            'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
            'vNormal = normalize( normalMatrix * normal );',
            'vUv = uv;',
            '}'
        ].join('\n'), fragmentShader: [
            'uniform sampler2D texture;',
            'varying vec3 vNormal;',
            'varying vec2 vUv;',
            'void main() {',
            'vec3 diffuse = texture2D( texture, vUv ).xyz;',
            'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
            'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
            'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
            '}'
        ].join('\n')};

    let camera, scene, renderer;
    let mesh, point;

    let overRenderer;

    let curZoomSpeed = 0;
    //let zoomSpeed = 50;

    let mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
    let rotation = { x: 0, y: 0 },
        target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
        targetOnDown = { x: 0, y: 0 };

    let distance = 100000, distanceTarget = 100000;
    //let padding = 40;
    let PI_HALF = Math.PI / 2;

    // peak 0.978 bottom 0 avg 0.019743517587936684 total 29850
    this.addData = function(data) {
        let opts = {
            animated: true,
            name: 'test name'
        };

        opts.animated = opts.animated || false;
        this.is_animated = opts.animated;
        if (opts.animated) {
            if (this._baseGeometry === undefined) {
                this._baseGeometry = new Geometry();
                for (let i = 0, m = data.nodes.length; i < m; i++) {
                    addPoint(data.nodes[i].lat, data.nodes[i].lng, 0, colorFn(data.td), this._baseGeometry);
                }
            }
            if(this._morphTargetId === undefined) {
                this._morphTargetId = 0;
            } else {
                this._morphTargetId += 1;
            }
            opts.name = opts.name || 'morphTarget' + this._morphTargetId;
        }
        let sub_geometry = new Geometry();
        for (let i = 0, m = data.nodes.length; i < m; i++) {
            //console.log(colorFn(data.td));
            addPoint(data.nodes[i].lat, data.nodes[i].lng, 0.1, colorFn(data.td), sub_geometry);
        }
        if (opts.animated) {
            this._baseGeometry.morphTargets.push({'name': opts.name, vertices: sub_geometry.vertices});
        } else {
            this._baseGeometry = sub_geometry;
        }
    };

    this.createPoints = function() {
        if (this._baseGeometry !== undefined) {
            if (this.is_animated === false) {
                this.points = new Mesh(this._baseGeometry, new MeshBasicMaterial({
                    color: 0xffffff,
                    vertexColors: FaceColors,
                    morphTargets: false
                }));
            } else {
                if (this._baseGeometry.morphTargets.length < 8) {
                    let padding = 8 - this._baseGeometry.morphTargets.length;
                    for(let i = 0; i <= padding; i++) {
                        this._baseGeometry.morphTargets.push({'name': 'morphPadding' + i, vertices: this._baseGeometry.vertices});
                    }
                }
                this.points = new Mesh(this._baseGeometry, new MeshBasicMaterial({
                    color: 0xffffff,
                    vertexColors: FaceColors,
                    morphTargets: true
                }));
            }
            scene.add(this.points);
        }
    };

    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function addPoint(lat, lng, size, color, sub_geometry) {

        let phi = (90 - lat) * Math.PI / 180;
        let theta = (180 - lng) * Math.PI / 180;

        point.position.x = 200 * Math.sin(phi) * Math.cos(theta);
        point.position.y = 200 * Math.cos(phi);
        point.position.z = 200 * Math.sin(phi) * Math.sin(theta);

        point.lookAt(mesh.position);

        point.scale.z = Math.max( size, 0.1 ); // avoid non-invertible matrix
        point.updateMatrix();

        for (let i = 0; i < point.geometry.faces.length; i++) {
            point.geometry.faces[i].color = color;
        }
        if(point.matrixAutoUpdate){
            point.updateMatrix();
        }
        sub_geometry.merge(point.geometry, point.matrix);
    }

    function onMouseDown(event) {
        event.preventDefault();
        container.addEventListener('mousemove', onMouseMove, false);
        container.addEventListener('mouseup', onMouseUp, false);
        container.addEventListener('mouseout', onMouseOut, false);
        mouseOnDown.x = - event.clientX;
        mouseOnDown.y = event.clientY;
        targetOnDown.x = target.x;
        targetOnDown.y = target.y;
        container.style.cursor = 'move';
    }

    function onMouseMove(event) {
        mouse.x = - event.clientX;
        mouse.y = event.clientY;
        let zoomDamp = distance/1000;
        target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
        target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;
        target.y = target.y > PI_HALF ? PI_HALF : target.y;
        target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
    }

    function onMouseUp() {
        container.removeEventListener('mousemove', onMouseMove, false);
        container.removeEventListener('mouseup', onMouseUp, false);
        container.removeEventListener('mouseout', onMouseOut, false);
        container.style.cursor = 'auto';
    }

    function onMouseOut() {
        container.removeEventListener('mousemove', onMouseMove, false);
        container.removeEventListener('mouseup', onMouseUp, false);
        container.removeEventListener('mouseout', onMouseOut, false);
    }

    function onMouseWheel(event) {
        event.preventDefault();
        if (overRenderer) {
            zoom(event.wheelDeltaY * 0.3);
        }
        return false;
    }

    function onDocumentKeyDown(event) {
        switch (event.keyCode) {
            case 38:
                zoom(100);
                event.preventDefault();
                break;
            case 40:
                zoom(-100);
                event.preventDefault();
                break;
        }
    }

    function onWindowResize( event ) {
        console.log(event)
        camera.aspect = container.offsetWidth / container.offsetHeight;
        camera.updateProjectionMatrix();
        renderer.setSize( container.offsetWidth, container.offsetHeight);
    }

    function zoom(delta) {
        distanceTarget -= delta;
        distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
        distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
    }

    function render() {
        zoom(curZoomSpeed);
        rotation.x += (target.x - rotation.x) * 0.1;
        rotation.y += (target.y - rotation.y) * 0.1;
        distance += (distanceTarget - distance) * 0.3;
        camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
        camera.position.y = distance * Math.sin(rotation.y);
        camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);
        camera.lookAt(mesh.position);
        renderer.render(scene, camera);
    }

    this.__defineGetter__('time', function() {
        return this._time || 0;
    });

    this.__defineSetter__('time', function(t) {
        var validMorphs = [];
        var morphDict = this.points.morphTargetDictionary;
        for(var k in morphDict) {
            if(k.indexOf('morphPadding') < 0) {
                validMorphs.push(morphDict[k]);
            }
        }
        validMorphs.sort();
        var l = validMorphs.length-1;
        var scaledt = t*l+1;
        var index = Math.floor(scaledt);
        for (let i = 0, m = validMorphs.length;i < m;i++) {
            this.points.morphTargetInfluences[validMorphs[i]] = 0;
        }
        var lastIndex = index - 1;
        var leftover = scaledt - index;
        if (lastIndex >= 0) {
            this.points.morphTargetInfluences[lastIndex] = 1 - leftover;
        }
        this.points.morphTargetInfluences[index] = leftover;
        this._time = t;
    });

    (function init() {

        container.style.color = '#fff';
        container.style.font = '13px/20px Arial, sans-serif';

        let w = container.offsetWidth || window.innerWidth;
        let h = container.offsetHeight || window.innerHeight;

        camera = new PerspectiveCamera(30, w / h, 1, 10000);
        camera.position.z = distance;

        scene = new Scene();

        let geometry = new SphereGeometry(200, 40, 30);
        let uniforms = UniformsUtils.clone(shader.uniforms);
        uniforms.texture.value = (new TextureLoader()).load('/world.jpg');
        let material = new ShaderMaterial({
            uniforms: uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader
        });

        mesh = new Mesh(geometry, material);
        mesh.rotation.y = Math.PI;
        scene.add(mesh);

        uniforms = UniformsUtils.clone(shader.uniforms);

        material = new ShaderMaterial({

            uniforms: uniforms,
            vertexShader: shader.vertexShader,
            fragmentShader: shader.fragmentShader,
            side: BackSide,
            blending: AdditiveBlending,
            transparent: true

        });

        mesh = new Mesh(geometry, material);
        mesh.scale.set( 1.1, 1.1, 1.1 );
        scene.add(mesh);

        geometry = new BoxGeometry(0.75, 0.75, 1);
        geometry.applyMatrix(new Matrix4().makeTranslation(0,0,-0.5));

        point = new Mesh(geometry);

        renderer = new WebGLRenderer({antialias: true});
        renderer.setSize(w, h);
        renderer.domElement.style.position = 'absolute';

        container.addEventListener('mousedown', onMouseDown, false);
        container.addEventListener('mousewheel', onMouseWheel, false);
        container.addEventListener('mouseover',()=>{overRenderer = true;}, false);
        container.addEventListener('mouseout',()=>{ overRenderer = false; }, false);
        container.appendChild(renderer.domElement);

        document.addEventListener('keydown', onDocumentKeyDown, false);
        window.addEventListener('resize', onWindowResize, false);
    })();

    if(renderer)
        this.renderer = renderer;
    if(scene)
        this.scene = scene;
    this.animate = animate;

    return this;

};