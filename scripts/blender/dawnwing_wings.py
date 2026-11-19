"""Build Dawnwing's two wings independently of the horse and tack."""

import math

import bmesh
import bpy
import numpy as np
from mathutils import Vector


JOINTS = (
    (.32, -.34, 2.04), (.88, -.27, 2.30), (1.45, -.29, 2.56),
    (2.08, -.40, 2.73), (2.66, -.48, 2.79),
)


def wing_height(span):
    return float(np.interp(span, [joint[0] for joint in JOINTS], [joint[2] for joint in JOINTS]))


def build_wings(material):
    collection = bpy.data.collections.new("WINGS | separate feather assemblies")
    bpy.context.scene.collection.children.link(collection)
    return [build_wing(side, material, collection) for side in (-1, 1)]


def build_wing(side, material, collection):
    verts, faces, uvs, anchors = [], [], [], []

    def skin_strip(rings, anchor=None):
        start = len(verts)
        count = len(rings[0])
        for row, ring in enumerate(rings):
            for column, point in enumerate(ring):
                verts.append((side * point.x, point.y, point.z))
                anchors.append(abs(point.x) if anchor is None else anchor)
                uvs.append((.5 + .49 * math.cos(math.tau * column / count), row / (len(rings) - 1)))
            if row > 0:
                previous = start + (row - 1) * count
                for column in range(count):
                    left = previous + column
                    right = previous + (column + 1) % count
                    faces.append((left, right, right + count, left + count))
        faces.append(tuple(start + column for column in range(count - 1, -1, -1)))
        faces.append(tuple(len(verts) - count + column for column in range(count)))

    mantle_rings = []
    for step in range(39):
        progress = step / 38
        span = .25 + 2.43 * progress
        center_y = -.23 - .16 * progress**1.8 + .075 * math.sin(math.pi * progress)
        center_z = wing_height(span) - .019
        shoulder = math.exp(-((progress - .085) / .22)**2)
        fringe = max(.045, (1 - progress)**.51)
        half_chord = (.19 + .11 * shoulder) * fringe
        half_thickness = (.049 + .079 * shoulder) * fringe
        mantle_rings.append([
            Vector((span, center_y + half_chord * math.cos(theta),
                    center_z + half_thickness * math.sin(theta) - .06 * math.cos(theta)))
            for theta in [math.tau * column / 32 for column in range(32)]
        ])
    skin_strip(mantle_rings)

    def feather(root, tip, width, thickness, curvature=.048):
        root, tip = Vector(root), Vector(tip)
        direction = tip - root
        cross = Vector((-direction.y, direction.x, 0)).normalized()
        rings = []
        for row in range(15):
            t = row / 14
            profile = max(.055, math.sin(math.pi * t)**.49) * (1.14 - .30 * t)
            center = root + direction * t
            center.z += curvature * math.sin(math.pi * t)
            rings.append([
                center + cross * (math.cos(theta) * width * profile)
                + Vector((0, 0, math.sin(theta) * thickness * profile))
                for theta in [math.tau * column / 12 for column in range(12)]
            ])
        skin_strip(rings, root.x)

    fan = []
    for index in range(14):
        fraction = index / 13
        span = .39 + 1.34 * fraction
        root = Vector((span, -.12 + .018 * fraction, wing_height(span) + .007))
        variation = math.sin(index * 2.399963)
        tip = root + Vector((.16 + .46 * fraction, .58 + .38 * fraction + .027 * variation,
                             -.15 - .13 * fraction))
        fan.append((root, tip, .119 + .029 * fraction + .005 * variation))
    for index in range(11):
        fraction = index / 10
        span = 1.77 + .85 * fraction
        root = Vector((span, -.11 - .38 * fraction, wing_height(span) + .012))
        tip = Vector((2.18 + .97 * fraction, .84 - .78 * fraction, wing_height(span) - .22 + .18 * fraction))
        fan.append((root, tip, .156 - .059 * fraction))
    for index, (root, tip, width) in enumerate(fan):
        feather(root, tip, width, .013)
        if index % 2 == 0:
            cover_root = root + Vector((.019, -.045, .069))
            cover_tip = cover_root + (tip - root) * (.48 + .045 * math.sin(index * 1.64))
            feather(cover_root, cover_tip, width * 1.15, .010, .023)
        if index % 2 == 1 and index < 23:
            span = root.x
            amount = (span - .25) / 2.43
            shoulder = math.exp(-((amount - .085) / .22)**2)
            lower_profile = (.045 + .084 * shoulder) * (1 - amount)**.51
            lower_root = root + Vector((-.005, -.135 + .032 * amount, -.020 - lower_profile))
            lower_tip = lower_root + (tip - root) * (.61 + .052 * math.sin(index * 1.53))
            lower_tip.x += .064
            lower_tip.z -= .010
            feather(lower_root, lower_tip, width * .96, .007, -.014)

    name = "Dawnwing Left Wing" if side < 0 else "Dawnwing Right Wing"
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts, [], faces)
    normals = bmesh.new()
    normals.from_mesh(mesh)
    bmesh.ops.recalc_face_normals(normals, faces=list(normals.faces))
    normals.to_mesh(mesh)
    normals.free()
    mesh.materials.append(material)
    uv_layer = mesh.uv_layers.new(name="UVMap")
    for loop in mesh.loops:
        uv_layer.data[loop.index].uv = uvs[loop.vertex_index]
    for polygon in mesh.polygons:
        polygon.use_smooth = True
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    collection.objects.link(obj)
    return obj, np.asarray(anchors)
