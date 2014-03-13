var inherits = require('inherits');
var lsb = require('lsb');
var EventEmitter = require('events').EventEmitter;
var Creature = require('voxel-creature').Creature;
module.exports = function(game) {
    return function(opts) {
        return new Vader(game, opts || {});
    };
};

inherits(Vader, Creature);
module.exports.Vader = Vader;

function Vader(game, opts) {
    if (!opts) opts = {};
    if (opts.cPool == undefined) opts.cPool = [0x800830, 0x7F0863, 660000, 0x5B001A, 0x65087F];
    if (opts.clr == undefined) opts.clr = [new game.THREE.Color(opts.cPool[Math.floor(Math.random() * opts.cPool.length)]), new game.THREE.Color(opts.cPool[Math.floor(Math.random() * opts.cPool.length)])];
    if (opts.amb == undefined) opts.amb = [0x800830, 0x800830];
    if (opts.size == undefined) opts.size = 5;
    if (opts.step == undefined) opts.step = opts.size / 5;
    if (opts.padding == undefined) opts.padding = parseInt(opts.size / 2);
    if (opts.points == undefined) opts.points = 10;
    if (opts.damage == undefined) opts.damage = 1;
    if (opts.mats == undefined) opts.mats = [
        new game.THREE.MeshPhongMaterial({
            color: opts.clr[0],
            ambient: opts.clr[0],
            specular: 0xffff00,
            emissive: 0x111111,
            shininess: 100
        }),
        new game.THREE.MeshLambertMaterial({
            ccolor: opts.clr[1],
            ambient: opts.clr[1],
            specular: 0xffff00,
            emissive: 0x111111,
            shininess: 100
        }),
    ];
    var vB = require('voxel-bullet');
    this._vaderBullet = vB(game)();

    var _mSpeed = .2;
    var _mRot = .1;
    this.xd = Math.random() * _mSpeed * 2 - _mSpeed;
    this.yd = Math.random() * _mSpeed * 2 - _mSpeed;
    this.zd = Math.random() * _mSpeed * 2 - _mSpeed;
    this.xrd = Math.random() * _mRot * 2 - _mRot;
    this.zrd = Math.random() * _mRot * 2 - _mRot;
    this.yrd = Math.random() * _mRot * 2 - _mRot;
    this.cPool = opts.cPool;
    this.size = opts.size;
    this.step = opts.step;
    this.points = opts.points;
    this.padding = opts.padding;
    this.mats = opts.mats;
    this.damage = opts.damage;

    var createVader = function(mat) {
        return new game.THREE.Mesh(
            new game.THREE.CubeGeometry(1, 1, 1),
            mat
        );
    }
    var VaderMesh = function(obj) {
        obj.vaderObj = new game.THREE.Object3D;
        obj.bg = new game.THREE.Object3D();
        var col = [];
        for (var j = 0; j < obj.size; j += obj.step) {
            var m = 1;
            col[j] = [];
            for (var i = 0; i < obj.size / 2; i += obj.step) {
                c = (Math.random(1) > .5) ? false : true;
                col[j][i] = c;
                col[j][i + (obj.size - obj.step) / m] = c;
                m++;
            }
        }
        for (var j = 0; j < obj.size; j += obj.step) {
            for (var i = 0; i < obj.size; i += obj.step) {
                var vaders = createVader(obj.mats[0]);
                var vader2 = createVader(obj.mats[0]);
                var vadersBG = createVader(obj.mats[1]);
                vadersBG.position.set(i, j, 4);
                vadersBG.visible = col[j][i];
                vaders.position.set(i, j, 5);
                vaders.visible = col[j][i];
                vader2.position.set(i, j, 6);
                vader2.visible = col[j][i];
                vadersBG.vaderT = "bg";
                vaders.vaderT = "front";
                vader2.vaderT = "front";
                obj.bg.add(vadersBG);
                obj.vaderObj.add(obj.bg);
                obj.vaderObj.add(vaders);
                obj.vaderObj.add(vader2);
            }
        }
        return obj.vaderObj;
    }

    var vd = VaderMesh(this);
    /// merging geometry
    var visibileArrBG = new Array();
    var visibileArr = new Array();
    var meshInvaderVisibile = function(obj) {
        for (var i = 0; obj.children.length > i; i++) {
            if (obj.children[i].children.length == 0 && obj.children[i].visible == true && obj.children[i].vaderT == "bg") {
                visibileArrBG.push(obj.children[i]);
            } else if (obj.children[i].visible == true && obj.children[i].vaderT == "front") {
                visibileArr.push(obj.children[i]);
            } else {
                meshInvaderVisibile(obj.children[i])
            }
        }
    }
    meshInvaderVisibile(vd);
    var mergedGeo = new game.THREE.Geometry();
    var mergedGeoBG = new game.THREE.Geometry();
    for (var i = 0; visibileArr.length > i; i++) {
        if (i != 0) {
            game.THREE.GeometryUtils.merge(mergedGeo, visibileArr[i]);
        }
    }
    for (var i = 0; visibileArrBG.length > i; i++) {
        if (i != 0) {
            game.THREE.GeometryUtils.merge(mergedGeoBG, visibileArrBG[i]);
        }
    }

    var customMaterial = new game.THREE.ShaderMaterial({
        uniforms: {
            "c": {
                type: "f",
                value: 0
            },
            "p": {
                type: "f",
                value: 5.3
            },
            glowColor: {
                type: "c",
                value: new game.THREE.Color(0xffff00)
            },
            viewVector: {
                type: "v3",
                value: player.currentCamera
            }
        },
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent,
        side: game.THREE.DoubleSide,
        blending: game.THREE.AdditiveBlending,
        opacity: 0.3,
        transparent: true
    });
    this.groups = [];
    this.groups.push(new game.THREE.Mesh(mergedGeoBG, this.mats[0]));
    this.groups[(this.groups.length - 1)].isGlowing = false;
    this.groups.push(new game.THREE.Mesh(mergedGeoBG, customMaterial.clone()));
    this.groups[(this.groups.length - 1)].scale.multiplyScalar(1.1);
    this.groups[(this.groups.length - 1)].isGlowing = true;

    this.groups.push(new game.THREE.Mesh(mergedGeo, customMaterial.clone()));
    this.groups[(this.groups.length - 1)].scale.multiplyScalar(1.1);
    this.groups[(this.groups.length - 1)].isGlowing = true;
    this.groups.push(new game.THREE.Mesh(mergedGeo, this.mats[1]));
    this.groups[(this.groups.length - 1)].isGlowing = false;
    var removeNonMerged = function(obj) {
        for (var i = 0; obj.children.length > i; i++) {
            if (obj.children != undefined && obj.children[i].children.length == 0 && obj.children[i].visible == true) {
                obj.children[i].visible = false;
                obj.children[i].vaderT = "hidden";
                removeNonMerged(vd);
            } else if (obj.children != undefined) {
                removeNonMerged(obj.children[i]);
            }
        }
    }
    removeNonMerged(vd);
    for (var i = 0; i < this.groups.length; i++) {
        vd.add(this.groups[i]);
    }

    var spaceVader = Creature.call(this, game, vd, {
        size: opts.size
    });

    this.on('notice', function(player) {
        this.lookAt(player);
        this.move(((player.position.x - this.position.x) * 0.0005), ((player.position.y - this.position.y) * 0.0005), ((player.position.z - this.position.z) * 0.0005));
        var rP = this.position;
        var bArr = [new game.THREE.Vector3(rP.x, rP.y, rP.z)];
        if (_initGame == true) {
            this._vaderBullet.BuildBullets({
                count: 1,
                rootVector: player.position,
                rootPosition: rP,
                bulletPosition: bArr,
                target: [player],
                owner: 0
            });
        }
    });

    this.on('collide', function(player) {
        if (_initGame == true) {
            player.health -= this.damage;
            healtHit(1.0 - (player.health / 100));
        }
    });

    var _VD = this;
    game.on('tick', function(delta) {
        if (_VD != undefined) {
            for (var i = 0; i < _VD.groups.length; i++) {
                if (_VD.groups[i].isGlowing) {
                    _VD.groups[i].material.uniforms.viewVector.value =
                        new game.THREE.Vector3().subVectors(player.currentCamera.position, _VD.position);
                }
            }
        }

        if (typeof _VD._vaderBullet != undefined && _initGame == true && _VD.item != null) {
            var speed = delta * _VD._vaderBullet.speed;
            _delta = delta;
            for (var i = _VD._vaderBullet.live.length - 1; i >= 0; i--) {
                try {
                    var b = _VD._vaderBullet.live[i].mesh;
                    var gcDist = b.position.distanceTo(game.camera.position);
                    if (game.camera.far < gcDist) {
                        _VD._vaderBullet.live.splice(b.id, 1);
                        b.Destroy();
                        game.scene.remove(b);
                    }
                    var p = b.position,
                        d = b.ray.direction;
                    b.translateX(speed * d.x);
                    b.translateY(speed * d.y);
                    b.translateZ(speed * d.z);
                } catch (e) {
                    break;
                }
            }
        }
    });

    this.notice(player, {
        radius: 500
    });

    setInterval(function() {
        if (this.noticed) return;
    }, 1000);




    return spaceVader;

}

