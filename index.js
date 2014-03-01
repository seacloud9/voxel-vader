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
    if (opts.clr == undefined) opts.clr = [0xffffff, 0x800830];
    if (opts.amb == undefined) opts.amb = [0x800830, 0x800830];
    if (opts.size == undefined) opts.size = 5;
    if (opts.step == undefined) opts.step = opts.size / 5;
    if (opts.padding == undefined) opts.padding = parseInt(opts.size / 2);
    if (opts.message == undefined) opts.message = 'wtf';
    if (opts.mats == undefined) opts.mats = [
        new game.THREE.MeshLambertMaterial({
            color: opts.clr[1],
            ambient: opts.amb[1]
        }),
        new game.THREE.MeshLambertMaterial({
            color: opts.clr[0],
            ambient: opts.amb[0]
        }),
    ];
    this.size = opts.size;
    this.step = opts.step;
    this.padding = opts.padding;
    this.mats = opts.mats;

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
    groups = [];
    groups.push(new game.THREE.Mesh(mergedGeoBG, this.mats[0]));
    groups.push(new game.THREE.Mesh(mergedGeo, this.mats[1]));

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
    for (var i = 0; i < groups.length; i++) {
        vd.add(groups[i]);
    }

    var spaceVader = Creature.call(this, game, vd, {
        size: opts.size
    });
    return spaceVader;

}