Vader.prototype.Destroy = function() {
    try {
        game.scene.remove(this.vaderObj);
        this.removeAllListeners();
        this.vaderObj.visible = false;
        this._events.notice = null;
        this._events.collide = null;

    } catch (e) {
        //console.log(e);
    }
}

Vader.prototype.Explode = function() {
    var blockArr = [],
        _vd = this;
    this.removeAllListeners();
    this._events.notice = null;
    this._events.collide = null;
    this.move = null;
    var showGeo = function(obj) {
        for (var i = 0; obj.children.length > i; i++) {
            if (obj.children != undefined && obj.children[i].children.length == 0 && obj.children[i].vaderT == 'hidden' && obj.children[i].visible == false) {
                obj.children[i].visible = true;
                obj.children[i].vaderT = "hidden";
                blockArr.push(obj.children[i]);
                showGeo(obj);
            } else if (obj.children != undefined) {
                showGeo(obj.children[i]);
            }
        }
    }
    showGeo(this.vaderObj);

    for (var i = 0; i < this.groups.length; i++) {
        this.groups[i].visible = false;
    }
    var _vObj = {
        vaderObj: blockArr,
        zd: this.zd,
        yd: this.yd,
        xd: this.xd,
        xd: this.xd,
        xrd: this.xrd,
        yrd: this.yrd,
        zrd: this.zrd
    };

    setTimeout(function() {
        try {
            game.scene.remove(_vd.item.avatar);
            _vd.item = null;
        } catch (e) {
            //console.log(e);
        }
    }, 5000);
    setInterval(function() {
        for (var i = 0; _vObj.vaderObj.length > i; i++) {
            //  var matrix = new game.THREE.Matrix4().getInverse(_vObj.vaderObj[i].matrixWorld);
            // var vector = _vObj.vaderObj[i].position.getPositionFromMatrix(matrix);
            /* _vObj.vaderObj[i].position.x = vector.x + _vObj.xd;
            _vObj.vaderObj[i].position.y = vector.y + _vObj.yd;
            _vObj.vaderObj[i].position.z = vector.z + _vObj.zd;*/
            if (_vObj.vaderObj[i].visible == true) {
                _vObj.vaderObj[i].visible = false;
            } else {
                _vObj.vaderObj[i].visible = true;
            }
            _vObj.vaderObj[i].position.x += _vObj.xd;
            _vObj.vaderObj[i].position.y += _vObj.yd;
            _vObj.vaderObj[i].position.z += _vObj.zd;
            _vObj.vaderObj[i].rotation.x += _vObj.xrd;
            _vObj.vaderObj[i].rotation.z += _vObj.zrd;
            _vObj.vaderObj[i].rotation.y += _vObj.yrd;
        }
    }, 1000 / 60);
    return this.points;
}